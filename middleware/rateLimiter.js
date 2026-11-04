// In-memory IP-based rate limiter middleware for sensitive auth endpoints.
// Designed without external dependencies for speed, portability, and zero-footprint resilience.

const attemptsByIp = new Map();

// Default: max 10 failed/total login attempts per 15 minutes per IP address
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

// Periodic cleanup to avoid memory leak from stale IP entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of attemptsByIp.entries()) {
    if (now - data.firstAttemptTime > WINDOW_MS) {
      attemptsByIp.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

export function loginRateLimiter(req, res, next) {
  // Extract client IP (respecting standard reverse-proxy headers if present)
  const clientIp =
    (typeof req.headers["x-forwarded-for"] === "string"
      ? req.headers["x-forwarded-for"].split(",")[0].trim()
      : null) ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown";

  const now = Date.now();
  const record = attemptsByIp.get(clientIp);

  if (!record) {
    attemptsByIp.set(clientIp, { count: 1, firstAttemptTime: now });
    return next();
  }

  // If window has passed, reset the counter
  if (now - record.firstAttemptTime > WINDOW_MS) {
    attemptsByIp.set(clientIp, { count: 1, firstAttemptTime: now });
    return next();
  }

  // Check if limit exceeded
  if (record.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((WINDOW_MS - (now - record.firstAttemptTime)) / 60000);
    return res.status(429).json({
      success: false,
      message: `Too many login attempts. Please try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
    });
  }

  record.count += 1;
  return next();
}

// Reset rate limiter on successful authentication
export function resetLoginRateLimit(clientIp) {
  if (clientIp && attemptsByIp.has(clientIp)) {
    attemptsByIp.delete(clientIp);
  }
}

