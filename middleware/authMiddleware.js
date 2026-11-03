import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication is required. Please log in.",
    });
  }

  const token = authorization.slice("Bearer ".length).trim();
  const secret = process.env.JWT_SECRET;

  if (!secret || !token) {
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
