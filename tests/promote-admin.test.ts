import assert from "node:assert/strict";
import test from "node:test";
import { parseAdminEmail, promoteAdmin } from "../scripts/promote-admin.ts";

test("admin promotion validates and normalizes exactly one email", () => {
  assert.equal(parseAdminEmail(["--email= First.Admin@Example.com "]), "first.admin@example.com");
  assert.throws(() => parseAdminEmail([]), /valid email/);
  assert.throws(() => parseAdminEmail(["--email=not-an-email"]), /valid email/);
});

test("admin promotion uses a parameterized D1 query and returns the promoted user", async () => {
  let requestBody: { sql: string; params: string[] } | undefined;
  const promoted = await promoteAdmin({
    email: "first.admin@example.com",
    accountId: "account-id",
    databaseId: "database-id",
    apiToken: "secret-token",
    request: async (_url, init) => {
      requestBody = JSON.parse(String(init?.body));
      return Response.json({
        success: true,
        result: [{ success: true, results: [{ id: "user-1", name: "First Admin", email: "first.admin@example.com", role: "admin" }] }],
      });
    },
  });

  assert.match(requestBody?.sql ?? "", /lower\(email\) = \?/);
  assert.deepEqual(requestBody?.params, ["first.admin@example.com"]);
  assert.equal(promoted.role, "admin");
});

test("admin promotion explains when the user has not signed in yet", async () => {
  await assert.rejects(
    promoteAdmin({
      email: "missing@example.com",
      accountId: "account-id",
      databaseId: "database-id",
      apiToken: "secret-token",
      request: async () => Response.json({ success: true, result: [{ success: true, results: [] }] }),
    }),
    /sign in once/,
  );
});
