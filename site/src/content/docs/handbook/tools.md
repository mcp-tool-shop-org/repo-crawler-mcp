---
title: Tools
description: All 5 MCP tools for crawling GitHub repositories.
sidebar:
  order: 2
---

## crawl_repo

The main tool. Crawl a single repository at any data tier.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `owner` | string | — | Repository owner |
| `repo` | string | — | Repository name |
| `tier` | `'1'`/`'2'`/`'3'` | `'1'` | Data tier |
| `sections` | string[] | all | Specific sections to include |
| `exclude_sections` | string[] | none | Sections to skip |
| `commit_limit` | number | 30 | Max commits |
| `issue_limit` | number | 100 | Max issues (Tier 2) |
| `alert_limit` | number | 100 | Max security alerts (Tier 3) |

## crawl_org

Crawl every repo in an organization with filters.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `org` | string | — | Organization name |
| `tier` | `'1'`/`'2'`/`'3'` | `'1'` | Data tier per repo |
| `min_stars` | number | 0 | Minimum star count |
| `language` | string | any | Filter by primary language |
| `include_forks` | boolean | false | Include forked repos |
| `repo_limit` | number | 30 | Max repos to crawl |

## get_repo_summary

Quick human-readable summary. Only 4 API calls — ideal for triage.

## compare_repos

Side-by-side comparison of 2-5 repos. Stars, languages, activity, community health, size.

## export_data

Export crawl results as JSON, CSV, or Markdown. CSV includes formula injection prevention.
