# ORVYEN — Master Context File (v2)
# Updated: March 2026 — Pivoted from cloud SaaS to local-first CLI tool
# File: CLAUDE.md (place in root of every repo)

---

## 1. What Orvyen is (v2 — pivoted)

Orvyen is a **local-first CLI tool** that audits any SQL / dbt project in one command and outputs a beautiful health report. Think ESLint but for SQL architecture.

**The command:**
```bash
npx orvyen ./models
```

**One-liner:** Orvyen is the ESLint for your SQL codebase — run it in one command, get a full architecture health report, share it with your team.

**Why this direction:**
- Zero cloud cost to build or test — runs entirely on the developer's machine
- Viral by design — engineers run it, share the report, tool spreads itself
- Free tier builds the user base — paid hosted layer comes later
- Buildable solo on M2 MacBook with VS Code + Claude, no external services needed
- Differentiates from Buster (cloud SaaS, $2k/mo) by being free, local, instant

**The pivot from v1:**
v1 was a cloud SaaS agent platform requiring Snowflake/BigQuery credits, LangGraph orchestration, and AWS hosting — too expensive to test solo. v2 is a CLI tool that parses SQL files locally, zero cloud dependency.

---

## 2. The problem we solve

Engineers working with dbt or raw SQL have no fast way to audit their codebase for architectural problems. The only options are:
- Manual review (slow, expensive, misses things)
- Buster (cloud SaaS, $2k/month, overkill for most teams)
- dbt's built-in commands (shallow, no architecture-level insight)

Orvyen gives any engineer a full SQL architecture audit in under 30 seconds, for free, with zero setup.

**Pain points detected by Orvyen:**

| Finding | What it means |
|---|---|
| Unused models | SQL files that nothing references — dead code |
| Missing tests | Models with no dbt tests attached |
| Duplicate logic | Same SQL logic copy-pasted across multiple files |
| Broken refs | ref() calls pointing to models that don't exist |
| Grain misalignment | Models joining at wrong granularity levels |
| Circular dependencies | DAG cycles that will break dbt runs |
| Undocumented models | Models missing description in schema.yml |
| God models | Single models doing too much — refactor candidates |

---

## 3. Product — how it works

### Core flow

```
user runs: npx orvyen ./models
     ↓
CLI reads all .sql + schema.yml files in the directory
     ↓
Parser builds a local DAG of all models
     ↓
Analyser checks run against the DAG (all local, zero API calls)
     ↓
Findings generated with severity + suggested fix
     ↓
Report rendered as HTML file + terminal summary
     ↓
User opens report.html — shares screenshot or link
```

### Key commands

```bash
npx orvyen ./models                # audit a dbt models folder
npx orvyen ./models --format html  # output HTML report
npx orvyen ./models --format json  # output JSON for CI
npx orvyen ./models --watch        # watch mode, re-runs on file change
npx orvyen init                    # scaffold .orvyen.config.js
npx orvyen --help
```

### What Orvyen does NOT do (hard scope — v2)
- Does NOT connect to any warehouse (Snowflake, BigQuery, etc.)
- Does NOT make API calls to any external service
- Does NOT require login or account creation
- Does NOT send any data anywhere — 100% local
- Does NOT replace dbt — runs alongside it
- Does NOT require dbt to be installed — works on raw SQL folders too

---

## 4. Tech stack

### CLI (primary product)

| Component | Choice | Why |
|---|---|---|
| Language | TypeScript / Node.js | npx distribution, zero friction install |
| SQL parser | node-sql-parser | Parses SQL AST locally, handles most dialects |
| dbt manifest | Custom parser | Read manifest.json + schema.yml directly |
| DAG | Custom graph (adjacency list) | No heavy lib needed |
| Report | Self-contained HTML + CSS | Single file, no framework |
| Terminal | chalk + cli-table3 | Color output, clean tables |
| Config | cosmiconfig | .orvyen.config.js or package.json |
| Distribution | npm publish | npx orvyen works instantly |

### GitHub Action (week 3)

| Component | Choice |
|---|---|
| Runtime | Node.js 20 |
| PR comments | GitHub REST API (free) |
| Trigger | on: pull_request |

### Web dashboard (future only — not v2)

| Component | Choice |
|---|---|
| Framework | Next.js 14 |
| Hosting | Vercel free tier |
| Auth | Clerk |
| DB | SQLite → Postgres later |

---

## 5. Repository structure

```
orvyen/
├── CLAUDE.md                     ← this file
├── README.md
├── package.json
├── tsconfig.json
├── .orvyen.config.js.example
│
├── src/
│   ├── index.ts                  ← CLI entrypoint (bin)
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── audit.ts          ← main audit command
│   │   │   ├── init.ts           ← scaffold config
│   │   │   └── watch.ts          ← watch mode
│   │   └── display.ts            ← terminal output formatting
│   │
│   ├── parser/
│   │   ├── sql-parser.ts         ← parse .sql files → AST
│   │   ├── manifest-parser.ts    ← parse dbt manifest.json
│   │   ├── schema-parser.ts      ← parse schema.yml files
│   │   └── file-walker.ts        ← walk directory, collect files
│   │
│   ├── graph/
│   │   ├── dag-builder.ts        ← build DAG from parsed models
│   │   ├── dag-analyser.ts       ← traverse DAG, run checks
│   │   └── types.ts              ← DagNode, DagEdge types
│   │
│   ├── checks/
│   │   ├── unused-models.ts
│   │   ├── missing-tests.ts
│   │   ├── duplicate-logic.ts
│   │   ├── broken-refs.ts
│   │   ├── grain-misalignment.ts
│   │   ├── circular-deps.ts
│   │   ├── undocumented-models.ts
│   │   └── god-models.ts
│   │
│   ├── reporter/
│   │   ├── html-reporter.ts
│   │   ├── json-reporter.ts
│   │   ├── terminal-reporter.ts
│   │   └── templates/
│   │       └── report.html
│   │
│   └── types/
│       ├── finding.ts
│       ├── model.ts
│       └── config.ts
│
├── fixtures/
│   ├── simple-project/           ← 5 models, clean
│   ├── broken-project/           ← intentional issues for testing
│   └── large-project/            ← 50+ models stress test
│
├── action/
│   ├── action.yml
│   └── index.ts
│
└── tests/
    ├── parser.test.ts
    ├── dag-builder.test.ts
    └── checks.test.ts
```

---

## 6. Core types

```typescript
// finding.ts
export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type FindingType =
  | 'unused_model'
  | 'missing_tests'
  | 'duplicate_logic'
  | 'broken_ref'
  | 'grain_misalignment'
  | 'circular_dependency'
  | 'undocumented_model'
  | 'god_model'

export interface Finding {
  id: string
  type: FindingType
  severity: Severity
  model: string
  title: string
  description: string
  suggestion: string
  line?: number
}

// model.ts
export interface DbtModel {
  name: string
  path: string
  sql: string
  refs: string[]
  sources: string[]
  tests: string[]
  description?: string
  tags: string[]
  materialization: 'table' | 'view' | 'incremental' | 'ephemeral' | 'unknown'
}

export interface DagNode {
  model: DbtModel
  upstream: string[]
  downstream: string[]
  depth: number
}

// config.ts
export interface OrvyenConfig {
  include: string[]
  exclude: string[]
  checks: {
    [K in FindingType]?: boolean | { severity: Severity }
  }
  output: 'terminal' | 'html' | 'json' | 'all'
  outputDir: string
}
```

---

## 7. Severity rules

| Finding type | Default severity | Reasoning |
|---|---|---|
| circular_dependency | critical | Breaks dbt run entirely |
| broken_ref | critical | References non-existent model |
| grain_misalignment | high | Silent data quality bug |
| duplicate_logic | high | Maintenance nightmare |
| missing_tests | high | No safety net |
| god_model | medium | Refactor candidate |
| unused_model | low | Dead code, safe to remove |
| undocumented_model | low | Annoying but not dangerous |

---

## 8. Build in public strategy

**Content that spreads:**
- "I audited [famous open source dbt project] with orvyen — here's what I found"
- Weekly build log on Twitter — ship something every Friday
- Submit to: Hacker News Show HN, dbt Slack #tools, r/dataengineering

**YC traction milestones:**
- 100 npm downloads = proof of concept
- 500 GitHub stars = community validation
- 5 companies using in CI = real traction
- 1 person paying for hosted = PMF signal

---

## 9. Current status

| Metric | Value |
|---|---|
| Stage | Pre-seed / building v1 |
| Funding | Bootstrapped — $0 spend |
| Team | Solo founder |
| YC target | S26 batch |
| Build environment | M2 MacBook, VS Code, Claude |
| Domain | orvyen.com ✅ |
| Logo | Finalized ✅ |
| npm package | orvyen (to be published) |

---

## 10. Instructions for Claude Code

When working on Orvyen code, always:

- **TypeScript strict mode** — no `any` types ever
- **Node.js 20+** — native fetch, no node-fetch
- **Zero external API calls** in core CLI — everything runs locally
- **Use fs.promises** throughout — no sync file operations
- **Keep CLI fast** — under 3 seconds for a 50-model project
- **Follow repo structure** in section 5 exactly
- **Every check is its own file** in `src/checks/`
- **Each check exports one function:** `check(nodes: Map<string, DagNode>): Finding[]`
- **Use fixtures for all testing** — never point at a real external project
- **Terminal output must work without color** — respect NO_COLOR env var
- **HTML report must be self-contained** — single file, no external CSS or JS
- **Never send data anywhere** — no analytics, no telemetry, no API calls
- **package.json bin** must point to compiled `dist/index.js`
- **Always verify with:** `npx orvyen ./fixtures/broken-project` before calling anything done

---

## 11. Week-by-week build plan

### Week 1 — Core engine
- [ ] Scaffold repo, TypeScript config, package.json with bin
- [ ] file-walker.ts — walk directory, collect .sql and .yml files
- [ ] sql-parser.ts — extract model name, refs, sources from SQL
- [ ] schema-parser.ts — parse schema.yml for tests + descriptions
- [ ] dag-builder.ts — construct DAG from parsed models
- [ ] unused-models.ts + broken-refs.ts (easiest checks first)
- [ ] terminal-reporter.ts — basic chalk output
- [ ] npx orvyen ./fixtures/broken-project works end to end ✅

### Week 2 — All checks + HTML report
- [ ] Remaining 6 checks
- [ ] html-reporter.ts — beautiful self-contained report
- [ ] json-reporter.ts — machine-readable output
- [ ] init command + watch mode
- [ ] README written, publish to npm as orvyen
- [ ] Tweet the launch

### Week 3 — GitHub Action + distribution
- [ ] GitHub Action — posts findings as PR comment
- [ ] Submit to dbt Slack #tools channel
- [ ] Submit to Hacker News Show HN
- [ ] Submit to r/dataengineering
- [ ] Hit 100 npm downloads

### Week 4+ — Hosted layer (only if traction)
- [ ] Web dashboard — upload manifest.json, get report online
- [ ] Saved history — track DAG health over time
- [ ] Team features — share reports, comment on findings
- [ ] Pricing — free forever for CLI, $49/mo for hosted

---

*Last updated: March 2026 — v2 pivot to local-first CLI. Update when strategy changes.*
