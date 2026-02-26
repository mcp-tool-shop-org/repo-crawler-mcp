<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
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

## Por que

Agentes de IA que trabalham com código precisam entender os repositórios — não apenas os arquivos, mas a imagem completa: quem contribui, o que está com problemas, quais dependências são vulneráveis, quão ativo é o projeto. Coletar esses dados manualmente consome a cota da API e o tamanho da janela de contexto.

O **Repo Crawler MCP** expõe toda a superfície de dados do GitHub como ferramentas MCP estruturadas. Uma única chamada para `crawl_repo` com `tier: '3'` retorna metadados, árvore de arquivos, linguagens, README, commits, colaboradores, branches, tags, releases, saúde da comunidade, fluxos de trabalho de CI, issues, PRs, tráfego, milestones, alertas do Dependabot, avisos de segurança, SBOM (Software Bill of Materials), alertas de análise de código e alertas de detecção de segredos — tudo seletivo por seção, tudo com limitação de taxa, e tudo com degradação gradual.

## Recursos

- **5 ferramentas MCP** — rastreia repositórios, rastreia organizações, resume, compara, exporta
- **Modelo de dados de 3 níveis** — comece de forma leve e aprofunde-se quando necessário
- **Coleta seletiva por seção** — chama apenas as APIs que você solicita, economizando a cota
- **Degradação gradual** — um erro 403 no Dependabot não interrompe o rastreamento; as permissões são rastreadas por seção
- **Limitação de taxa integrada** — controle de taxa do Octokit com repetição automática em caso de erros 429
- **Exportações seguras** — CSV com prevenção de injeção de fórmulas, Markdown com escape de pipes
- **Padrão de adaptador** — GitHub primeiro, extensível para GitLab/Bitbucket

## Como começar

### Com Claude Code

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

### Com Claude Desktop

Adicione a mesma configuração ao seu arquivo `claude_desktop_config.json`.

### Configuração

| Variável | Obrigatório | Descrição |
| ---------- | ---------- | ------------- |
| `GITHUB_TOKEN` | Recomendado | Token de acesso pessoal do GitHub. Sem ele: 60 requisições/hora. Com ele: 5.000 requisições/hora. |

**Escopos do token por nível:**

| Nível | Escopos Obrigatórios |
| ------ | ---------------- |
| Nível 1 | `public_repo` (ou `repo` para repositórios privados) |
| Nível 2 | O mesmo + acesso de push/admin para dados de tráfego |
| Nível 3 | O mesmo + `security_events` para Dependabot, análise de código e detecção de segredos |

## Ferramentas

### `crawl_repo`

A ferramenta principal. Rastreia um único repositório em qualquer nível de dados.

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| Parâmetro | Tipo | Padrão | Descrição |
| ------- | ------ | --------- | ------------- |
| `owner` | string | — | Proprietário do repositório |
| `repo` | string | — | Nome do repositório |
| `tier` | `'1'` | `'2'` | `'3'` | `'1'` | Nível de dados |
| `sections` | string[] | todos | Seções específicas a incluir |
| `exclude_sections` | string[] | nenhum | Seções a serem ignoradas |
| `commit_limit` | number | 30 | Número máximo de commits (Nível 1) |
| `contributor_limit` | number | 30 | Número máximo de colaboradores (Nível 1) |
| `issue_limit` | number | 100 | Número máximo de issues (Nível 2) |
| `pr_limit` | number | 100 | Número máximo de PRs (Nível 2) |
| `issue_state` | `'open'` | `'closed'` | `'all'` | `'all'` | Filtro de issue/PR (Nível 2) |
| `alert_limit` | number | 100 | Número máximo de alertas de segurança (Nível 3) |

### `crawl_org`

Rastreia todos os repositórios em uma organização com filtros.

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| Parâmetro | Tipo | Padrão | Descrição |
| ------- | ------ | --------- | ------------- |
| `org` | string | — | Nome da organização |
| `tier` | `'1'` | `'2'` | `'3'` | `'1'` | Data por repositório |
| `min_stars` | número | 0 | Número mínimo de estrelas |
| `language` | string | qualquer | Filtrar por linguagem principal |
| `include_forks` | booleano | falso | Incluir repositórios bifurcados |
| `include_archived` | booleano | falso | Incluir repositórios arquivados |
| `repo_limit` | número | 30 | Número máximo de repositórios a serem analisados |
| `alert_limit` | número | 30 | Número máximo de alertas de segurança por repositório (Nível 3) |

### `get_repo_summary`

Resumo rápido e legível. Apenas 4 chamadas à API — ideal para triagem.

```
get_repo_summary({ owner: "anthropics", repo: "claude-code" })
```

### `compare_repos`

Comparação lado a lado de 2 a 5 repositórios. Estrelas, linguagens, atividade, saúde da comunidade, tamanho.

```
compare_repos({ repos: [
  { owner: "vitejs", repo: "vite" },
  { owner: "webpack", repo: "webpack" }
]})
```

### `export_data`

Exportar os resultados da análise como JSON, CSV ou Markdown. O CSV inclui prevenção de injeção de fórmulas.

```
export_data({ data: crawlResult, format: "markdown", sections: ["metadata", "issues"] })
```

## Níveis de Dados

### Nível 1 — Fundamentos do Repositório

Tudo o que você precisa para entender um repositório de relance.

| Seção | Ponto de Extremidade da API | Chamadas |
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

**Orçamento: ~11 chamadas de API por análise completa. ~450 análises completas/hora com token.**

### Nível 2 — Atividade do Projeto (inclui o Nível 1)

Problemas, solicitações de alteração, tráfego, marcos — o pulso do projeto.

| Seção | Ponto de Extremidade da API | Chamadas | Notas |
| --------- | ------------- | ------- | ------- |
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | Requer acesso de push/administrador. Degrada-se de forma gradual em caso de erro 403. |
| `issues` | `GET /repos/.../issues` | 1+ | Filtra solicitações de alteração. O corpo é limitado a 500 caracteres. |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | Inclui status de rascunho/mesclado, referências de cabeçalho/base. |
| `milestones` | `GET /repos/.../milestones` | 1+ | Todos os estados (abertos + fechados). इसे |
| `discussions` | _(GraphQL — protótipo)_ | 0 | Retorna vazio. Planejado para lançamento futuro. |

### Nível 3 — Segurança e Conformidade (inclui o Nível 1 + 2)

Dados de vulnerabilidade, análise de dependências, segredos expostos.

| Seção | Ponto de Extremidade da API | Chamadas | Notas |
| --------- | ------------- | ------- | ------- |
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | IDs de CVE/GHSA, versões corrigidas, gravidade. |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | Avisos de nível de repositório com detalhes de vulnerabilidade. |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | Formato SPDX. Pacotes, versões, licenças, ecossistemas. |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL, Semgrep, etc. IDs de regras, localizações de arquivos. |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | Tokens/chaves expostos. Rastreamento de bypass de proteção de push. |

**Rastreamento de permissões:** Cada seção do Nível 3 retorna um status de permissão (`concedido`, `negado` ou `não_ativado`) para que o agente saiba exatamente o que é acessível e o que requer acesso elevado.

**Degradação gradual:** Cada seção é carregada independentemente. Um erro 403 na análise de código não impede o Dependabot ou o SBOM.

## Exemplos

### Triagem rápida de repositórios
```
get_repo_summary({ owner: "expressjs", repo: "express" })
```

### Auditoria de segurança detalhada
```
crawl_repo({ owner: "myorg", repo: "api-server", tier: "3" })
```

### Comparar frameworks
```
compare_repos({ repos: [
  { owner: "sveltejs", repo: "svelte" },
  { owner: "vuejs", repo: "core" },
  { owner: "facebook", repo: "react" }
], aspects: ["metadata", "activity", "community"] })
```

### Exportar problemas para CSV
```
const result = crawl_repo({ owner: "myorg", repo: "app", tier: "2", sections: ["issues"] })
export_data({ data: result, format: "csv" })
```

### Análise de vulnerabilidades em toda a organização
```
crawl_org({ org: "myorg", tier: "3", alert_limit: 50 })
```

## Desenvolvimento

```bash
npm install
npm run typecheck    # Type check with tsc
npm test             # Run tests with vitest
npm run build        # Compile to build/
```

### Cobertura de Testes

60 testes em 5 arquivos de teste:
- **Validação** — expressões regulares de proprietário/repositório, análise de URL, casos extremos
- **Escape de CSV** — vetores de injeção de fórmulas, aspas, caracteres especiais
- **Escape de Markdown** — escape de pipes e quebras de linha
- **Adaptador do GitHub** — busca de Nível 1/2/3, filtragem de seções, tratamento de erros, rastreamento de permissões
- **Esquemas de ferramentas** — validação Zod, valores padrão de parâmetros

## Arquitetura

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

### Princípios de Design

- **Busca seletiva por seções** — Não pague pelo que não usa. Solicite `sections: ["metadata", "issues"]` e apenas essas APIs serão chamadas.
- **Processamento paralelo sempre que possível** — Pontos de extremidade independentes e que requerem apenas uma chamada (metadados, árvore, idiomas, arquivo README, comunidade) são executados via `Promise.allSettled`. Pontos de extremidade paginados são executados sequencialmente, com término antecipado.
- **Degradação gradual** — Cada chamada de API é envolvida em um bloco try/catch. Uma única falha retorna um valor padrão e nunca interrompe o processo de coleta de dados.
- **Consciência de permissões** — O nível 3 rastreia quais pontos de extremidade de segurança retornaram 403 (proibido) em vez de 404 (não encontrado). O agente pode inferir sobre quais permissões ele possui.

## Licença

[MIT](LICENSE)

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
