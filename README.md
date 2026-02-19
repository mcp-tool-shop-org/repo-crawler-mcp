# Repo Crawler MCP

An MCP server that crawls GitHub repositories and extracts structured data for AI agents. Exposes tools via the [Model Context Protocol](https://modelcontextprotocol.io/) for use with Claude Code, Claude Desktop, and other MCP clients.

## Features

- **5 MCP tools**: `crawl_repo`, `crawl_org`, `get_repo_summary`, `compare_repos`, `export_data`
- **Tiered data collection**: Tier 1 (default metadata), Tier 2 (issues/PRs — coming soon), Tier 3 (security — coming soon)
- **Section-selective fetching**: Only calls the GitHub APIs you need, saving quota
- **Built-in rate limiting**: Octokit throttling plugin with automatic retry
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
| `GITHUB_TOKEN` | Recommended | GitHub PAT. Without it: 60 req/hr. With it: 5,000 req/hr. |

## Tools

### `crawl_repo`
Crawl a single repository. Returns structured data including metadata, file tree, languages, README, commits, contributors, branches, tags, releases, community health, and CI workflows.

**Params**: `owner`, `repo`, `tier`, `sections`, `exclude_sections`, `commit_limit`, `contributor_limit`

### `crawl_org`
Crawl all repositories in a GitHub organization with filters.

**Params**: `org`, `tier`, `min_stars`, `language`, `include_forks`, `include_archived`, `repo_limit`

### `get_repo_summary`
Quick human-readable summary of a repo. Fast and cheap on API quota (4 calls).

**Params**: `owner`, `repo`

### `compare_repos`
Side-by-side comparison of 2-5 repos covering stars, languages, activity, community, and size.

**Params**: `repos[]`, `aspects[]`

### `export_data`
Export previously crawled data as JSON, CSV, or Markdown.

**Params**: `data`, `format`, `sections`

## Tier 1 Sections (Default)

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

**Total: ~11 API calls per full Tier 1 crawl.**

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
