<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <strong>Italiano</strong> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="logo.png" alt="mcp-tool-shop" width="200" />
</p>

<h1 align="center">Repo Crawler MCP</h1>

<p align="center">
  Un server MCP che trasforma i repository GitHub in dati strutturati per agenti AI.<br>
  Metadati, issue, avvisi di sicurezza, SBOM — tutto con una singola chiamata.
</p>

<p align="center">
  <a href="#avvio-rapido">Avvio Rapido</a> &middot;
  <a href="#strumenti">Strumenti</a> &middot;
  <a href="#livelli-di-dati">Livelli di Dati</a> &middot;
  <a href="#configurazione">Configurazione</a> &middot;
  <a href="#architettura">Architettura</a> &middot;
  <a href="#licenza">Licenza</a>
</p>

---

## Perché

Gli agenti AI che lavorano con il codice devono comprendere i repository — non solo i file, ma il quadro completo: chi contribuisce, cosa è rotto, quali dipendenze sono vulnerabili, quanto è attivo il progetto. Lo scraping manuale consuma quota API e finestra di contesto.

**Repo Crawler MCP** espone l'intera superficie dati di GitHub come strumenti MCP strutturati. Una singola chiamata a `crawl_repo` con `tier: '3'` restituisce metadati, albero dei file, linguaggi, README, commit, contributori, branch, tag, release, salute della community, workflow CI, issue, PR, traffico, milestone, avvisi Dependabot, advisory di sicurezza, SBOM, avvisi di scansione del codice e avvisi di scansione dei segreti — tutto selezionabile per sezione, con rate limiting e degradazione graduale.

## Funzionalità

- **5 strumenti MCP** — scansiona repo, scansiona organizzazioni, riassumi, confronta, esporta
- **Modello dati a 3 livelli** — inizia leggero, approfondisci quando necessario
- **Recupero selettivo per sezione** — chiama solo le API richieste, risparmiando quota
- **Degradazione graduale** — un 403 su Dependabot non blocca la scansione; permessi tracciati per sezione
- **Rate limiting integrato** — throttling Octokit con retry automatico sui 429
- **Export sicuri** — CSV con prevenzione dell'iniezione di formule, Markdown con escape dei pipe
- **Pattern adapter** — prima GitHub, estensibile a GitLab/Bitbucket

## Avvio Rapido

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

Aggiungi la stessa configurazione al tuo `claude_desktop_config.json`.

### Configurazione

| Variabile | Richiesto | Descrizione |
|-----------|-----------|-------------|
| `GITHUB_TOKEN` | Consigliato | Token di Accesso Personale GitHub. Senza: 60 req/ora. Con: 5.000 req/ora. |

**Scope del token per livello:**

| Livello | Scope Richiesti |
|---------|----------------|
| Livello 1 | `public_repo` (o `repo` per repo privati) |
| Livello 2 | Stessi + accesso push/admin per i dati di traffico |
| Livello 3 | Stessi + `security_events` per Dependabot, scansione codice, scansione segreti |

## Strumenti

### `crawl_repo`

Lo strumento principale. Scansiona un singolo repository a qualsiasi livello di dati.

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| Parametro | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `owner` | string | — | Proprietario del repository |
| `repo` | string | — | Nome del repository |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | Livello di dati |
| `sections` | string[] | tutti | Sezioni specifiche da includere |
| `exclude_sections` | string[] | nessuna | Sezioni da saltare |
| `commit_limit` | number | 30 | Massimo commit (Livello 1) |
| `contributor_limit` | number | 30 | Massimo contributori (Livello 1) |
| `issue_limit` | number | 100 | Massimo issue (Livello 2) |
| `pr_limit` | number | 100 | Massimo PR (Livello 2) |
| `issue_state` | `'open'` \| `'closed'` \| `'all'` | `'all'` | Filtro Issue/PR (Livello 2) |
| `alert_limit` | number | 100 | Massimo avvisi di sicurezza (Livello 3) |

### `crawl_org`

Scansiona tutti i repo di un'organizzazione con filtri.

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| Parametro | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `org` | string | — | Nome dell'organizzazione |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | Livello dati per repo |
| `min_stars` | number | 0 | Numero minimo di stelle |
| `language` | string | any | Filtra per linguaggio principale |
| `include_forks` | boolean | false | Includi repo forkati |
| `include_archived` | boolean | false | Includi repo archiviati |
| `repo_limit` | number | 30 | Massimo repo |
| `alert_limit` | number | 30 | Massimo avvisi di sicurezza per repo (Livello 3) |

### `get_repo_summary`

Riepilogo rapido leggibile. Solo 4 chiamate API — ideale per il triage.

```
get_repo_summary({ owner: "anthropics", repo: "claude-code" })
```

### `compare_repos`

Confronto affiancato di 2–5 repo. Stelle, linguaggi, attività, salute della community, dimensione.

```
compare_repos({ repos: [
  { owner: "vitejs", repo: "vite" },
  { owner: "webpack", repo: "webpack" }
]})
```

### `export_data`

Esporta i risultati della scansione in JSON, CSV o Markdown. Il CSV include la prevenzione dell'iniezione di formule.

```
export_data({ data: crawlResult, format: "markdown", sections: ["metadata", "issues"] })
```

## Livelli di Dati

### Livello 1 — Fondamenti del Repository

Tutto ciò che serve per capire un repo a colpo d'occhio.

| Sezione | Endpoint API | Chiamate |
|---------|-------------|----------|
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

**Budget: ~11 chiamate API per scansione completa. ~450 scansioni complete/ora con token.**

### Livello 2 — Attività del Progetto (include Livello 1)

Issue, PR, traffico, milestone — il polso del progetto.

| Sezione | Endpoint API | Chiamate | Note |
|---------|-------------|----------|------|
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | Richiede accesso push/admin. Degradazione graduale su 403. |
| `issues` | `GET /repos/.../issues` | 1+ | Filtra le PR. Corpo limitato a 500 caratteri. |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | Include stato bozza/merged, ref head/base. |
| `milestones` | `GET /repos/.../milestones` | 1+ | Tutti gli stati (open + closed). |
| `discussions` | _(GraphQL — stub)_ | 0 | Restituisce vuoto. Previsto per una versione futura. |

### Livello 3 — Sicurezza & Conformità (include Livello 1 + 2)

Dati sulle vulnerabilità, analisi delle dipendenze, segreti esposti.

| Sezione | Endpoint API | Chiamate | Note |
|---------|-------------|----------|------|
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | ID CVE/GHSA, versioni corrette, gravità. |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | Advisory a livello di repo con dettagli sulle vulnerabilità. |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | Formato SPDX. Pacchetti, versioni, licenze, ecosistemi. |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL, Semgrep, ecc. ID regole, posizioni file. |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | Token/chiavi esposti. Tracciamento bypass protezione push. |

**Tracciamento permessi:** Ogni sezione del Livello 3 restituisce uno stato di permesso (`granted`, `denied` o `not_enabled`) così l'agente sa esattamente cosa è accessibile e cosa richiede accesso elevato.

**Degradazione graduale:** Ogni sezione viene recuperata indipendentemente. Un 403 sulla scansione del codice non blocca Dependabot o SBOM.

## Esempi

### Triage rapido del repo
```
get_repo_summary({ owner: "expressjs", repo: "express" })
```

### Audit di sicurezza approfondito
```
crawl_repo({ owner: "myorg", repo: "api-server", tier: "3" })
```

### Confrontare framework
```
compare_repos({ repos: [
  { owner: "sveltejs", repo: "svelte" },
  { owner: "vuejs", repo: "core" },
  { owner: "facebook", repo: "react" }
], aspects: ["metadata", "activity", "community"] })
```

### Esportare issue in CSV
```
const result = crawl_repo({ owner: "myorg", repo: "app", tier: "2", sections: ["issues"] })
export_data({ data: result, format: "csv" })
```

### Scansione vulnerabilità a livello di organizzazione
```
crawl_org({ org: "myorg", tier: "3", alert_limit: 50 })
```

## Sviluppo

```bash
npm install
npm run typecheck    # Controllo tipi con tsc
npm test             # Eseguire i test con vitest
npm run build        # Compilare in build/
```

### Copertura dei Test

60 test in 5 file di test:
- **Validazione** — regex owner/repo, parsing URL, casi limite
- **Escape CSV** — vettori di iniezione formule, virgolettatura, caratteri speciali
- **Escape Markdown** — escape di pipe e interruzioni di riga
- **Adapter GitHub** — recupero Livello 1/2/3, filtraggio sezioni, gestione errori, tracciamento permessi
- **Schemi strumenti** — validazione Zod, valori predefiniti parametri

## Architettura

```
src/
  index.ts              # Punto di ingresso (shebang per npx)
  server.ts             # Setup server MCP + registrazione strumenti
  types.ts              # Tutte le interfacce, schemi Zod, codici errore, costanti livello
  adapters/
    types.ts            # Interfaccia adapter indipendente dalla piattaforma
    github.ts           # API GitHub via Octokit (Livello 1/2/3)
  tools/
    crawlRepo.ts        # crawl_repo — scansione singolo repo
    crawlOrg.ts         # crawl_org — scansione organizzazione con filtri
    repoSummary.ts      # get_repo_summary — riepilogo leggero in 4 chiamate
    compareRepos.ts     # compare_repos — confronto affiancato
    exportData.ts       # export_data — esportazione JSON/CSV/Markdown
  utils/
    logger.ts           # Logger solo stderr (stdout riservato a MCP)
    errors.ts           # Classe CrawlerError, risposte errore strutturate
    validation.ts       # Validazione owner/repo/URL con regex
    csvEscape.ts        # Prevenzione iniezione formule + virgolettatura CSV
    mdEscape.ts         # Escape pipe, rimozione interruzioni di riga per tabelle
```

### Principi di Progettazione

- **Recupero selettivo per sezione** — Non pagare per ciò che non usi. Richiedi `sections: ["metadata", "issues"]` e solo quelle API vengono chiamate.
- **Parallelo quando sicuro** — Gli endpoint indipendenti a singola chiamata (metadata, tree, languages, readme, community) vengono eseguiti tramite `Promise.allSettled`. Gli endpoint paginati vengono eseguiti sequenzialmente con terminazione anticipata.
- **Degradazione graduale** — Ogni chiamata API è avvolta in try/catch. Un singolo fallimento restituisce un valore predefinito, non fa mai crashare la scansione.
- **Consapevolezza dei permessi** — Il Livello 3 traccia quali endpoint di sicurezza hanno restituito 403 vs 404. L'agente può ragionare sull'accesso di cui dispone.

## Licenza

[MIT](LICENSE)
