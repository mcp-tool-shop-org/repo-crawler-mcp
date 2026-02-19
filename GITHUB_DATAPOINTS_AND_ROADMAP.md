# GitHub Data Points Mapping & Architectural Roadmap

This document maps the key data points for an effective repo crawler to their corresponding GitHub API endpoints or data sources, and outlines an architectural roadmap for implementation.

---

## Data Points & GitHub Endpoints

### 1. Repository Metadata
- Name, description, topics/tags:  
  → `GET /repos/{owner}/{repo}`
- Owner/organization:  
  → `GET /repos/{owner}/{repo}`
- Visibility (public/private):  
  → `GET /repos/{owner}/{repo}`
- License:  
  → `GET /repos/{owner}/{repo}`
- Default branch:  
  → `GET /repos/{owner}/{repo}`
- Creation and last updated dates:  
  → `GET /repos/{owner}/{repo}`
- Homepage URL:  
  → `GET /repos/{owner}/{repo}`
- Fork/parent info:  
  → `GET /repos/{owner}/{repo}`

### 2. Code & Structure
- File/folder tree:  
  → `GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1`
- File contents:  
  → `GET /repos/{owner}/{repo}/contents/{path}`
- Language breakdown:  
  → `GET /repos/{owner}/{repo}/languages`
- README and docs:  
  → `GET /repos/{owner}/{repo}/readme`
- Config files:  
  → `GET /repos/{owner}/{repo}/contents/{path}`

### 3. Commits & History
- Commit log:  
  → `GET /repos/{owner}/{repo}/commits`
- Contributors:  
  → `GET /repos/{owner}/{repo}/contributors`
- Branches and tags:  
  → `GET /repos/{owner}/{repo}/branches`  
  → `GET /repos/{owner}/{repo}/tags`
- Release history:  
  → `GET /repos/{owner}/{repo}/releases`

### 4. Issues & Pull Requests
- Issues:  
  → `GET /repos/{owner}/{repo}/issues`
- Pull Requests:  
  → `GET /repos/{owner}/{repo}/pulls`
- Linked issues/PRs:  
  → `GET /repos/{owner}/{repo}/issues/{issue_number}/events`
- Milestones and projects:  
  → `GET /repos/{owner}/{repo}/milestones`  
  → `GET /repos/{owner}/{repo}/projects`

### 5. Community & Insights
- Stargazers, watchers, forks count:  
  → `GET /repos/{owner}/{repo}`
- Traffic analytics (views, clones):  
  → `GET /repos/{owner}/{repo}/traffic/views`  
  → `GET /repos/{owner}/{repo}/traffic/clones`
- Discussions, wiki:  
  → `GET /repos/{owner}/{repo}/discussions`  
  → Wiki: Not available via API, must scrape or clone
- Community health files:  
  → `GET /repos/{owner}/{repo}/community/profile`

### 6. CI/CD & Automation
- GitHub Actions workflows:  
  → `GET /repos/{owner}/{repo}/actions/workflows`
- Status badges:  
  → Parse README or docs for badge URLs
- Linked services:  
  → Parse README or docs for service mentions

### 7. Telemetry & Analytics
- Embedded analytics scripts:  
  → Parse README, docs, or code for analytics scripts
- Custom telemetry endpoints:  
  → Parse codebase for outbound telemetry calls
- Usage reporting badges:  
  → Parse README for badge URLs

### 8. Security
- Dependabot alerts:  
  → `GET /repos/{owner}/{repo}/dependabot/alerts`
- Security advisories:  
  → `GET /repos/{owner}/{repo}/security-advisories`
- Vulnerability reports:  
  → `GET /repos/{owner}/{repo}/vulnerability-alerts` (API access may be limited)

### 9. Dependencies
- Dependency files:  
  → `GET /repos/{owner}/{repo}/contents/{path}`
- Dependency graph:  
  → `GET /repos/{owner}/{repo}/dependency-graph/sbom`

### 10. Other
- API usage quotas/limits:  
  → `GET /rate_limit`
- Webhooks and integrations:  
  → `GET /repos/{owner}/{repo}/hooks`
- Custom files:  
  → `GET /repos/{owner}/{repo}/contents/{path}`

---

## Architectural Roadmap

1. **Authentication Layer:** OAuth or PAT for GitHub API access.
2. **Data Fetcher:** Modular fetchers for each endpoint above.
3. **Parser/Analyzer:** For README, code, and config parsing.
4. **Data Normalizer:** Unifies and structures all fetched data.
5. **Storage/Export:** Stores as JSON, database, or MCP-compatible format.
6. **Scheduler/Orchestrator:** Handles periodic syncs and error recovery.
7. **Extensibility:** Design for easy addition of new endpoints or platforms.

This mapping provides a clear blueprint for building your repo crawler with GitHub as the initial focus.