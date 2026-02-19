<p align="center">
  <a href="README.md">English</a> | <strong>日本語</strong> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="logo.png" alt="mcp-tool-shop" width="200" />
</p>

<h1 align="center">Repo Crawler MCP</h1>

<p align="center">
  GitHubリポジトリをAIエージェント向けの構造化データに変換するMCPサーバー。<br>
  メタデータ、Issue、セキュリティアラート、SBOM — すべてを1回のツールコールで。
</p>

<p align="center">
  <a href="#クイックスタート">クイックスタート</a> &middot;
  <a href="#ツール">ツール</a> &middot;
  <a href="#データティア">データティア</a> &middot;
  <a href="#設定">設定</a> &middot;
  <a href="#アーキテクチャ">アーキテクチャ</a> &middot;
  <a href="#ライセンス">ライセンス</a>
</p>

---

## なぜ必要か

コードを扱うAIエージェントはリポジトリを理解する必要があります。ファイルだけでなく、全体像が必要です：誰がコントリビュートしているか、何が壊れているか、どの依存関係に脆弱性があるか、プロジェクトがどれだけ活発か。手作業でスクレイピングするとAPIクォータとコンテキストウィンドウを消費します。

**Repo Crawler MCP**はGitHubのデータ全体を構造化されたMCPツールとして公開します。`crawl_repo`を`tier: '3'`で1回呼び出すだけで、メタデータ、ファイルツリー、言語、README、コミット、コントリビューター、ブランチ、タグ、リリース、コミュニティヘルス、CIワークフロー、Issue、PR、トラフィック、マイルストーン、Dependabotアラート、セキュリティアドバイザリ、SBOM、コードスキャンアラート、シークレットスキャンアラートを取得できます。すべてセクション選択可能、レート制限付き、グレースフルデグラデーション対応です。

## 特徴

- **5つのMCPツール** — リポジトリのクロール、組織のクロール、要約、比較、エクスポート
- **3段階データモデル** — 軽量から開始、必要に応じて深堀り
- **セクション選択フェッチ** — 必要なAPIのみ呼び出し、クォータを節約
- **グレースフルデグラデーション** — Dependabotの403がクロール全体を停止させません。セクションごとに権限を追跡
- **レート制限内蔵** — Octokitスロットリングと429時の自動リトライ
- **安全なエクスポート** — 数式インジェクション防止付きCSV、パイプエスケープ付きMarkdown
- **アダプターパターン** — GitHub対応、GitLab/Bitbucketへ拡張可能

## クイックスタート

### Claude Codeで使用

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

### Claude Desktopで使用

同じ設定を`claude_desktop_config.json`に追加してください。

### 設定

| 変数 | 必須 | 説明 |
|------|------|------|
| `GITHUB_TOKEN` | 推奨 | GitHub個人アクセストークン。なし：60リクエスト/時。あり：5,000リクエスト/時。 |

**ティアごとのトークンスコープ：**

| ティア | 必要なスコープ |
|--------|---------------|
| ティア1 | `public_repo`（プライベートリポジトリの場合は`repo`） |
| ティア2 | 同上 + トラフィックデータ用のpush/admin権限 |
| ティア3 | 同上 + Dependabot、コードスキャン、シークレットスキャン用の`security_events` |

## ツール

### `crawl_repo`

メインツール。単一リポジトリを任意のデータティアでクロール。

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| パラメータ | 型 | デフォルト | 説明 |
|-----------|------|---------|------|
| `owner` | string | — | リポジトリオーナー |
| `repo` | string | — | リポジトリ名 |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | データティア |
| `sections` | string[] | すべて | 含めるセクション |
| `exclude_sections` | string[] | なし | スキップするセクション |
| `commit_limit` | number | 30 | 最大コミット数（ティア1） |
| `contributor_limit` | number | 30 | 最大コントリビューター数（ティア1） |
| `issue_limit` | number | 100 | 最大Issue数（ティア2） |
| `pr_limit` | number | 100 | 最大PR数（ティア2） |
| `issue_state` | `'open'` \| `'closed'` \| `'all'` | `'all'` | Issue/PRフィルター（ティア2） |
| `alert_limit` | number | 100 | 最大セキュリティアラート数（ティア3） |

### `crawl_org`

組織内のすべてのリポジトリをフィルター付きでクロール。

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| パラメータ | 型 | デフォルト | 説明 |
|-----------|------|---------|------|
| `org` | string | — | 組織名 |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | リポジトリごとのデータティア |
| `min_stars` | number | 0 | 最小スター数 |
| `language` | string | any | 主要言語でフィルター |
| `include_forks` | boolean | false | フォークを含める |
| `include_archived` | boolean | false | アーカイブを含める |
| `repo_limit` | number | 30 | 最大リポジトリ数 |
| `alert_limit` | number | 30 | リポジトリごとの最大セキュリティアラート数（ティア3） |

### `get_repo_summary`

素早い人間が読める要約。APIコール4回のみ — トリアージに最適。

```
get_repo_summary({ owner: "anthropics", repo: "claude-code" })
```

### `compare_repos`

2〜5個のリポジトリを横並び比較。スター、言語、アクティビティ、コミュニティヘルス、サイズ。

```
compare_repos({ repos: [
  { owner: "vitejs", repo: "vite" },
  { owner: "webpack", repo: "webpack" }
]})
```

### `export_data`

クロール結果をJSON、CSV、Markdownでエクスポート。CSVは数式インジェクション防止付き。

```
export_data({ data: crawlResult, format: "markdown", sections: ["metadata", "issues"] })
```

## データティア

### ティア1 — リポジトリ基本情報

リポジトリを一目で理解するために必要なすべて。

| セクション | APIエンドポイント | コール数 |
|-----------|-----------------|---------|
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

**予算：フルクロールあたり約11 APIコール。トークン使用時は毎時約450回のフルクロールが可能。**

### ティア2 — プロジェクトアクティビティ（ティア1を含む）

Issue、PR、トラフィック、マイルストーン — プロジェクトの脈拍。

| セクション | APIエンドポイント | コール数 | 備考 |
|-----------|-----------------|---------|------|
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | push/admin権限が必要。403時はグレースフルデグラデーション。 |
| `issues` | `GET /repos/.../issues` | 1+ | PRを除外。本文は500文字に制限。 |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | ドラフト/マージ状態、head/baseリファレンスを含む。 |
| `milestones` | `GET /repos/.../milestones` | 1+ | 全状態（open + closed）。 |
| `discussions` | _（GraphQL — スタブ）_ | 0 | 空を返す。将来のリリースで予定。 |

### ティア3 — セキュリティ＆コンプライアンス（ティア1 + 2を含む）

脆弱性データ、依存関係分析、漏洩シークレット。

| セクション | APIエンドポイント | コール数 | 備考 |
|-----------|-----------------|---------|------|
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | CVE/GHSA ID、パッチ済みバージョン、重大度。 |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | リポジトリレベルのアドバイザリと脆弱性詳細。 |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | SPDX形式。パッケージ、バージョン、ライセンス、エコシステム。 |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL、Semgrep等。ルールID、ファイル位置。 |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | 漏洩したトークン/キー。プッシュ保護バイパス追跡。 |

**権限追跡：** 各ティア3セクションは権限ステータス（`granted`、`denied`、`not_enabled`）を返すため、エージェントはアクセス可能な範囲と昇格が必要な箇所を正確に把握できます。

**グレースフルデグラデーション：** 各セクションは独立してフェッチされます。コードスキャンの403がDependabotやSBOMをブロックしません。

## 使用例

### 素早いリポジトリトリアージ
```
get_repo_summary({ owner: "expressjs", repo: "express" })
```

### 詳細なセキュリティ監査
```
crawl_repo({ owner: "myorg", repo: "api-server", tier: "3" })
```

### フレームワーク比較
```
compare_repos({ repos: [
  { owner: "sveltejs", repo: "svelte" },
  { owner: "vuejs", repo: "core" },
  { owner: "facebook", repo: "react" }
], aspects: ["metadata", "activity", "community"] })
```

### IssueをCSVにエクスポート
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
npm run typecheck    # tscで型チェック
npm test             # vitestでテスト実行
npm run build        # build/にコンパイル
```

### テストカバレッジ

5つのテストファイルにわたる60テスト：
- **バリデーション** — オーナー/リポジトリ正規表現、URL解析、エッジケース
- **CSVエスケープ** — 数式インジェクションベクター、クォート、特殊文字
- **Markdownエスケープ** — パイプと改行のエスケープ
- **GitHubアダプター** — ティア1/2/3フェッチ、セクションフィルタリング、エラーハンドリング、権限追跡
- **ツールスキーマ** — Zodバリデーション、パラメータデフォルト

## アーキテクチャ

```
src/
  index.ts              # エントリーポイント（npx用shebang）
  server.ts             # MCPサーバーセットアップ + ツール登録
  types.ts              # 全インターフェース、Zodスキーマ、エラーコード、ティア定数
  adapters/
    types.ts            # プラットフォーム非依存アダプターインターフェース
    github.ts           # Octokit経由のGitHub API（ティア1/2/3）
  tools/
    crawlRepo.ts        # crawl_repo — 単一リポジトリクロール
    crawlOrg.ts         # crawl_org — フィルター付き組織クロール
    repoSummary.ts      # get_repo_summary — 軽量4コール要約
    compareRepos.ts     # compare_repos — 横並び比較
    exportData.ts       # export_data — JSON/CSV/Markdownエクスポート
  utils/
    logger.ts           # stderr専用ロガー（stdoutはMCP用に予約）
    errors.ts           # CrawlerErrorクラス、構造化エラーレスポンス
    validation.ts       # オーナー/リポジトリ/URLバリデーション（正規表現）
    csvEscape.ts        # 数式インジェクション防止 + CSVクォート
    mdEscape.ts         # パイプエスケープ、テーブル用改行除去
```

### 設計原則

- **セクション選択フェッチ** — 使わないものにコストをかけない。`sections: ["metadata", "issues"]`をリクエストすると、そのAPIだけが呼び出されます。
- **安全な場合は並列実行** — 独立した単一コールエンドポイント（metadata、tree、languages、readme、community）は`Promise.allSettled`で実行。ページネーション付きエンドポイントは早期終了付きで順次実行。
- **グレースフルデグラデーション** — すべてのAPIコールはtry/catchでラップ。単一の失敗はデフォルト値を返し、クロールをクラッシュさせません。
- **権限認識** — ティア3はどのセキュリティエンドポイントが403 vs 404を返したかを追跡。エージェントはアクセス権について推論できます。

## ライセンス

[MIT](LICENSE)
