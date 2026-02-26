<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## なぜか

コードを扱うAIエージェントは、リポジトリを理解する必要があります。単にファイルだけでなく、全体像を把握する必要があります。具体的には、誰が貢献しているか、何が壊れているか、どの依存関係に脆弱性があるか、プロジェクトの活動状況などを理解する必要があります。これらを手動で収集すると、APIの利用制限やコンテキストウィンドウを圧迫してしまいます。

**Repo Crawler MCP** は、GitHubのすべてのデータを構造化されたMCPツールとして公開します。`crawl_repo` コマンドを `tier: '3'` オプション付きで1回実行するだけで、メタデータ、ファイルツリー、使用言語、README、コミット履歴、貢献者、ブランチ、タグ、リリース情報、コミュニティの状況、CIワークフロー、課題、プルリクエスト、トラフィック、マイルストーン、Dependabotのアラート、セキュリティに関するアドバイス、SBOM（ソフトウェア部品表）、コードスキャンアラート、およびシークレットスキャンアラートなど、あらゆる情報を取得できます。これらの情報は、セクションごとに選択可能で、レート制限があり、また、エラー発生時にも適切に処理されます。

## 機能

- **5つのMCPツール**：リポジトリのクロール、組織のクロール、要約、比較、エクスポート
- **3段階のデータモデル**：最初は軽く、必要に応じて詳細な情報を取得
- **セクションごとの取得**：必要なAPIのみを呼び出すことで、利用制限を節約
- **エラー発生時の適切な処理**：Dependabotでエラーが発生しても、クロール全体が停止しない。各セクションごとに権限が管理される
- **組み込みのレート制限**：Octokitによるスロットリング。429エラーが発生した場合、自動的にリトライ
- **安全なエクスポート**：CSVファイルは、数式インジェクションを防止。Markdownファイルは、パイプ記号のエスケープ処理
- **アダプターパターン**：GitHubを基本とし、GitLab/Bitbucketへの拡張が可能

## クイックスタート

### Claude Codeを使用する場合

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

### Claude Desktopを使用する場合

`claude_desktop_config.json` ファイルに、同じ設定を追加してください。

### 設定

| 変数 | 必須 | 説明 |
| ---------- | ---------- | ------------- |
| `GITHUB_TOKEN` | 推奨 | GitHubのパーソナルアクセス トークン。これがない場合、1時間あたり60件のアクセスに制限されます。これがある場合、1時間あたり5,000件のアクセスが可能になります。 |

**ティアごとのトークンスコープ:**

| ティア | 必要なスコープ |
| ------ | ---------------- |
| ティア1 | `public_repo` (または、プライベートリポジトリの場合は `repo`) |
| ティア2 | 上記 + トラフィックデータ取得のための `push/admin` アクセス |
| ティア3 | 上記 + Dependabot、コードスキャン、シークレットスキャンに必要な `security_events` |

## ツール

### `crawl_repo`

メインのツール。任意のデータティアのリポジトリをクロールします。

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| パラメータ | 型 | デフォルト値 | 説明 |
| ------- | ------ | --------- | ------------- |
| `owner` | string | — | リポジトリの所有者 |
| `repo` | string | — | リポジトリ名 |
| `tier` | `'1'` | `'2'` | `'3'` | `'1'` | データティア |
| `sections` | string[] | all (すべて) | 含めるセクション |
| `exclude_sections` | string[] | none (なし) | 除外するセクション |
| `commit_limit` | number | 30 | 最大コミット数 (ティア1) |
| `contributor_limit` | number | 30 | 最大貢献者数 (ティア1) |
| `issue_limit` | number | 100 | 最大課題数 (ティア2) |
| `pr_limit` | number | 100 | 最大プルリクエスト数 (ティア2) |
| `issue_state` | `'open'` (オープン) | `'closed'` (クローズ) | `'all'` | `'all'` | 課題/プルリクエストのフィルタ (ティア2) |
| `alert_limit` | number | 100 | 最大セキュリティアラート数 (ティア3) |

### `crawl_org`

組織内のすべてのリポジトリを、フィルタリングしてクロールします。

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| パラメータ | 型 | デフォルト値 | 説明 |
| ------- | ------ | --------- | ------------- |
| `org` | string | — | 組織名 |
| `tier` | `'1'` | `'2'` | `'3'` | `'1'` | Data tier per repo |
| `min_stars` | 数値 | 0 | 最小スター数 |
| `language` | 文字列 | 任意 | 主要言語でフィルタリング |
| `include_forks` | 真偽値 | 偽 | フォークされたリポジトリを含める |
| `include_archived` | 真偽値 | 偽 | アーカイブされたリポジトリを含める |
| `repo_limit` | 数値 | 30 | クロールする最大リポジトリ数 |
| `alert_limit` | 数値 | 30 | リポジトリごとのセキュリティアラートの最大数（Tier 3） |

### `get_repo_summary`

簡潔で人間が理解しやすい概要。API呼び出しはわずか4回。トリアージに最適です。

```
get_repo_summary({ owner: "anthropics", repo: "claude-code" })
```

### `compare_repos`

2～5つのリポジトリを並べて比較。スター数、使用言語、アクティビティ、コミュニティの健全性、サイズを表示します。

```
compare_repos({ repos: [
  { owner: "vitejs", repo: "vite" },
  { owner: "webpack", repo: "webpack" }
]})
```

### `export_data`

クロール結果をJSON、CSV、またはMarkdown形式でエクスポートします。CSV形式では、数式インジェクション対策が含まれています。

```
export_data({ data: crawlResult, format: "markdown", sections: ["metadata", "issues"] })
```

## データ階層

### Tier 1 — リポジトリの基本情報

リポジトリを一目で理解するために必要な情報がすべて含まれています。

| セクション | APIエンドポイント | 呼び出し回数 |
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

**予算：完全なクロールあたり、約11回のAPI呼び出し。トークンを使用した場合、1時間あたり約450回の完全クロールが可能です。**

### Tier 2 — プロジェクトのアクティビティ（Tier 1を含む）

課題、プルリクエスト、トラフィック、マイルストーンなど、プロジェクトの状況を把握できます。

| セクション | APIエンドポイント | 呼び出し回数 | 備考 |
| --------- | ------------- | ------- | ------- |
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | push/admin権限が必要です。403エラーが発生した場合でも、機能は低下しません。 |
| `issues` | `GET /repos/.../issues` | 1+ | プルリクエストを除外します。本文は500文字までに制限されます。 |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | ドラフト/マージの状態、head/base refsを含みます。 |
| `milestones` | `GET /repos/.../milestones` | 1+ | すべての状態（オープン + クローズド）。 |
| `discussions` | _(GraphQL — プレビュー版)_ | 0 | 空の値が返されます。将来のリリースで実装予定です。 |

### Tier 3 — セキュリティとコンプライアンス（Tier 1 + 2を含む）

脆弱性データ、依存関係分析、漏洩したシークレットなど。

| セクション | APIエンドポイント | 呼び出し回数 | 備考 |
| --------- | ------------- | ------- | ------- |
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | CVE/GHSA ID、修正されたバージョン、深刻度。 |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | リポジトリレベルのアドバイザリで、脆弱性の詳細を表示します。 |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | SPDX形式。パッケージ、バージョン、ライセンス、エコシステムの情報が含まれます。 |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL、Semgrepなど。ルールID、ファイル場所の情報が含まれます。 |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | 漏洩したトークン/キーの情報。push保護のバイパス状況を追跡します。 |

**権限の追跡：** Tier 3の各セクションでは、権限の状態（`granted`、`denied`、または`not_enabled`）が返されるため、エージェントはアクセス可能なものと、より高い権限が必要なものを正確に把握できます。

**段階的な機能低下：** 各セクションは独立して取得されます。コードスキャンで403エラーが発生しても、DependabotやSBOMは機能します。

## 例

### リポジトリの初期トリアージ
```
get_repo_summary({ owner: "expressjs", repo: "express" })
```

### 詳細なセキュリティ監査
```
crawl_repo({ owner: "myorg", repo: "api-server", tier: "3" })
```

### フレームワークの比較
```
compare_repos({ repos: [
  { owner: "sveltejs", repo: "svelte" },
  { owner: "vuejs", repo: "core" },
  { owner: "facebook", repo: "react" }
], aspects: ["metadata", "activity", "community"] })
```

### 課題をCSV形式でエクスポート
```
const result = crawl_repo({ owner: "myorg", repo: "app", tier: "2", sections: ["issues"] })
export_data({ data: result, format: "csv" })
```

### 組織全体の脆弱性スキャン
```
crawl_org({ org: "myorg", tier: "3", alert_limit: 50 })
```

## 開発

```bash
npm install
npm run typecheck    # Type check with tsc
npm test             # Run tests with vitest
npm run build        # Compile to build/
```

### テストカバレッジ

5つのテストファイルにまたがる60個のテスト：
- **検証：** owner/repoの正規表現、URLの解析、エッジケース
- **CSVのエスケープ：** 数式インジェクションの対策、引用符、特殊文字
- **Markdownのエスケープ：** パイプと改行のエスケープ
- **GitHubアダプター：** Tier 1/2/3の取得、セクションのフィルタリング、エラー処理、権限の追跡
- **ツールのスキーマ：** Zodによる検証、パラメータのデフォルト値

## アーキテクチャ

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

### 設計原則

- **セクション単位でのデータ取得**：不要なデータに対しては料金が発生しません。`sections: ["metadata", "issues"]` を指定すると、指定されたAPIのみが呼び出されます。
- **可能な場合は並列処理**：独立した単一のAPIエンドポイント（メタデータ、ツリー構造、言語、README、コミュニティ）は、`Promise.allSettled` を使用して並列で実行されます。ページネーションされたエンドポイントは、順次で実行され、必要に応じて早期に終了します。
- **エラー発生時の安全な処理**：すべてのAPI呼び出しは、try/catchブロックで囲まれています。エラーが発生した場合でも、デフォルト値が返され、クローリングが中断されることはありません。
- **権限の認識**：Tier 3では、どのセキュリティエンドポイントが403エラー（アクセス拒否）または404エラー（リソースが見つからない）を返したかを追跡します。これにより、エージェントは自身のアクセス権限について推測することができます。

## ライセンス

[MIT](LICENSE)

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> が作成しました。
