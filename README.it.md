<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## Perché

Gli agenti AI che lavorano con il codice devono comprendere i repository, non solo i file, ma l'immagine completa: chi contribuisce, cosa è rotto, quali dipendenze sono vulnerabili, quanto è attivo il progetto. Raccogliere queste informazioni manualmente consuma la quota delle API e lo spazio di contesto.

**Repo Crawler MCP** espone l'intera superficie dei dati di GitHub come strumenti MCP strutturati. Una singola chiamata a `crawl_repo` con `tier: '3'` restituisce metadati, struttura dei file, linguaggi, README, commit, contributori, rami, tag, release, stato della community, workflow CI, issue, pull request, traffico, milestone, avvisi Dependabot, advisory di sicurezza, SBOM, avvisi di scansione del codice e avvisi di scansione dei segreti: tutto selettivo per sezione, tutto con limitazione di velocità e con una gestione graduale degli errori.

## Funzionalità

- **5 strumenti MCP** — esplorazione di repository, esplorazione di organizzazioni, riepilogo, confronto, esportazione
- **Modello di dati a 3 livelli** — iniziare con un'analisi superficiale, approfondire quando necessario
- **Recupero selettivo per sezione** — chiama solo le API richieste, risparmiando la quota
- **Gestione graduale degli errori** — un errore 403 su Dependabot non interrompe l'esplorazione; le autorizzazioni sono gestite per sezione
- **Limitazione della velocità integrata** — throttling di Octokit con riprova automatica in caso di errori 429
- **Esportazioni sicure** — CSV con prevenzione dell'iniezione di formule, Markdown con escape delle pipe
- **Pattern di adattatore** — GitHub come base, estendibile a GitLab/Bitbucket

## Guida rapida

### Con Claude Code

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

### Con Claude Desktop

Aggiungi la stessa configurazione al tuo file `claude_desktop_config.json`.

### Configurazione

| Variabile | Obbligatoria | Descrizione |
| ---------- | ---------- | ------------- |
| `GITHUB_TOKEN` | Consigliata | Token di accesso personale di GitHub. Senza di esso: 60 richieste/ora. Con esso: 5.000 richieste/ora. |

**Scope del token per livello:**

| Livello | Scope richiesti |
| ------ | ---------------- |
| Livello 1 | `public_repo` (o `repo` per i repository privati) |
| Livello 2 | Come sopra + accesso in scrittura/amministratore per i dati sul traffico |
| Livello 3 | Come sopra + `security_events` per Dependabot, scansione del codice, scansione dei segreti |

## Strumenti

### `crawl_repo`

Lo strumento principale. Esplora un singolo repository a qualsiasi livello di dati.

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| Parametro | Tipo | Valore predefinito | Descrizione |
| ------- | ------ | --------- | ------------- |
| `owner` | stringa | — | Proprietario del repository |
| `repo` | stringa | — | Nome del repository |
| `tier` | `'1'` | `'2'` | `'3'` | `'1'` | Livello dei dati |
| `sections` | array di stringhe | tutti | Sezioni specifiche da includere |
| `exclude_sections` | array di stringhe | nessuna | Sezioni da escludere |
| `commit_limit` | numero | 30 | Numero massimo di commit (Livello 1) |
| `contributor_limit` | numero | 30 | Numero massimo di contributori (Livello 1) |
| `issue_limit` | numero | 100 | Numero massimo di issue (Livello 2) |
| `pr_limit` | numero | 100 | Numero massimo di pull request (Livello 2) |
| `issue_state` | `'aperto'` | `'chiuso'` | `'all'` | `'all'` | Filtro issue/pull request (Livello 2) |
| `alert_limit` | numero | 100 | Numero massimo di avvisi di sicurezza (Livello 3) |

### `crawl_org`

Esplora ogni repository all'interno di un'organizzazione con filtri.

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| Parametro | Tipo | Valore predefinito | Descrizione |
| ------- | ------ | --------- | ------------- |
| `org` | stringa | — | Nome dell'organizzazione |
| `tier` | `'1'` | `'2'` | `'3'` | `'1'` | Data tier per repository |
| `min_stars` | numero | 0 | Numero minimo di stelle |
| `language` | stringa | qualsiasi | Filtra per lingua principale |
| `include_forks` | booleano | falso | Includi repository forked |
| `include_archived` | booleano | falso | Includi repository archiviati |
| `repo_limit` | numero | 30 | Numero massimo di repository da analizzare |
| `alert_limit` | numero | 30 | Numero massimo di avvisi di sicurezza per repository (Livello 3) |

### `get_repo_summary`

Breve riepilogo leggibile. Richiede solo 4 chiamate API, ideale per la valutazione preliminare.

```
get_repo_summary({ owner: "anthropics", repo: "claude-code" })
```

### `compare_repos`

Confronto affiancato di 2-5 repository. Stelle, linguaggi, attività, salute della community, dimensione.

```
compare_repos({ repos: [
  { owner: "vitejs", repo: "vite" },
  { owner: "webpack", repo: "webpack" }
]})
```

### `export_data`

Esporta i risultati dell'analisi come JSON, CSV o Markdown. Il formato CSV include la prevenzione dell'iniezione di formule.

```
export_data({ data: crawlResult, format: "markdown", sections: ["metadata", "issues"] })
```

## Livelli di dati

### Livello 1: Fondamenti del repository

Tutto ciò di cui hai bisogno per comprendere un repository a colpo d'occhio.

| Sezione | Endpoint API | Chiamate |
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

**Budget: circa 11 chiamate API per ogni analisi completa. Circa 450 analisi complete all'ora con token.**

### Livello 2: Attività del progetto (include il Livello 1)

Problemi, richieste di pull, traffico, milestone: il battito del progetto.

| Sezione | Endpoint API | Chiamate | Note |
| --------- | ------------- | ------- | ------- |
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | Richiede l'accesso push/admin. Gestisce gli errori 403 in modo controllato. |
| `issues` | `GET /repos/.../issues` | 1+ | Esclude le richieste di pull. Il corpo del testo è limitato a 500 caratteri. |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | Include lo stato di bozza/unito, i riferimenti head/base. |
| `milestones` | `GET /repos/.../milestones` | 1+ | Tutti gli stati (aperti + chiusi). |
| `discussions` | _(GraphQL — in fase di sviluppo)_ | 0 | Restituisce un valore vuoto. Previsto per una futura versione. |

### Livello 3: Sicurezza e conformità (include il Livello 1 + 2)

Dati sulle vulnerabilità, analisi delle dipendenze, segreti compromessi.

| Sezione | Endpoint API | Chiamate | Note |
| --------- | ------------- | ------- | ------- |
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | ID CVE/GHSA, versioni corrette, gravità. |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | Avvisi a livello di repository con dettagli sulle vulnerabilità. |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | Formato SPDX. Pacchetti, versioni, licenze, ecosistemi. |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL, Semgrep, ecc. ID delle regole, posizioni dei file. |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | Token/chiavi compromessi. Tracciamento dell'elusione della protezione push. |

**Tracciamento delle autorizzazioni:** Ogni sezione del Livello 3 restituisce uno stato delle autorizzazioni (`consentito`, `negato` o `non_abilitato`) in modo che l'agente sappia esattamente cosa è accessibile e cosa richiede un accesso elevato.

**Degradazione controllata:** Ogni sezione viene recuperata in modo indipendente. Un errore 403 nella scansione del codice non blocca Dependabot o SBOM.

## Esempi

### Valutazione preliminare rapida di un repository
```
get_repo_summary({ owner: "expressjs", repo: "express" })
```

### Analisi approfondita della sicurezza
```
crawl_repo({ owner: "myorg", repo: "api-server", tier: "3" })
```

### Confronto di framework
```
compare_repos({ repos: [
  { owner: "sveltejs", repo: "svelte" },
  { owner: "vuejs", repo: "core" },
  { owner: "facebook", repo: "react" }
], aspects: ["metadata", "activity", "community"] })
```

### Esportazione di problemi in formato CSV
```
const result = crawl_repo({ owner: "myorg", repo: "app", tier: "2", sections: ["issues"] })
export_data({ data: result, format: "csv" })
```

### Scansione delle vulnerabilità a livello di organizzazione
```
crawl_org({ org: "myorg", tier: "3", alert_limit: 50 })
```

## Sviluppo

```bash
npm install
npm run typecheck    # Type check with tsc
npm test             # Run tests with vitest
npm run build        # Compile to build/
```

### Copertura dei test

60 test in 5 file di test:
- **Validazione** — espressioni regolari per proprietario/repository, analisi dell'URL, casi limite
- **Escape CSV** — vettori di iniezione di formule, quoting, caratteri speciali
- **Escape Markdown** — escape di pipe e newline
- **Adattatore GitHub** — recupero dei livelli 1/2/3, filtraggio delle sezioni, gestione degli errori, tracciamento delle autorizzazioni
- **Schemi degli strumenti** — validazione Zod, valori predefiniti dei parametri

## Architettura

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

### Principi di progettazione

- **Recupero selettivo per sezione** — Non pagate per ciò che non utilizzate. Richiedete `sections: ["metadata", "issues"]` e solo quelle API verranno chiamate.
- **Esecuzione parallela quando possibile** — I singoli endpoint indipendenti (metadati, albero, lingue, file README, community) vengono eseguiti tramite `Promise.allSettled`. Gli endpoint con paginazione vengono eseguiti in sequenza, con possibilità di interruzione anticipata.
- **Gestione elegante degli errori** — Ogni chiamata API è racchiusa in un blocco try/catch. Un singolo errore restituisce un valore predefinito e non causa l'arresto del processo.
- **Consapevolezza delle autorizzazioni** — Il livello 3 tiene traccia di quali endpoint di sicurezza hanno restituito un codice 403 (accesso negato) rispetto a un codice 404 (risorsa non trovata). L'agente può dedurre a quali risorse ha accesso.

## Licenza

[MIT](LICENSE)

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
