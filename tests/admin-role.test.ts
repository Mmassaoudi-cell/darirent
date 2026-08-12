import assert from "node:assert/strict";
import test from "node:test";
import { roleForAuthenticatedEmail } from "../app/lib/admin-role.ts";

test("the configured authenticated email receives the admin role", () => {
  assert.equal(
    roleForAuthenticatedEmail(
      " MMASSAOUDI@TARLETON.EDU ",
      "mmassaoudi@tarleton.edu",
      "renter",
    ),
    "admin",
  );
});

test("other authenticated emails keep their requested role", () => {
  assert.equal(
    roleForAuthenticatedEmail("owner@example.com", "mmassaoudi@tarleton.edu", "owner"),
    "owner",
  );
  assert.equal(
    roleForAuthenticatedEmail("renter@example.com", undefined, "renter"),
    "renter",
  );
});
