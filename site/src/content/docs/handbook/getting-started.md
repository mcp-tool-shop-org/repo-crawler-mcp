---
title: Getting Started
description: Install Repo Crawler MCP and run your first crawl.
sidebar:
  order: 1
---

Repo Crawler MCP turns GitHub repositories into structured intelligence for AI agents. Metadata, issues, security alerts, SBOMs — all through one tool call.

## Installation

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

## GitHub token

| With token | Without token |
|------------|---------------|
| 5,000 requests/hour | 60 requests/hour |

**Token scopes by tier:**

| Tier | Required Scopes |
|------|----------------|
| Tier 1 | `public_repo` (or `repo` for private repos) |
| Tier 2 | Same + push/admin access for traffic data |
| Tier 3 | Same + `security_events` for Dependabot, code scanning, secret scanning |

## First crawl

Ask your LLM to crawl any public repo:

```
crawl_repo({ owner: "facebook", repo: "react", tier: "1" })
```

This returns metadata, file tree, languages, README, commits, contributors, branches, tags, releases, community health, and CI workflows — all from about 11 API calls.
