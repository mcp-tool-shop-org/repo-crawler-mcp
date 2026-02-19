<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <strong>中文</strong> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="logo.png" alt="mcp-tool-shop" width="200" />
</p>

<h1 align="center">Repo Crawler MCP</h1>

<p align="center">
  将GitHub仓库转化为AI代理可用的结构化数据的MCP服务器。<br>
  元数据、Issue、安全警报、SBOM — 一次工具调用即可获取。
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> &middot;
  <a href="#工具">工具</a> &middot;
  <a href="#数据层级">数据层级</a> &middot;
  <a href="#配置">配置</a> &middot;
  <a href="#架构">架构</a> &middot;
  <a href="#许可证">许可证</a>
</p>

---

## 为什么需要

使用代码的AI代理需要理解仓库 — 不仅仅是文件，而是全貌：谁在贡献、哪里有问题、哪些依赖存在漏洞、项目活跃度如何。手动抓取会消耗API配额和上下文窗口。

**Repo Crawler MCP** 将GitHub的整个数据面作为结构化MCP工具公开。只需调用一次 `crawl_repo`（`tier: '3'`），即可获取元数据、文件树、语言、README、提交、贡献者、分支、标签、发布、社区健康、CI工作流、Issue、PR、流量、里程碑、Dependabot警报、安全公告、SBOM、代码扫描警报和密钥扫描警报 — 均支持选择性获取、速率限制和优雅降级。

## 特性

- **5个MCP工具** — 爬取仓库、爬取组织、摘要、比较、导出
- **3层数据模型** — 从轻量开始，按需深入
- **选择性获取** — 仅调用所需的API，节省配额
- **优雅降级** — Dependabot的403不会终止整个爬取；每个部分独立追踪权限
- **内置速率限制** — Octokit节流，429时自动重试
- **安全导出** — CSV具备公式注入防护，Markdown具备管道符转义
- **适配器模式** — 首先支持GitHub，可扩展至GitLab/Bitbucket

## 快速开始

### 使用Claude Code

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

### 使用Claude Desktop

将相同配置添加到 `claude_desktop_config.json`。

### 配置

| 变量 | 是否必需 | 描述 |
|------|---------|------|
| `GITHUB_TOKEN` | 推荐 | GitHub个人访问令牌。无令牌：60请求/小时。有令牌：5,000请求/小时。 |

**各层级所需令牌权限：**

| 层级 | 所需权限 |
|------|---------|
| 层级1 | `public_repo`（私有仓库需要`repo`） |
| 层级2 | 同上 + 流量数据需要push/admin权限 |
| 层级3 | 同上 + Dependabot、代码扫描、密钥扫描需要`security_events` |

## 工具

### `crawl_repo`

主要工具。以任意数据层级爬取单个仓库。

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| 参数 | 类型 | 默认值 | 描述 |
|------|------|-------|------|
| `owner` | string | — | 仓库所有者 |
| `repo` | string | — | 仓库名称 |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | 数据层级 |
| `sections` | string[] | 全部 | 要包含的特定部分 |
| `exclude_sections` | string[] | 无 | 要跳过的部分 |
| `commit_limit` | number | 30 | 最大提交数（层级1） |
| `contributor_limit` | number | 30 | 最大贡献者数（层级1） |
| `issue_limit` | number | 100 | 最大Issue数（层级2） |
| `pr_limit` | number | 100 | 最大PR数（层级2） |
| `issue_state` | `'open'` \| `'closed'` \| `'all'` | `'all'` | Issue/PR过滤器（层级2） |
| `alert_limit` | number | 100 | 最大安全警报数（层级3） |

### `crawl_org`

使用过滤器爬取组织中的所有仓库。

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| 参数 | 类型 | 默认值 | 描述 |
|------|------|-------|------|
| `org` | string | — | 组织名称 |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | 每个仓库的数据层级 |
| `min_stars` | number | 0 | 最小星标数 |
| `language` | string | any | 按主要语言过滤 |
| `include_forks` | boolean | false | 包含分叉仓库 |
| `include_archived` | boolean | false | 包含归档仓库 |
| `repo_limit` | number | 30 | 最大仓库数 |
| `alert_limit` | number | 30 | 每个仓库的最大安全警报数（层级3） |

### `get_repo_summary`

快速的人类可读摘要。仅4次API调用 — 非常适合分类筛选。

```
get_repo_summary({ owner: "anthropics", repo: "claude-code" })
```

### `compare_repos`

2-5个仓库的并排比较。星标、语言、活跃度、社区健康、大小。

```
compare_repos({ repos: [
  { owner: "vitejs", repo: "vite" },
  { owner: "webpack", repo: "webpack" }
]})
```

### `export_data`

将爬取结果导出为JSON、CSV或Markdown。CSV包含公式注入防护。

```
export_data({ data: crawlResult, format: "markdown", sections: ["metadata", "issues"] })
```

## 数据层级

### 层级1 — 仓库基本信息

一目了然地理解仓库所需的一切。

| 部分 | API端点 | 调用次数 |
|------|---------|---------|
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

**预算：每次完整爬取约11次API调用。使用令牌时每小时可完成约450次完整爬取。**

### 层级2 — 项目活动（包含层级1）

Issue、PR、流量、里程碑 — 项目的脉搏。

| 部分 | API端点 | 调用次数 | 备注 |
|------|---------|---------|------|
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | 需要push/admin权限。403时优雅降级。 |
| `issues` | `GET /repos/.../issues` | 1+ | 过滤掉PR。正文限制在500字符。 |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | 包含草稿/已合并状态、head/base引用。 |
| `milestones` | `GET /repos/.../milestones` | 1+ | 所有状态（open + closed）。 |
| `discussions` | _（GraphQL — 存根）_ | 0 | 返回空。计划在未来版本中实现。 |

### 层级3 — 安全与合规（包含层级1 + 2）

漏洞数据、依赖分析、泄露的密钥。

| 部分 | API端点 | 调用次数 | 备注 |
|------|---------|---------|------|
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | CVE/GHSA ID、补丁版本、严重程度。 |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | 仓库级别的公告及漏洞详情。 |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | SPDX格式。包、版本、许可证、生态系统。 |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL、Semgrep等。规则ID、文件位置。 |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | 泄露的令牌/密钥。推送保护绕过追踪。 |

**权限追踪：** 每个层级3部分都返回权限状态（`granted`、`denied`或`not_enabled`），使代理能够准确了解可访问的内容和需要提升权限的部分。

**优雅降级：** 每个部分独立获取。代码扫描的403不会阻止Dependabot或SBOM。

## 使用示例

### 快速仓库分类
```
get_repo_summary({ owner: "expressjs", repo: "express" })
```

### 深度安全审计
```
crawl_repo({ owner: "myorg", repo: "api-server", tier: "3" })
```

### 框架比较
```
compare_repos({ repos: [
  { owner: "sveltejs", repo: "svelte" },
  { owner: "vuejs", repo: "core" },
  { owner: "facebook", repo: "react" }
], aspects: ["metadata", "activity", "community"] })
```

### 导出Issue为CSV
```
const result = crawl_repo({ owner: "myorg", repo: "app", tier: "2", sections: ["issues"] })
export_data({ data: result, format: "csv" })
```

### 全组织漏洞扫描
```
crawl_org({ org: "myorg", tier: "3", alert_limit: 50 })
```

## 开发

```bash
npm install
npm run typecheck    # 使用tsc进行类型检查
npm test             # 使用vitest运行测试
npm run build        # 编译到build/
```

### 测试覆盖

5个测试文件中的60个测试：
- **验证** — 所有者/仓库正则表达式、URL解析、边界情况
- **CSV转义** — 公式注入向量、引号、特殊字符
- **Markdown转义** — 管道符和换行转义
- **GitHub适配器** — 层级1/2/3获取、部分过滤、错误处理、权限追踪
- **工具模式** — Zod验证、参数默认值

## 架构

```
src/
  index.ts              # 入口点（npx用shebang）
  server.ts             # MCP服务器设置 + 工具注册
  types.ts              # 所有接口、Zod模式、错误码、层级常量
  adapters/
    types.ts            # 平台无关适配器接口
    github.ts           # 通过Octokit的GitHub API（层级1/2/3）
  tools/
    crawlRepo.ts        # crawl_repo — 单仓库爬取
    crawlOrg.ts         # crawl_org — 带过滤器的组织爬取
    repoSummary.ts      # get_repo_summary — 轻量4次调用摘要
    compareRepos.ts     # compare_repos — 并排比较
    exportData.ts       # export_data — JSON/CSV/Markdown导出
  utils/
    logger.ts           # 仅stderr日志（stdout保留给MCP）
    errors.ts           # CrawlerError类、结构化错误响应
    validation.ts       # 所有者/仓库/URL验证（正则表达式）
    csvEscape.ts        # 公式注入防护 + CSV引号处理
    mdEscape.ts         # 管道符转义、表格换行移除
```

### 设计原则

- **选择性获取** — 不为不使用的功能付费。请求`sections: ["metadata", "issues"]`时，仅调用相应的API。
- **安全时并行执行** — 独立的单次调用端点（metadata、tree、languages、readme、community）通过`Promise.allSettled`运行。分页端点带早期终止的顺序执行。
- **优雅降级** — 每个API调用都用try/catch包裹。单个失败返回默认值，不会导致爬取崩溃。
- **权限感知** — 层级3追踪哪些安全端点返回了403与404。代理可以推断其拥有的访问权限。

## 许可证

[MIT](LICENSE)
