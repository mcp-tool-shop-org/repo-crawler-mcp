# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a Vulnerability

Email: **64996768+mcp-tool-shop@users.noreply.github.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Version affected
- Potential impact

### Response timeline

| Action | Target |
|--------|--------|
| Acknowledge report | 48 hours |
| Assess severity | 7 days |
| Release fix | 30 days |

## Scope

repo-crawler-mcp is an **MCP server** that crawls GitHub repositories via the GitHub API.

- **Data touched:** GitHub repository metadata, issues, PRs, security alerts, SBOMs — all accessed via authenticated GitHub API. Rate-limited with Octokit throttling
- **Data NOT touched:** No telemetry. No analytics. No persistent state. No credential storage beyond runtime GITHUB_TOKEN env var
- **Permissions:** Read: GitHub API via Octokit (scopes depend on data tier). Write: MCP tool responses via stdout only
- **Network:** HTTPS outbound to api.github.com via Octokit. MCP stdio transport (no HTTP listeners)
- **Telemetry:** None collected or sent

### Security controls

- Formula injection prevention in CSV exports
- Pipe escaping in Markdown table exports
- Per-section graceful degradation (403 doesn't crash the crawl)
- Permission tracking for Tier 3 security endpoints
- Stderr-only logging (stdout reserved for MCP protocol)
