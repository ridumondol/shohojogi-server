import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";
import { resetLoginRateLimit } from "../middleware/rateLimiter.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;

function validPhotoUrl(value) {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function publicUser(user) {
  return {
    id: user._id?.toString(),
    name: user.name,
    email: user.email,
    photoURL: user.photoURL || "",
    role: user.role || "user",
    createdAt: user.createdAt,
  };
}

export function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

export function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
}

export async function registerUser(req, res) {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const photoURL = typeof req.body?.photoURL === "string" ? req.body.photoURL.trim() : "";

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email, and password are required." });
  }
  if (!emailPattern.test(email)) return res.status(400).json({ success: false, message: "Please provide a valid email address." });
  if (!passwordPattern.test(password)) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters and include uppercase and lowercase letters." });
  }
  if (name.length > 80) return res.status(400).json({ success: false, message: "Name must be 80 characters or fewer." });
  if (!validPhotoUrl(photoURL)) return res.status(400).json({ success: false, message: "Profile photo must be a valid HTTP or HTTPS URL." });

  try {
    const db = await getDB();
    const users = db.collection("users");
    const existing = await users.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: "Email is already registered." });

    const newUser = {
      name,
      email,
      password: await bcrypt.hash(password, 12),
      photoURL,
      role: "user",
      createdAt: new Date(),
    };
    const result = await users.insertOne(newUser);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: publicUser({ ...newUser, _id: result.insertedId }),
    });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: "Email is already registered." });
    console.error("Registration failed:", error);
    return res.status(500).json({ success: false, message: "Registration failed." });
  }
}

export async function loginUser(req, res) {
  // Input sanitization: ensure strict string extraction and trim email
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password || !emailPattern.test(email)) {
    return res.status(400).json({ success: false, message: "A valid email and password are required." });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ success: false, message: "Authentication is not configured on the server." });

  try {
    const db = await getDB();
    const user = await db.collection("users").findOne({ email });

    // Generic error message that doesn't leak whether the email exists
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role || "user" },
      secret,
      { expiresIn: "7d", issuer: "shohojogi-api", audience: "shohojogi-client" }
    );

    // Persist session in HttpOnly, Secure, SameSite cookie
    setAuthCookie(res, token);

    // Reset rate limiter for this client IP on successful login
    const clientIp =
      (typeof req.headers["x-forwarded-for"] === "string"
        ? req.headers["x-forwarded-for"].split(",")[0].trim()
        : null) ||
      req.socket?.remoteAddress ||
      req.ip;
    resetLoginRateLimit(clientIp);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ success: false, message: "Login failed." });
  }
}

export async function logoutUser(req, res) {
  clearAuthCookie(res);
  return res.status(200).json({ success: true, message: "Logged out successfully." });
}

export async function getMyProfile(req, res) {
  try {
    const db = await getDB();
    const user = await db.collection("users").findOne({ email: req.user.email }, { projection: { password: 0 } });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.status(200).json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.error("Get profile failed:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch profile." });
  }
}

export async function updateMyProfile(req, res) {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const photoURL = typeof req.body?.photoURL === "string" ? req.body.photoURL.trim() : "";
  if (!name || name.length > 80) return res.status(400).json({ success: false, message: "Name is required and must be 80 characters or fewer." });
  if (!validPhotoUrl(photoURL)) return res.status(400).json({ success: false, message: "Profile photo must be a valid HTTP or HTTPS URL." });

  try {
    const db = await getDB();
    const result = await db.collection("users").findOneAndUpdate(
      { email: req.user.email },
      { $set: { name, photoURL, updatedAt: new Date() } },
      { returnDocument: "after", projection: { password: 0 } }
    );
    const updatedUser = result?.value ?? result;
    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found." });
    return res.status(200).json({ success: true, message: "Profile updated successfully.", user: publicUser(updatedUser) });
  } catch (error) {
    console.error("Update profile failed:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile." });
  }
}

export async function changePassword(req, res) {
  const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
  if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: "Current and new passwords are required." });
  if (!passwordPattern.test(newPassword)) {
    return res.status(400).json({ success: false, message: "New password must be at least 6 characters and include uppercase and lowercase letters." });
  }

  try {
    const db = await getDB();
    const users = db.collection("users");
    const user = await users.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (!user.password || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    await users.updateOne(
      { email: req.user.email },
      { $set: { password: await bcrypt.hash(newPassword, 12), updatedAt: new Date() } }
    );
    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("Change password failed:", error);
    return res.status(500).json({ success: false, message: "Failed to change password." });
  }
}

// Google OAuth 2.0 implementation
export function initiateGoogleOAuth(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get("host")}/api/users/oauth/google/callback`;

  if (!clientId) {
    return res.status(503).json({
      success: false,
      message: "Google OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the server .env file.",
    });
  }

  const returnTo = typeof req.query?.returnTo === "string" ? req.query.returnTo : "/dashboard";
  const state = Buffer.from(JSON.stringify({ returnTo, nonce: Math.random().toString(36).substring(2) })).toString("base64url");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid profile email");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("prompt", "select_account");

  return res.redirect(googleAuthUrl.toString());
}

export async function handleGoogleOAuthCallback(req, res) {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").split(",")[0].trim();
  const loginUrl = `${clientUrl}/login`;

  const { code, error, state } = req.query;

  let returnTo = "/dashboard";
  if (typeof state === "string") {
    try {
      const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
      if (typeof parsed?.returnTo === "string" && parsed.returnTo.startsWith("/") && !parsed.returnTo.startsWith("//")) {
        returnTo = parsed.returnTo;
      }
    } catch {
      // keep default returnTo
    }
  }

  if (error || !code) {
    const errorMsg = error === "access_denied" ? "Google sign-in was cancelled." : "Google authentication failed.";
    return res.redirect(`${loginUrl}?error=${encodeURIComponent(errorMsg)}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get("host")}/api/users/oauth/google/callback`;

  if (!clientId || !clientSecret) {
    return res.redirect(`${loginUrl}?error=${encodeURIComponent("Google OAuth credentials are not configured on the server.")}`);
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData);
      return res.redirect(`${loginUrl}?error=${encodeURIComponent("Failed to exchange Google authorization code.")}`);
    }

    // 2. Fetch user profile from Google UserInfo
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userinfoResponse.json();

    if (!userinfoResponse.ok || !profile?.email) {
      console.error("Google userinfo fetch failed:", profile);
      return res.redirect(`${loginUrl}?error=${encodeURIComponent("Failed to fetch Google profile.")}`);
    }

    const email = profile.email.trim().toLowerCase();
    const name = profile.name?.trim() || email.split("@")[0] || "Google User";
    const photoURL = profile.picture || "";
    const googleId = profile.sub;

    const db = await getDB();
    const users = db.collection("users");

    // 3. Find or create user
    let user = await users.findOne({ email });
    if (!user) {
      const newUser = {
        name,
        email,
        photoURL,
        googleId,
        role: "user",
        createdAt: new Date(),
      };
      const result = await users.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else if (!user.googleId || (!user.photoURL && photoURL)) {
      await users.updateOne(
        { _id: user._id },
        { $set: { googleId, ...(user.photoURL ? {} : { photoURL }) } }
      );
      if (!user.photoURL && photoURL) user.photoURL = photoURL;
    }

    // 4. Generate JWT
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role || "user" },
      secret,
      { expiresIn: "7d", issuer: "shohojogi-api", audience: "shohojogi-client" }
    );

    // 5. Persist session in HttpOnly cookie
    setAuthCookie(res, token);

    // 6. Redirect to frontend with token & user so client syncs navbar & localStorage immediately
    const userJson = encodeURIComponent(JSON.stringify(publicUser(user)));
    return res.redirect(
      `${loginUrl}?oauth_success=1&token=${encodeURIComponent(token)}&user=${userJson}&returnTo=${encodeURIComponent(returnTo)}`
    );
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return res.redirect(`${loginUrl}?error=${encodeURIComponent("An error occurred during Google sign-in.")}`);
  }
}

// GitHub OAuth 2.0 implementation
export function initiateGitHubOAuth(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL || `${req.protocol}://${req.get("host")}/api/users/oauth/github/callback`;

  if (!clientId) {
    return res.status(503).json({
      success: false,
      message: "GitHub OAuth is not configured on the server. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in the server .env file.",
    });
  }

  const returnTo = typeof req.query?.returnTo === "string" ? req.query.returnTo : "/dashboard";
  const state = Buffer.from(JSON.stringify({ returnTo, nonce: Math.random().toString(36).substring(2) })).toString("base64url");

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("scope", "read:user user:email");
  githubAuthUrl.searchParams.set("state", state);

  return res.redirect(githubAuthUrl.toString());
}

export async function handleGitHubOAuthCallback(req, res) {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").split(",")[0].trim();
  const loginUrl = `${clientUrl}/login`;

  const { code, error, state } = req.query;

  let returnTo = "/dashboard";
  if (typeof state === "string") {
    try {
      const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
      if (typeof parsed?.returnTo === "string" && parsed.returnTo.startsWith("/") && !parsed.returnTo.startsWith("//")) {
        returnTo = parsed.returnTo;
      }
    } catch {
      // keep default returnTo
    }
  }

  if (error || !code) {
    const errorMsg = error === "access_denied" ? "GitHub sign-in was cancelled." : "GitHub authentication failed.";
    return res.redirect(`${loginUrl}?error=${encodeURIComponent(errorMsg)}`);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_CALLBACK_URL || `${req.protocol}://${req.get("host")}/api/users/oauth/github/callback`;

  if (!clientId || !clientSecret) {
    return res.redirect(`${loginUrl}?error=${encodeURIComponent("GitHub OAuth credentials are not configured on the server.")}`);
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: String(code),
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("GitHub token exchange failed:", tokenData);
      return res.redirect(`${loginUrl}?error=${encodeURIComponent("Failed to exchange GitHub authorization code.")}`);
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Shohojogi-App",
      },
    });
    const profile = await userResponse.json();

    if (!userResponse.ok || !profile) {
      console.error("GitHub user profile fetch failed:", profile);
      return res.redirect(`${loginUrl}?error=${encodeURIComponent("Failed to fetch GitHub profile.")}`);
    }

    // 3. Resolve user email (GitHub user profile may have private email)
    let email = profile.email ? profile.email.trim().toLowerCase() : null;

    if (!email) {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "Shohojogi-App",
        },
      });
      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        if (Array.isArray(emails) && emails.length > 0) {
          const primaryEmail = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) || emails[0];
          if (primaryEmail?.email) {
            email = primaryEmail.email.trim().toLowerCase();
          }
        }
      }
    }

    // Fallback if no public/private email is returned
    if (!email) {
      email = `${profile.login}@users.noreply.github.com`;
    }

    const name = profile.name?.trim() || profile.login || "GitHub User";
    const photoURL = profile.avatar_url || "";
    const githubId = String(profile.id);

    const db = await getDB();
    const users = db.collection("users");

    // 4. Find or create user
    let user = await users.findOne({ email });
    if (!user) {
      const newUser = {
        name,
        email,
        photoURL,
        githubId,
        role: "user",
        createdAt: new Date(),
      };
      const result = await users.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else if (!user.githubId || (!user.photoURL && photoURL)) {
      await users.updateOne(
        { _id: user._id },
        { $set: { githubId, ...(user.photoURL ? {} : { photoURL }) } }
      );
      if (!user.photoURL && photoURL) user.photoURL = photoURL;
    }

    // 5. Generate JWT
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role || "user" },
      secret,
      { expiresIn: "7d", issuer: "shohojogi-api", audience: "shohojogi-client" }
    );

    // 6. Persist session in HttpOnly cookie
    setAuthCookie(res, token);

    // 7. Redirect to frontend with token & user so client syncs navbar & localStorage
    const userJson = encodeURIComponent(JSON.stringify(publicUser(user)));
    return res.redirect(
      `${loginUrl}?oauth_success=1&token=${encodeURIComponent(token)}&user=${userJson}&returnTo=${encodeURIComponent(returnTo)}`
    );
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    return res.redirect(`${loginUrl}?error=${encodeURIComponent("An error occurred during GitHub sign-in.")}`);
  }
}
