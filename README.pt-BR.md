<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <strong>Português</strong>
</p>

<p align="center">
  <img src="logo.png" alt="mcp-tool-shop" width="200" />
</p>

<h1 align="center">Repo Crawler MCP</h1>

<p align="center">
  Um servidor MCP que transforma repositórios do GitHub em dados estruturados para agentes de IA.<br>
  Metadados, issues, alertas de segurança, SBOMs — tudo em uma única chamada de ferramenta.
</p>

<p align="center">
  <a href="#início-rápido">Início Rápido</a> &middot;
  <a href="#ferramentas">Ferramentas</a> &middot;
  <a href="#níveis-de-dados">Níveis de Dados</a> &middot;
  <a href="#configuração">Configuração</a> &middot;
  <a href="#arquitetura">Arquitetura</a> &middot;
  <a href="#licença">Licença</a>
</p>

---

## Por quê

Agentes de IA que trabalham com código precisam entender repositórios — não apenas os arquivos, mas o quadro completo: quem contribui, o que está quebrado, quais dependências são vulneráveis, o quão ativo é o projeto. Fazer scraping manual consome cota de API e janela de contexto.

**Repo Crawler MCP** expõe toda a superfície de dados do GitHub como ferramentas MCP estruturadas. Uma única chamada a `crawl_repo` com `tier: '3'` retorna metadados, árvore de arquivos, linguagens, README, commits, contribuidores, branches, tags, releases, saúde da comunidade, workflows de CI, issues, PRs, tráfego, marcos, alertas do Dependabot, avisos de segurança, SBOM, alertas de varredura de código e alertas de varredura de segredos — tudo com seleção por seção, limitação de taxa e degradação graciosa.

## Recursos

- **5 ferramentas MCP** — rastrear repos, rastrear organizações, resumir, comparar, exportar
- **Modelo de dados de 3 níveis** — comece leve, aprofunde quando precisar
- **Busca seletiva por seção** — chama apenas as APIs solicitadas, economizando cota
- **Degradação graciosa** — um 403 no Dependabot não interrompe o rastreamento; permissões rastreadas por seção
- **Limitação de taxa integrada** — throttling do Octokit com retry automático em 429s
- **Exportações seguras** — CSV com prevenção de injeção de fórmulas, Markdown com escape de pipes
- **Padrão adaptador** — GitHub primeiro, extensível para GitLab/Bitbucket

## Início Rápido

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

Adicione a mesma configuração ao seu `claude_desktop_config.json`.

### Configuração

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `GITHUB_TOKEN` | Recomendado | Token de Acesso Pessoal do GitHub. Sem: 60 req/h. Com: 5.000 req/h. |

**Escopos de token por nível:**

| Nível | Escopos Necessários |
|-------|-------------------|
| Nível 1 | `public_repo` (ou `repo` para repos privados) |
| Nível 2 | Mesmo + acesso push/admin para dados de tráfego |
| Nível 3 | Mesmo + `security_events` para Dependabot, varredura de código, varredura de segredos |

## Ferramentas

### `crawl_repo`

A ferramenta principal. Rastreia um único repositório em qualquer nível de dados.

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `owner` | string | — | Proprietário do repositório |
| `repo` | string | — | Nome do repositório |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | Nível de dados |
| `sections` | string[] | todos | Seções específicas para incluir |
| `exclude_sections` | string[] | nenhuma | Seções para pular |
| `commit_limit` | number | 30 | Máximo de commits (Nível 1) |
| `contributor_limit` | number | 30 | Máximo de contribuidores (Nível 1) |
| `issue_limit` | number | 100 | Máximo de issues (Nível 2) |
| `pr_limit` | number | 100 | Máximo de PRs (Nível 2) |
| `issue_state` | `'open'` \| `'closed'` \| `'all'` | `'all'` | Filtro de Issue/PR (Nível 2) |
| `alert_limit` | number | 100 | Máximo de alertas de segurança (Nível 3) |

### `crawl_org`

Rastreia todos os repos de uma organização com filtros.

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `org` | string | — | Nome da organização |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | Nível de dados por repo |
| `min_stars` | number | 0 | Mínimo de estrelas |
| `language` | string | any | Filtrar por linguagem principal |
| `include_forks` | boolean | false | Incluir repos forkados |
| `include_archived` | boolean | false | Incluir repos arquivados |
| `repo_limit` | number | 30 | Máximo de repos |
| `alert_limit` | number | 30 | Máximo de alertas de segurança por repo (Nível 3) |

### `get_repo_summary`

Resumo rápido legível por humanos. Apenas 4 chamadas de API — ideal para triagem.

```
get_repo_summary({ owner: "anthropics", repo: "claude-code" })
```

### `compare_repos`

Comparação lado a lado de 2–5 repos. Estrelas, linguagens, atividade, saúde da comunidade, tamanho.

```
compare_repos({ repos: [
  { owner: "vitejs", repo: "vite" },
  { owner: "webpack", repo: "webpack" }
]})
```

### `export_data`

Exporta resultados do rastreamento como JSON, CSV ou Markdown. CSV inclui prevenção de injeção de fórmulas.

```
export_data({ data: crawlResult, format: "markdown", sections: ["metadata", "issues"] })
```

## Níveis de Dados

### Nível 1 — Fundamentos do Repositório

Tudo que você precisa para entender um repo de relance.

| Seção | Endpoint da API | Chamadas |
|-------|----------------|----------|
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

**Orçamento: ~11 chamadas de API por rastreamento completo. ~450 rastreamentos completos/h com token.**

### Nível 2 — Atividade do Projeto (inclui Nível 1)

Issues, PRs, tráfego, marcos — o pulso do projeto.

| Seção | Endpoint da API | Chamadas | Notas |
|-------|----------------|----------|-------|
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | Requer acesso push/admin. Degradação graciosa em 403. |
| `issues` | `GET /repos/.../issues` | 1+ | Filtra PRs. Corpo limitado a 500 caracteres. |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | Inclui status rascunho/merged, refs head/base. |
| `milestones` | `GET /repos/.../milestones` | 1+ | Todos os estados (open + closed). |
| `discussions` | _(GraphQL — stub)_ | 0 | Retorna vazio. Planejado para versão futura. |

### Nível 3 — Segurança & Conformidade (inclui Nível 1 + 2)

Dados de vulnerabilidade, análise de dependências, segredos vazados.

| Seção | Endpoint da API | Chamadas | Notas |
|-------|----------------|----------|-------|
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | IDs CVE/GHSA, versões corrigidas, severidade. |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | Avisos no nível do repo com detalhes de vulnerabilidade. |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | Formato SPDX. Pacotes, versões, licenças, ecossistemas. |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL, Semgrep, etc. IDs de regras, localizações de arquivos. |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | Tokens/chaves vazados. Rastreamento de bypass de proteção push. |

**Rastreamento de permissões:** Cada seção do Nível 3 retorna um status de permissão (`granted`, `denied` ou `not_enabled`) para que o agente saiba exatamente o que é acessível e o que requer acesso elevado.

**Degradação graciosa:** Cada seção é buscada independentemente. Um 403 na varredura de código não bloqueia o Dependabot ou SBOM.

## Exemplos

### Triagem rápida de repo
```
get_repo_summary({ owner: "expressjs", repo: "express" })
```

### Auditoria de segurança aprofundada
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

### Exportar issues para CSV
```
const result = crawl_repo({ owner: "myorg", repo: "app", tier: "2", sections: ["issues"] })
export_data({ data: result, format: "csv" })
```

### Varredura de vulnerabilidades em toda a organização
```
crawl_org({ org: "myorg", tier: "3", alert_limit: 50 })
```

## Desenvolvimento

```bash
npm install
npm run typecheck    # Verificação de tipos com tsc
npm test             # Executar testes com vitest
npm run build        # Compilar para build/
```

### Cobertura de Testes

60 testes em 5 arquivos de teste:
- **Validação** — regex de owner/repo, parsing de URL, casos limite
- **Escape CSV** — vetores de injeção de fórmulas, aspas, caracteres especiais
- **Escape Markdown** — escape de pipes e quebras de linha
- **Adaptador GitHub** — busca Nível 1/2/3, filtragem de seções, tratamento de erros, rastreamento de permissões
- **Schemas de ferramentas** — validação Zod, valores padrão de parâmetros

## Arquitetura

```
src/
  index.ts              # Ponto de entrada (shebang para npx)
  server.ts             # Setup do servidor MCP + registro de ferramentas
  types.ts              # Todas as interfaces, schemas Zod, códigos de erro, constantes de nível
  adapters/
    types.ts            # Interface de adaptador agnóstica de plataforma
    github.ts           # API do GitHub via Octokit (Nível 1/2/3)
  tools/
    crawlRepo.ts        # crawl_repo — rastreamento de repo individual
    crawlOrg.ts         # crawl_org — rastreamento de organização com filtros
    repoSummary.ts      # get_repo_summary — resumo leve em 4 chamadas
    compareRepos.ts     # compare_repos — comparação lado a lado
    exportData.ts       # export_data — exportação JSON/CSV/Markdown
  utils/
    logger.ts           # Logger apenas stderr (stdout reservado para MCP)
    errors.ts           # Classe CrawlerError, respostas de erro estruturadas
    validation.ts       # Validação de owner/repo/URL com regex
    csvEscape.ts        # Prevenção de injeção de fórmulas + aspas CSV
    mdEscape.ts         # Escape de pipes, remoção de quebras de linha para tabelas
```

### Princípios de Design

- **Busca seletiva por seção** — Não pague pelo que não usa. Solicite `sections: ["metadata", "issues"]` e apenas essas APIs são chamadas.
- **Paralelo quando seguro** — Endpoints independentes de chamada única (metadata, tree, languages, readme, community) executam via `Promise.allSettled`. Endpoints paginados executam sequencialmente com terminação antecipada.
- **Degradação graciosa** — Cada chamada de API é envolvida em try/catch. Uma única falha retorna um valor padrão, nunca derruba o rastreamento.
- **Consciência de permissões** — O Nível 3 rastreia quais endpoints de segurança retornaram 403 vs 404. O agente pode raciocinar sobre o acesso que possui.

## Licença

[MIT](LICENSE)
