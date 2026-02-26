<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## 为什么？

与代码交互的 AI 代理需要理解代码仓库，而不仅仅是文件，而是需要了解完整的上下文：谁在贡献代码，哪些地方存在问题，哪些依赖项存在漏洞，项目的活跃程度如何。手动抓取这些信息会消耗 API 配额和上下文窗口。

**Repo Crawler MCP** 将 GitHub 的所有数据接口以结构化的 MCP 工具形式呈现。只需调用一次 `crawl_repo` 方法，并设置 `tier: '3'`，即可返回元数据、文件目录、编程语言、README 文件、提交记录、贡献者、分支、标签、发布版本、社区健康状况、CI 工作流、问题、拉取请求、流量数据、里程碑、Dependabot 告警、安全建议、SBOM（软件物料清单）、代码扫描告警以及秘密扫描告警——所有部分都是可选的，都受到速率限制，并且都具有优雅降级机制。

## 功能

- **5 个 MCP 工具**：抓取仓库、抓取组织、总结、比较、导出
- **三级数据模型**：从基础开始，根据需要深入挖掘
- **分部分抓取**：仅调用您请求的 API，节省配额
- **优雅降级**：即使 Dependabot 出现 403 错误，也不会停止抓取；权限按部分跟踪
- **内置速率限制**：使用 Octokit 进行限速，并在出现 429 错误时自动重试
- **安全导出**：CSV 文件具有防止公式注入的功能，Markdown 文件具有管道转义功能
- **适配器模式**：首先支持 GitHub，并可扩展到 GitLab/Bitbucket

## 快速开始

### 使用 Claude Code

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

### 使用 Claude Desktop

将相同的配置添加到您的 `claude_desktop_config.json` 文件中。

### 配置

| 变量 | 必需 | 描述 |
| ---------- | ---------- | ------------- |
| `GITHUB_TOKEN` | 推荐 | GitHub 个人访问令牌。如果没有该令牌：每小时 60 次请求。如果使用该令牌：每小时 5000 次请求。 |

**不同级别的令牌权限：**

| 级别 | 所需权限 |
| ------ | ---------------- |
| 第一级 | `public_repo`（或 `repo` 用于私有仓库） |
| 第二级 | 同上 + 用于流量数据的推送/管理权限 |
| 第三级 | 同上 + 用于 Dependabot、代码扫描和秘密扫描的 `security_events` 权限 |

## 工具

### `crawl_repo`

主要工具。抓取单个仓库，适用于任何数据级别。

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| 参数 | 类型 | 默认值 | 描述 |
| ------- | ------ | --------- | ------------- |
| `owner` | 字符串 | — | 仓库所有者 |
| `repo` | 字符串 | — | 仓库名称 |
| `tier` | `'1'` | `'2'` | `'3'` | `'1'` | 数据级别 |
| `sections` | 字符串数组 | all | 要包含的特定部分 |
| `exclude_sections` | 字符串数组 | none | 要跳过的部分 |
| `commit_limit` | 数字 | 30 | 最大提交数（第一级） |
| `contributor_limit` | 数字 | 30 | 最大贡献者数（第一级） |
| `issue_limit` | 数字 | 100 | 最大问题数（第二级） |
| `pr_limit` | 数字 | 100 | 最大拉取请求数（第二级） |
| `issue_state` | `'open'` | `'closed'` | `'all'` | `'all'` | 问题/拉取请求过滤器（第二级） |
| `alert_limit` | 数字 | 100 | 最大安全告警数（第三级） |

### `crawl_org`

抓取组织中的所有仓库，并使用过滤器。

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| 参数 | 类型 | 默认值 | 描述 |
| ------- | ------ | --------- | ------------- |
| `org` | 字符串 | — | 组织名称 |
| `tier` | `'1'` | `'2'` | `'3'` | `'1'` | Data tier per repo |
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
| --------- | ------------- | ------- |
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
| --------- | ------------- | ------- | ------- |
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | Requires push/admin access. Degrades gracefully on 403. |
| `issues` | `GET /repos/.../issues` | 1+ | Filters out PRs. Body capped at 500 chars. |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | Includes draft/merged status, head/base refs. |
| `milestones` | `GET /repos/.../milestones` | 1+ | All states (open + closed). |
| `discussions` | _(GraphQL — stub)_ | 0 | Returns empty. Planned for future release. |

### Tier 3 — Security & Compliance (includes Tier 1 + 2)

Vulnerability data, dependency analysis, leaked secrets.

| Section | API Endpoint | Calls | Notes |
| --------- | ------------- | ------- | ------- |
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

### Compare 框架
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

- **按部分选择获取** — 只为使用的内容付费。请求 `sections: ["metadata", "issues"]`，只有这些 API 才会被调用。
- **安全时并行处理** — 独立的单次请求接口（例如：元数据、目录、语言、README、社区）通过 `Promise.allSettled` 并行运行。分页接口按顺序运行，并支持提前终止。
- **优雅降级** — 每个 API 调用都包含 try/catch 块。即使出现单个错误，也会返回默认值，而不会导致爬虫崩溃。
- **权限感知** — 第三层会跟踪哪些安全接口返回了 403 错误（权限不足）而不是 404 错误。代理程序可以根据返回结果推断其拥有的访问权限。

## 许可证

[MIT](LICENSE)

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
