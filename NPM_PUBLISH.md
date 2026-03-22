# Publishing Orvyen to npm

This guide walks through publishing Orvyen to npm so anyone can use `npx orvyen`.

## Prerequisites

1. **npm account** — Create at https://www.npmjs.com if you haven't
2. **npm CLI installed** — You have this already
3. **Unique package name** — `orvyen` should be available (check https://www.npmjs.com/package/orvyen)

## Steps

### 1. Login to npm

```bash
npm login
```

Enter your npm username, password, and email. This stores credentials in `~/.npmrc`.

### 2. Verify your setup

```bash
npm whoami
# Should output your npm username
```

### 3. Build the project

```bash
npm run build
```

This compiles TypeScript to `dist/` and runs `prepublishOnly` hook.

### 4. Publish to npm

```bash
npm publish
```

This will:
- Run `prepublishOnly` script (which builds)
- Package everything except files in `.npmignore`
- Upload to npm registry
- Create the `orvyen` package publicly available

### 5. Verify publication

```bash
# Wait 30-60 seconds for npm to propagate, then test:
npx orvyen --version
npx orvyen --help

# Or install globally:
npm install -g orvyen
orvyen ./my-models
```

## What gets published

Files included in npm package:
- `dist/` — Compiled JavaScript files
- `package.json` — Package metadata
- `README.md` — Documentation
- `.orvyen.config.js.example` — Config template
- `action/` — GitHub Actions files (for action users)

Files excluded (via `.npmignore`):
- `src/` — TypeScript source
- `tests/` — Test files
- `fixtures/` — Test fixtures
- `node_modules/` — Dependencies
- `.github/` — CI/CD config
- `.git*` — Git files

## After publishing

### Update version for future releases

```bash
# Patch release (0.1.0 → 0.1.1)
npm version patch

# Minor release (0.1.0 → 0.2.0)
npm version minor

# Major release (0.1.0 → 1.0.0)
npm version major

# Then publish
npm publish
```

### View on npm

Visit: https://www.npmjs.com/package/orvyen

## Troubleshooting

**"403 Forbidden"** — Package name already taken
→ Use a different name in `package.json` (e.g., `@yourname/orvyen`)

**"ENEEDAUTH"** — Not logged in
→ Run `npm login` first

**"Package already published at this version"**
→ Bump version with `npm version patch` before publishing

## GitHub setup

Once published, update your README to include:

```bash
npx orvyen ./models
```

Users can now install and run globally, or use the GitHub Action.

---

**Next:** After publishing, share on dbt Slack #tools and Hacker News!
