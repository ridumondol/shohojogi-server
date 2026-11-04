import jwt from "jsonwebtoken";

function extractTokenFromRequest(req) {
  // 1. Check Authorization Bearer header first
  const authorization = req.headers?.authorization;
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
    const bearer = authorization.slice("Bearer ".length).trim();
    if (bearer) return bearer;
  }

  // 2. Check req.cookies if cookie-parser is used
  if (req.cookies && typeof req.cookies.token === "string" && req.cookies.token.trim()) {
    return req.cookies.token.trim();
  }

  // 3. Fallback: Parse raw Cookie header directly
  const rawCookieHeader = req.headers?.cookie;
  if (typeof rawCookieHeader === "string") {
    const match = rawCookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
    if (match && match[1]) {
      try {
        return decodeURIComponent(match[1]).trim();
      } catch {
        return match[1].trim();
      }
    }
  }

  return null;
}

export function verifyToken(req, res, next) {
  const token = extractTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication is required. Please log in.",
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded !== "object" || typeof decoded.email !== "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
}
