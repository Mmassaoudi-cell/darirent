# DariRent Tunisia — Product Concept

This repository publishes the supplied DariRent interactive visualization as a static, sandboxed artifact.

The original visualization is stored at `public/darirent-product-concept.html`. The application root redirects to that file. Its bytes, Content Security Policy, referrer policy, and sandboxed iframe are preserved exactly as supplied.

## Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm test
```

The test suite checks the SHA-256 digest of the source and production copy and verifies the CSP and iframe security boundary.
