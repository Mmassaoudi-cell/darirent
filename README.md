# DariRent Tunisia

This repository contains the DariRent private soft-launch application and preserves the supplied interactive visualization as a static, sandboxed artifact at `public/darirent-product-concept.html`.

The visualization's bytes, Content Security Policy, referrer policy, and sandboxed iframe are preserved exactly as supplied during every build.

## Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm test
```

The test suite compares the visualization source directly with the production copy, verifies the CSP and iframe security boundary, and exercises the main authenticated marketplace routes.

## Bootstrap the first administrator

After the first administrator has signed in to DariRent once, a human with Cloudflare D1 access can promote that exact account. Use a scoped API token with D1 Read and D1 Write permissions and provide the production database identifiers as environment variables:

```powershell
$env:CLOUDFLARE_ACCOUNT_ID="your-account-id"
$env:D1_DATABASE_ID="your-production-d1-database-id"
$env:CLOUDFLARE_API_TOKEN="your-scoped-d1-token"
node --experimental-strip-types scripts/promote-admin.ts --email=someone@example.com
```

The script sends a parameterized query directly to D1, promotes only the matched email, and prints the promoted user's name and email. It is intentionally not exposed through an API route or application UI. Remove the token from the shell environment when the one-time operation is complete.
