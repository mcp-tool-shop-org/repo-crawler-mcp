<p align="center">
  <img src="logo.png" alt="mcp-tool-shop" width="200" />
</p>

<h1 align="center">Repo Crawler MCP</h1>

<p align="center">
  An MCP server that crawls GitHub repositories and extracts structured data for AI agents.<br>
  Exposes tools via the <a href="https://modelcontextprotocol.io/">Model Context Protocol</a> for use with Claude Code, Claude Desktop, and other MCP clients.
</p>

---

## Features

- **5 MCP tools**: `crawl_repo`, `crawl_org`, `get_repo_summary`, `compare_repos`, `export_data`
- **3-tier data collection**: metadata, issues/PRs/traffic, security/SBOM/code scanning
- **Section-selective fetching**: Only calls the GitHub APIs you need, saving quota
- **Built-in rate limiting**: Octokit throttling plugin with automatic retry
- **Graceful degradation**: One 403 never kills the whole crawl — permissions tracked per-section
- **Safe exports**: CSV with formula injection prevention, Markdown with pipe escaping
- **Adapter pattern**: GitHub first, extensible to GitLab/Bitbucket

## Quick Start

### With Claude Code

Add to your MCP config:

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

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Recommended | GitHub PAT. Without it: 60 req/hr. With it: 5,000 req/hr. Tier 3 security endpoints require `security_events` scope. |

## Tools

### `crawl_repo`
Crawl a single repository at a specified data tier.

**Params**: `owner`, `repo`, `tier` (1/2/3), `sections`, `exclude_sections`, `commit_limit`, `contributor_limit`, `issue_limit`, `pr_limit`, `issue_state`, `alert_limit`

### `crawl_org`
Crawl all repositories in a GitHub organization with filters.

**Params**: `org`, `tier`, `min_stars`, `language`, `include_forks`, `include_archived`, `repo_limit`, `alert_limit`

### `get_repo_summary`
Quick human-readable summary of a repo. Fast and cheap on API quota (4 calls).

**Params**: `owner`, `repo`

### `compare_repos`
Side-by-side comparison of 2-5 repos covering stars, languages, activity, community, and size.

**Params**: `repos[]`, `aspects[]`

### `export_data`
Export previously crawled data as JSON, CSV, or Markdown.

**Params**: `data`, `format`, `sections`

## Data Tiers

### Tier 1 — Default

| Section | GitHub API | Calls |
|---------|-----------|-------|
| `metadata` | `GET /repos/{owner}/{repo}` | 1 |
| `tree` | `GET /repos/.../git/trees/{sha}?recursive=1` | 1 |
| `languages` | `GET /repos/.../languages` | 1 |
| `readme` | `GET /repos/.../readme` | 1 |
| `commits` | `GET /repos/.../commits` | 1+ (paginated) |
| `contributors` | `GET /repos/.../contributors` | 1+ (paginated) |
| `branches` | `GET /repos/.../branches` | 1+ |
| `tags` | `GET /repos/.../tags` | 1+ |
| `releases` | `GET /repos/.../releases` | 1+ |
| `community` | `GET /repos/.../community/profile` | 1 |
| `workflows` | `GET /repos/.../actions/workflows` | 1 |

**~11 API calls per full Tier 1 crawl.**

### Tier 2 — Advanced (includes Tier 1)

| Section | GitHub API | Calls | Notes |
|---------|-----------|-------|-------|
| `traffic` | `GET /repos/.../traffic/views` + `/clones` | 2 | Requires push/admin access |
| `issues` | `GET /repos/.../issues` | 1+ (paginated) | Filters out PRs, body capped at 500 chars |
| `pullRequests` | `GET /repos/.../pulls` | 1+ (paginated) | Includes draft/merged status |
| `milestones` | `GET /repos/.../milestones` | 1+ | All states |
| `discussions` | _(GraphQL — not yet implemented)_ | 0 | Returns empty |

### Tier 3 — Security (includes Tier 1 + 2)

| Section | GitHub API | Calls | Notes |
|---------|-----------|-------|-------|
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | Requires `security_events` scope |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | Repo-level advisories |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | SPDX format, packages + licenses |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL, Semgrep, etc. |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | Leaked tokens/keys |

**Permission tracking**: Each Tier 3 section returns `granted`, `denied`, or `not_enabled` so you know exactly what's accessible.

**Graceful degradation**: A 403 on Dependabot doesn't block the rest — each section is fetched independently.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Architecture

```
src/
  index.ts              # Entry point
  server.ts             # MCP server setup + tool registration
  types.ts              # All interfaces, Zod schemas, error codes
  adapters/
    types.ts            # Platform-agnostic adapter interface
    github.ts           # GitHub API via Octokit
  tools/
    crawlRepo.ts        # crawl_repo tool
    crawlOrg.ts         # crawl_org tool
    repoSummary.ts      # get_repo_summary tool
    compareRepos.ts     # compare_repos tool
    exportData.ts       # export_data tool
  utils/
    logger.ts           # Stderr-only logger
    errors.ts           # Structured error handling
    validation.ts       # Owner/repo/URL validation
    csvEscape.ts        # Safe CSV escaping
    mdEscape.ts         # Safe Markdown escaping
```

## License

MIT
