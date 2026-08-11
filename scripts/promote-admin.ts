import { pathToFileURL } from "node:url";

type D1QueryResult = {
  success?: boolean;
  results?: Array<{ id: string; name: string; email: string; role: string }>;
};

type CloudflareResponse = {
  success?: boolean;
  errors?: Array<{ message?: string }>;
  result?: D1QueryResult[];
};

export function parseAdminEmail(args: string[]) {
  const emailArg = args.find((arg) => arg.startsWith("--email="));
  const email = emailArg?.slice("--email=".length).trim().toLowerCase() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Provide one valid email with --email=someone@example.com");
  }
  return email;
}

export async function promoteAdmin(input: {
  email: string;
  accountId: string;
  databaseId: string;
  apiToken: string;
  request?: typeof fetch;
}) {
  const request = input.request ?? fetch;
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(input.accountId)}/d1/database/${encodeURIComponent(input.databaseId)}/query`;
  const response = await request(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.apiToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sql: "UPDATE users SET role = 'admin' WHERE lower(email) = ? RETURNING id, name, email, role",
      params: [input.email],
    }),
  });
  const payload = (await response.json()) as CloudflareResponse;
  if (!response.ok || !payload.success) {
    const reason = payload.errors?.map((error) => error.message).filter(Boolean).join("; ");
    throw new Error(reason || `D1 admin promotion failed with status ${response.status}`);
  }
  const promoted = payload.result?.[0]?.results?.[0];
  if (!promoted) throw new Error(`No DariRent user exists with email ${input.email}. Ask the user to sign in once, then retry.`);
  return promoted;
}

async function main() {
  const email = parseAdminEmail(process.argv.slice(2));
  const accountId = requiredEnvironmentValue("CLOUDFLARE_ACCOUNT_ID");
  const databaseId = requiredEnvironmentValue("D1_DATABASE_ID");
  const apiToken = requiredEnvironmentValue("CLOUDFLARE_API_TOKEN");
  const promoted = await promoteAdmin({ email, accountId, databaseId, apiToken });
  console.log(`Promoted ${promoted.name} <${promoted.email}> to admin.`);
}

function requiredEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
