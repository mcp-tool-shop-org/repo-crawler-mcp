---
title: Data Tiers
description: Three-tier data model — from fundamentals to security.
sidebar:
  order: 3
---

Repo Crawler uses a three-tier data model. Start light with Tier 1, go deeper when you need project activity or security data.

## Tier 1 — Repository Fundamentals

Everything you need to understand a repo at a glance. About 11 API calls per full crawl.

Sections: `metadata`, `tree`, `languages`, `readme`, `commits`, `contributors`, `branches`, `tags`, `releases`, `community`, `workflows`

## Tier 2 — Project Activity (includes Tier 1)

Issues, PRs, traffic, milestones — the pulse of the project.

Sections: `traffic` (requires push/admin access), `issues`, `pullRequests`, `milestones`

Traffic data degrades gracefully on 403 — missing permissions don't crash the crawl.

## Tier 3 — Security & Compliance (includes Tier 1 + 2)

Vulnerability data, dependency analysis, leaked secrets.

Sections: `dependabotAlerts`, `securityAdvisories`, `sbom`, `codeScanningAlerts`, `secretScanningAlerts`

### Permission tracking

Every Tier 3 section returns a permission status (`granted`, `denied`, or `not_enabled`) so the agent knows exactly what's accessible and what requires elevated access.

### Graceful degradation

Each section is fetched independently. A 403 on code scanning doesn't block Dependabot or SBOM.

## Section-selective fetching

Request only the sections you need with the `sections` parameter:

```
crawl_repo({ owner: "myorg", repo: "api", tier: "2", sections: ["metadata", "issues"] })
```

Only those APIs get called — saving quota and context window.
