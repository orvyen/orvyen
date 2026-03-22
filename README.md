# Orvyen

**The SQL Architect — your dbt & SQL linter**

Audit any SQL/dbt project in one command. Get a beautiful report of architectural issues, unused models, missing tests, and more.

```bash
npx orvyen ./models
```

🔴 **Critical issues detected** (fails CI)
🟠 **High priority findings** (data quality)
🟡 **Medium suggestions** (refactor candidates)
⚪ **Low friction items** (nice to have)

---

## Why Orvyen?

Engineers working with dbt have no fast way to audit their codebase for architectural problems. Manual review is slow. Buster is expensive cloud SaaS.

Orvyen runs **locally, instantly, free**.

### What it detects

| Issue | What it means | Impact |
|-------|--------------|--------|
| **Broken refs** | Reference to non-existent model | 🔴 Breaks dbt run |
| **Circular dependencies** | Models depending on each other | 🔴 Breaks dbt run |
| **Missing tests** | Models with no dbt tests | 🟠 Data quality risk |
| **Unused models** | Models nothing references | ⚪ Dead code |
| **Grain misalignment** | JOINs at wrong granularity | 🟠 Silent data bugs |
| **Duplicate logic** | Copy-paste SQL across models | 🟠 Maintenance nightmare |
| **God models** | Single model doing too much | 🟡 Refactor candidate |
| **Undocumented models** | Missing description | ⚪ Developer friction |

---

## Installation

```bash
# Install globally
npm install -g orvyen

# Or run with npx (no install needed)
npx orvyen ./models
```

---

## Quick Start

### 1. Audit your project

```bash
npx orvyen ./models
```

Output:
```
 🔍 Orvyen – SQL Architecture Auditor

ℹ️  Auditing: /Users/you/project/models

 📊 Orvyen Audit Report
🔴 CRITICAL (2)
┌─────────────────┬──────────────────────┬──────────────────┐
│ Model           │ Issue                │ Description      │
├─────────────────┼──────────────────────┼──────────────────┤
│ orders_summary  │ Broken ref: 'orders' │ Reference non... │
│ user_metrics    │ Circular dependency  │ Forms cycle...   │
└─────────────────┴──────────────────────┴──────────────────┘

Audit Summary:
  Models analyzed: 25
  Findings: 8
  Time: 0.01s
```

### 2. Generate HTML report

```bash
npx orvyen ./models --format html
```

Creates `.orvyen/report.html` — open in browser and share with your team! ✅

### 3. Watch mode

Automatically re-run audit when files change:

```bash
npx orvyen ./models --watch
```

### 4. Initialize config

Create a `.orvyen.config.js` file to customize:

```bash
npx orvyen init
```

Edit the file:

```javascript
export default {
  include: ["models/**/*.sql"],
  exclude: ["models/**/*staging*.sql"],
  
  checks: {
    unused_model: true,
    broken_ref: true,
    missing_tests: true,
    // ... more checks
  },

  output: "all", // terminal, html, json, or all
  outputDir: ".orvyen",
};
```

---

## Commands

```bash
npx orvyen ./models [options]

OPTIONS:
  --format <type>    Output: terminal | html | json | all (default: terminal)
  --watch, -w        Re-run when files change
  --help, -h         Show help

npx orvyen init      Create .orvyen.config.js

EXAMPLES:
  npx orvyen .
  npx orvyen ./models --format all
  npx orvyen ./models --watch
```

---

## Configuration

### `.orvyen.config.js`

```javascript
export default {
  // Which SQL files to include (required)
  include: ["models/**/*.sql"],

  // Files to exclude
  exclude: ["models/**/*test*.sql"],

  // Enable/disable checks and set severity
  checks: {
    unused_model: true,
    missing_tests: { severity: "high" },
    duplicate_logic: true,
    broken_ref: true,
    grain_misalignment: { severity: "high" },
    circular_dependency: true,
    undocumented_model: false,
    god_model: true,
  },

  // Output formats: "terminal" | "html" | "json" | "all"
  output: "all",

  // Where to save reports
  outputDir: ".orvyen",
};
```

### Severity Levels

| Level | Meaning | CI Fails? |
|-------|---------|-----------|
| `critical` | Breaks dbt | Yes |
| `high` | Data quality risk | No |
| `medium` | Refactor candidate | No |
| `low` | Nice to have | No |

---

## Output Formats

### Terminal (default)

Colorful table in your CLI. Fast feedback.

### HTML

Beautiful, shareable report. Open in browser.

```bash
npx orvyen ./models --format html
# Creates: .orvyen/report.html
```

### JSON

Machine-readable. Use in CI/CD:

```bash
npx orvyen ./models --format json
# Creates: .orvyen/report.json
```

Parse in your CI:

```javascript
const report = require("./.orvyen/report.json");
if (report.summary.critical > 0) {
  process.exit(1); // Fail the build
}
```

---

## GitHub Actions

Add to `.github/workflows/audit.yml`:

```yaml
name: SQL Audit

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npx orvyen ./models --format json
      - uses: dorny/test-reporter@v1
        if: always()
        with:
          name: SQL Audit Report
          path: .orvyen/report.json
          reporter: java-junit
```

---

## How It Works

1. **Parse SQL files** → Extract model names, refs, sources
2. **Parse schema.yml** → Add tests, descriptions
3. **Build DAG** → Model dependency graph
4. **Run checks** → 8 parallel audit checks
5. **Report** → HTML, JSON, or terminal output

All **local**. No cloud calls. No data sent anywhere.

---

## Supported Databases

Works with any SQL dialect:

- 🔴 Snowflake
- 🔴 BigQuery
- 🔴 Postgres
- 🔴 MySQL
- 🔴 Redshift
- 🔴 DuckDB
- 🔴 Spark SQL
- 🔴 Generic SQL

---

## Performance

| Project Size | Time | CPU |
|--------------|------|-----|
| 5 models | <5ms | minimal |
| 50 models | 10-20ms | minimal |
| 500 models | 50-100ms | minimal |

---

## Common Issues

### Error: "Cannot find module 'yaml'"

```bash
npm install -g orvyen
# or
npx orvyen@latest ./models
```

### "No findings!" but there are issues

Check your `.orvyen.config.js`:

```javascript
checks: {
  broken_ref: true,  // Make sure checks are enabled!
  unused_model: true,
}
```

### Want to exclude a directory?

```javascript
exclude: [
  "models/**/*staging*.sql",
  "models/archive/**",
  "models/test/**",
]
```

---

## Roadmap

- [ ] Week 2: HTML reports, init command, watch mode ✅
- [ ] Week 3: GitHub Actions integration
- [ ] Week 4: Web dashboard (hosted, optional)
- [ ] Week 5: Team collaboration features

---

## Contributing

Open source! Issues and PRs welcome.

```bash
git clone https://github.com/om/orvyen
cd orvyen
npm install
npm run build
npm run test
```

---

## License

MIT

---

## Need Help?

- � **Docs**: [orvyen.com](https://orvyen.com)
- 🔴 **Issues**: [GitHub](https://github.com/om/orvyen/issues)
- 🟡 **Discussions**: [GitHub Discussions](https://github.com/om/orvyen/discussions)
- ⚪ **Twitter**: [@orvyen](https://twitter.com/orvyen)

---

Made with 🔴 for data engineers
