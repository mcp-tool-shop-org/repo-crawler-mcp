<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/repo-crawler-mcp/readme.png" alt="Repo Crawler MCP" width="400" />
</p>

<h1 align="center">Repo Crawler MCP</h1>

<p align="center">
  An MCP server that turns GitHub repositories into structured intelligence for AI agents.<br>
  Metadata, issues, security alerts, SBOMs — all through one tool call.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/repo-crawler-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/repo-crawler-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/repo-crawler-mcp"><img src="https://img.shields.io/npm/v/@mcptoolshop/repo-crawler-mcp" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/repo-crawler-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#tools">Tools</a> &middot;
  <a href="#data-tiers">Data Tiers</a> &middot;
  <a href="#configuration">Configuration</a> &middot;
  <a href="#architecture">Architecture</a> &middot;
  <a href="#license">License</a>
</p>

---

## Why

AI agents that work with code need to understand repositories — not just files, but the full picture: who contributes, what's broken, which dependencies are vulnerable, how active the project is. Scraping this by hand burns API quota and context window.

**Repo Crawler MCP** exposes GitHub's entire data surface as structured MCP tools. One call to `crawl_repo` with `tier: '3'` returns metadata, file tree, languages, README, commits, contributors, branches, tags, releases, community health, CI workflows, issues, PRs, traffic, milestones, Dependabot alerts, security advisories, SBOM, code scanning alerts, and secret scanning alerts — all section-selective, all rate-limited, all with graceful degradation.

## Features

- **5 MCP tools** — crawl repos, crawl orgs, summarize, compare, export
- **3-tier data model** — start light, go deep when you need to
- **Section-selective fetching** — only calls the APIs you ask for, saving quota
- **Graceful degradation** — a 403 on Dependabot doesn't kill the crawl; permissions tracked per-section
- **Built-in rate limiting** — Octokit throttling with automatic retry on 429s
- **Safe exports** — CSV with formula injection prevention, Markdown with pipe escaping
- **Adapter pattern** — GitHub first, extensible to GitLab/Bitbucket

## Quick Start

### With Claude Code

```json
{
  "mcpServers": {
    "repo-crawler": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/repo-crawler-mcp"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

### With Claude Desktop

Add the same config to your `claude_desktop_config.json`.

### Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Recommended | GitHub Personal Access Token. Without it: 60 req/hr. With it: 5,000 req/hr. |

**Token scopes by tier:**

| Tier | Required Scopes |
|------|----------------|
| Tier 1 | `public_repo` (or `repo` for private repos) |
| Tier 2 | Same + push/admin access for traffic data |
| Tier 3 | Same + `security_events` for Dependabot, code scanning, secret scanning |

## Tools

### `crawl_repo`

The main tool. Crawl a single repository at any data tier.

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `owner` | string | — | Repository owner |
| `repo` | string | — | Repository name |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | Data tier |
| `sections` | string[] | all | Specific sections to include |
| `exclude_sections` | string[] | none | Sections to skip |
| `commit_limit` | number | 30 | Max commits (Tier 1) |
| `contributor_limit` | number | 30 | Max contributors (Tier 1) |
| `issue_limit` | number | 100 | Max issues (Tier 2) |
| `pr_limit` | number | 100 | Max PRs (Tier 2) |
| `issue_state` | `'open'` \| `'closed'` \| `'all'` | `'all'` | Issue/PR filter (Tier 2) |
| `alert_limit` | number | 100 | Max security alerts (Tier 3) |

### `crawl_org`

Crawl every repo in an organization with filters.

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `org` | string | — | Organization name |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | Data tier per repo |
| `min_stars` | number | 0 | Minimum star count |
| `language` | string | any | Filter by primary language |
| `include_forks` | boolean | false | Include forked repos |
| `include_archived` | boolean | false | Include archived repos |
| `repo_limit` | number | 30 | Max repos to crawl |
| `alert_limit` | number | 30 | Max security alerts per repo (Tier 3) |

### `get_repo_summary`

Quick human-readable summary. Only 4 API calls — ideal for triage.

```
get_repo_summary({ owner: "anthropics", repo: "claude-code" })
```

### `compare_repos`

Side-by-side comparison of 2–5 repos. Stars, languages, activity, community health, size.

```
compare_repos({ repos: [
  { owner: "vitejs", repo: "vite" },
  { owner: "webpack", repo: "webpack" }
]})
```

### `export_data`

Export crawl results as JSON, CSV, or Markdown. CSV includes formula injection prevention.

```
export_data({ data: crawlResult, format: "markdown", sections: ["metadata", "issues"] })
```

## Data Tiers

### Tier 1 — Repository Fundamentals

Everything you need to understand a repo at a glance.

| Section | API Endpoint | Calls |
|---------|-------------|-------|
| `metadata` | `GET /repos/{owner}/{repo}` | 1 |
| `tree` | `GET /repos/.../git/trees/{sha}?recursive=1` | 1 |
| `languages` | `GET /repos/.../languages` | 1 |
| `readme` | `GET /repos/.../readme` | 1 |
| `commits` | `GET /repos/.../commits` | 1+ |
| `contributors` | `GET /repos/.../contributors` | 1+ |
| `branches` | `GET /repos/.../branches` | 1+ |
| `tags` | `GET /repos/.../tags` | 1+ |
| `releases` | `GET /repos/.../releases` | 1+ |
| `community` | `GET /repos/.../community/profile` | 1 |
| `workflows` | `GET /repos/.../actions/workflows` | 1 |

**Budget: ~11 API calls per full crawl. ~450 full crawls/hr with token.**

### Tier 2 — Project Activity (includes Tier 1)

Issues, PRs, traffic, milestones — the pulse of the project.

| Section | API Endpoint | Calls | Notes |
|---------|-------------|-------|-------|
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | Requires push/admin access. Degrades gracefully on 403. |
| `issues` | `GET /repos/.../issues` | 1+ | Filters out PRs. Body capped at 500 chars. |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | Includes draft/merged status, head/base refs. |
| `milestones` | `GET /repos/.../milestones` | 1+ | All states (open + closed). |
| `discussions` | _(GraphQL — stub)_ | 0 | Returns empty. Planned for future release. |

### Tier 3 — Security & Compliance (includes Tier 1 + 2)

Vulnerability data, dependency analysis, leaked secrets.

| Section | API Endpoint | Calls | Notes |
|---------|-------------|-------|-------|
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | CVE/GHSA IDs, patched versions, severity. |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | Repo-level advisories with vulnerability details. |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | SPDX format. Packages, versions, licenses, ecosystems. |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL, Semgrep, etc. Rule IDs, file locations. |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | Leaked tokens/keys. Push protection bypass tracking. |

**Permission tracking:** Every Tier 3 section returns a permission status (`granted`, `denied`, or `not_enabled`) so the agent knows exactly what's accessible and what requires elevated access.

**Graceful degradation:** Each section is fetched independently. A 403 on code scanning doesn't block Dependabot or SBOM.

## Examples

### Quick repo triage
```
get_repo_summary({ owner: "expressjs", repo: "express" })
```

### Deep security audit
```
crawl_repo({ owner: "myorg", repo: "api-server", tier: "3" })
```

### Compare frameworks
```
compare_repos({ repos: [
  { owner: "sveltejs", repo: "svelte" },
  { owner: "vuejs", repo: "core" },
  { owner: "facebook", repo: "react" }
], aspects: ["metadata", "activity", "community"] })
```

### Export issues to CSV
```
const result = crawl_repo({ owner: "myorg", repo: "app", tier: "2", sections: ["issues"] })
export_data({ data: result, format: "csv" })
```

### Org-wide vulnerability scan
```
crawl_org({ org: "myorg", tier: "3", alert_limit: 50 })
```

## Development

```bash
npm install
npm run typecheck    # Type check with tsc
npm test             # Run tests with vitest
npm run build        # Compile to build/
```

### Test Coverage

60 tests across 5 test files:
- **Validation** — owner/repo regex, URL parsing, edge cases
- **CSV escaping** — formula injection vectors, quoting, special chars
- **Markdown escaping** — pipe and newline escaping
- **GitHub adapter** — Tier 1/2/3 fetching, section filtering, error handling, permission tracking
- **Tool schemas** — Zod validation, param defaults

## Architecture

```
src/
  index.ts              # Entry point (shebang for npx)
  server.ts             # MCP server setup + tool registration
  types.ts              # All interfaces, Zod schemas, error codes, tier constants
  adapters/
    types.ts            # Platform-agnostic adapter interface
    github.ts           # GitHub API via Octokit (Tier 1/2/3)
  tools/
    crawlRepo.ts        # crawl_repo — single repo crawling
    crawlOrg.ts         # crawl_org — org-wide crawling with filters
    repoSummary.ts      # get_repo_summary — lightweight 4-call summary
    compareRepos.ts     # compare_repos — side-by-side comparison
    exportData.ts       # export_data — JSON/CSV/Markdown export
  utils/
    logger.ts           # Stderr-only logger (stdout reserved for MCP)
    errors.ts           # CrawlerError class, structured error responses
    validation.ts       # Owner/repo/URL validation with regex
    csvEscape.ts        # Formula injection prevention + CSV quoting
    mdEscape.ts         # Pipe escaping, newline removal for tables
```

### Design Principles

- **Section-selective fetching** — Don't pay for what you don't use. Request `sections: ["metadata", "issues"]` and only those APIs get called.
- **Parallel where safe** — Independent single-call endpoints (metadata, tree, languages, readme, community) run via `Promise.allSettled`. Paginated endpoints run sequentially with early termination.
- **Graceful degradation** — Every API call is wrapped in try/catch. A single failure returns a default value, never crashes the crawl.
- **Permission awareness** — Tier 3 tracks which security endpoints returned 403 vs 404. The agent can reason about what access it has.

## License

[MIT](LICENSE)

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
