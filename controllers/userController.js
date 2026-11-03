import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";

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
    id: user._id,
    name: user.name,
    email: user.email,
    photoURL: user.photoURL || "",
    role: user.role || "user",
    createdAt: user.createdAt,
  };
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
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role || "user" },
      secret,
      { expiresIn: "7d", issuer: "shohojogi-api", audience: "shohojogi-client" }
    );

    return res.status(200).json({ success: true, message: "Login successful.", token, user: publicUser(user) });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ success: false, message: "Login failed." });
  }
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
