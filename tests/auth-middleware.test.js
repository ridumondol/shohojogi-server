import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/authMiddleware.js";

function mockResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

test("accepts a correctly signed bearer token and exposes the user claims", () => {
  process.env.JWT_SECRET = "test-secret-for-middleware";
  const token = jwt.sign(
    { email: "member@example.com", role: "user" },
    process.env.JWT_SECRET,
    { issuer: "shohojogi-api", audience: "shohojogi-client" }
  );
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  let nextCalled = false;

  verifyToken(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.user.email, "member@example.com");
  assert.equal(res.statusCode, 200);
});

test("accepts a correctly signed JWT inside a cookie and exposes user claims", () => {
  process.env.JWT_SECRET = "test-secret-for-middleware";
  const token = jwt.sign(
    { email: "cookie-user@example.com", role: "user" },
    process.env.JWT_SECRET,
    { issuer: "shohojogi-api", audience: "shohojogi-client" }
  );
  const req = { headers: { cookie: `other=123; token=${token}; theme=dark` } };
  const res = mockResponse();
  let nextCalled = false;

  verifyToken(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.user.email, "cookie-user@example.com");
  assert.equal(res.statusCode, 200);
});

test("rejects a bearer token without a valid signature", () => {
  process.env.JWT_SECRET = "test-secret-for-middleware";
  const req = { headers: { authorization: "Bearer invalid" } };
  const res = mockResponse();
  let nextCalled = false;

  verifyToken(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.payload.success, false);
});

test("rejects a request with missing authorization header and cookie", () => {
  process.env.JWT_SECRET = "test-secret-for-middleware";
  const req = { headers: {} };
  const res = mockResponse();
  let nextCalled = false;

  verifyToken(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.payload.success, false);
});
