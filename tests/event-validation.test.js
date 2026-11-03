import test from "node:test";
import assert from "node:assert/strict";
import { validateEventInput } from "../controllers/eventController.js";

const validEvent = {
  title: "Winter Clothes Distribution",
  category: "Donation",
  date: "2099-12-15",
  location: "Mirpur 10, Dhaka",
  image: "https://example.com/event.jpg",
  description: "Distribute warm clothes to families in need.",
};

test("accepts a complete future event", () => {
  assert.deepEqual(validateEventInput(validEvent), { values: validEvent });
});

test("rejects missing required fields", () => {
  const result = validateEventInput({ ...validEvent, title: " " });
  assert.match(result.error, /title/);
});

test("rejects past dates", () => {
  const result = validateEventInput({ ...validEvent, date: "2000-01-01" });
  assert.equal(result.error, "Event date must be in the future.");
});

test("rejects malformed dates", () => {
  const result = validateEventInput({ ...validEvent, date: "2099-02-31" });
  assert.match(result.error, /valid event date/);
});

test("rejects non-HTTP image URLs", () => {
  const result = validateEventInput({ ...validEvent, image: "javascript:alert(1)" });
  assert.match(result.error, /HTTP or HTTPS/);
});

test("rejects unsupported event categories", () => {
  const result = validateEventInput({ ...validEvent, category: "Something Else" });
  assert.equal(result.error, "Please select a valid event type.");
});

test("accepts event categories offered by the client", () => {
  for (const category of ["Cleanup", "Plantation", "Volunteer", "Donation", "Environment", "Education", "Healthcare", "Community"]) {
    assert.equal(validateEventInput({ ...validEvent, category }).error, undefined);
  }
});
