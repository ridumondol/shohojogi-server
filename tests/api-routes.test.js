import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
const { app } = await import("../index.js");

async function withServer(run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not start test server.");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("health endpoint is available without authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, status: "ok" });
  });
});

test("private event routes reject a missing bearer token with 401", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/events/my-events`);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).success, false);
  });
});

test("private dashboard route rejects an invalid bearer token with 401", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/dashboard/stats`, {
      headers: { Authorization: "Bearer invalid-token" },
    });
    assert.equal(response.status, 401);
  });
});

test("event details route is public and validates the identifier", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/events/not-an-object-id`);
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /Invalid event ID/);
  });
});

test("development client origin is permitted by CORS", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`, { headers: { Origin: "http://localhost:3000" } });
    assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:3000");
  });
});

test("private profile update route rejects missing bearer token with 401", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jane Doe" }),
    });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).success, false);
  });
});

test("private cancel participation route rejects missing bearer token with 401", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/events/64f1a2b3c4d5e6f7a8b9c0d1/join`, {
      method: "DELETE",
    });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).success, false);
  });
});
