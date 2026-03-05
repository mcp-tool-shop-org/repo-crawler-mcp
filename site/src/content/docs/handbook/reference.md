---
title: Reference
description: Architecture, design principles, and security model.
sidebar:
  order: 4
---

## Architecture

```
src/
  index.ts              # Entry point
  server.ts             # MCP server + tool registration
  types.ts              # Interfaces, Zod schemas, error codes
  adapters/
    github.ts           # GitHub API via Octokit (Tier 1/2/3)
  tools/
    crawlRepo.ts        # Single repo crawling
    crawlOrg.ts         # Org-wide crawling with filters
    repoSummary.ts      # Lightweight 4-call summary
    compareRepos.ts     # Side-by-side comparison
    exportData.ts       # JSON/CSV/Markdown export
  utils/
    logger.ts           # Stderr-only logger
    errors.ts           # Structured error responses
    validation.ts       # Owner/repo/URL validation
    csvEscape.ts        # Formula injection prevention
    mdEscape.ts         # Pipe escaping for tables
```

## Design principles

- **Section-selective** — Don't pay for what you don't use
- **Parallel where safe** — Independent endpoints run via `Promise.allSettled`
- **Graceful degradation** — A single failure never crashes the crawl
- **Permission awareness** — Tier 3 tracks which endpoints returned 403 vs 404

## Security model

| Aspect | Detail |
|--------|--------|
| **Data touched** | GitHub repo metadata, issues, PRs, security alerts, SBOMs |
| **Data NOT touched** | No telemetry, no analytics, no persistent state |
| **Network** | HTTPS outbound to api.github.com only |
| **Telemetry** | None collected or sent |
