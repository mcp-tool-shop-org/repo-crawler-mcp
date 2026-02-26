<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## Pourquoi

Les agents d'IA qui travaillent avec du code doivent comprendre les dépôts, et pas seulement les fichiers, mais l'ensemble du contexte : qui contribue, ce qui est cassé, quelles dépendances sont vulnérables, à quel point le projet est actif. Collecter ces informations manuellement consomme une quantité importante de quotas d'API et de mémoire.

**Repo Crawler MCP** expose l'ensemble des données de GitHub sous forme d'outils MCP structurés. Un appel à `crawl_repo` avec `tier: '3'` renvoie des métadonnées, l'arborescence des fichiers, les langages, le fichier README, les commits, les contributeurs, les branches, les étiquettes, les versions, l'état de la communauté, les flux de CI, les problèmes, les demandes de tirage (PR), le trafic, les jalons, les alertes Dependabot, les avis de sécurité, le SBOM (Software Bill of Materials), les alertes de détection de code et les alertes de détection de secrets, le tout étant sélectif par section, avec une limitation de débit et une dégradation progressive.

## Fonctionnalités

- **5 outils MCP** — exploration de dépôts, exploration d'organisations, résumé, comparaison, exportation
- **Modèle de données en 3 niveaux** — commencez simplement, approfondissez lorsque vous en avez besoin
- **Récupération sélective par section** — n'appelle que les API que vous demandez, ce qui permet d'économiser des quotas
- **Dégradation progressive** — une erreur 403 sur Dependabot n'interrompt pas l'exploration ; les autorisations sont suivies par section
- **Limitation de débit intégrée** — limitation de débit d'Octokit avec nouvelle tentative automatique en cas de code 429
- **Exportations sécurisées** — CSV avec prévention de l'injection de formules, Markdown avec échappement des pipes
- **Motif d'adaptation** — GitHub en premier, extensible à GitLab/Bitbucket

## Démarrage rapide

### Avec Claude Code

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

### Avec Claude Desktop

Ajoutez la même configuration à votre fichier `claude_desktop_config.json`.

### Configuration

| Variable | Obligatoire | Description |
| ---------- | ---------- | ------------- |
| `GITHUB_TOKEN` | Recommandé | Jeton d'accès personnel GitHub. Sans celui-ci : 60 requêtes/heure. Avec celui-ci : 5 000 requêtes/heure. |

**Portées du jeton par niveau :**

| Niveau | Portées requises |
| ------ | ---------------- |
| Niveau 1 | `public_repo` (ou `repo` pour les dépôts privés) |
| Niveau 2 | Même chose + accès en lecture/écriture pour les données de trafic |
| Niveau 3 | Même chose + `security_events` pour Dependabot, la détection de code et la détection de secrets |

## Outils

### `crawl_repo`

L'outil principal. Explore un seul dépôt à n'importe quel niveau de données.

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| Paramètre | Type | Valeur par défaut | Description |
| ------- | ------ | --------- | ------------- |
| `owner` | chaîne de caractères | — | Propriétaire du dépôt |
| `repo` | chaîne de caractères | — | Nom du dépôt |
| `tier` | `'1'` | `'2'` | `'3'` | `'1'` | Niveau de données |
| `sections` | tableau de chaînes de caractères | tous | Sections spécifiques à inclure |
| `exclude_sections` | tableau de chaînes de caractères | aucun | Sections à ignorer |
| `commit_limit` | nombre | 30 | Nombre maximum de commits (Niveau 1) |
| `contributor_limit` | nombre | 30 | Nombre maximum de contributeurs (Niveau 1) |
| `issue_limit` | nombre | 100 | Nombre maximum de problèmes (Niveau 2) |
| `pr_limit` | nombre | 100 | Nombre maximum de demandes de tirage (Niveau 2) |
| `issue_state` | `'ouvert'` | `'fermé'` | `'all'` | `'all'` | Filtre des problèmes/demandes de tirage (Niveau 2) |
| `alert_limit` | nombre | 100 | Nombre maximum d'alertes de sécurité (Niveau 3) |

### `crawl_org`

Explore tous les dépôts d'une organisation avec des filtres.

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| Paramètre | Type | Valeur par défaut | Description |
| ------- | ------ | --------- | ------------- |
| `org` | chaîne de caractères | — | Nom de l'organisation |
| `tier` | `'1'` | `'2'` | `'3'` | `'1'` | Data tier per repo |
| `min_stars` | nombre | 0 | Nombre minimum d'étoiles |
| `language` | chaîne de caractères | n'importe quoi | Filtrer par langue principale |
| `include_forks` | booléen | faux | Inclure les dépôts bifurqués |
| `include_archived` | booléen | faux | Inclure les dépôts archivés |
| `repo_limit` | nombre | 30 | Nombre maximal de dépôts à explorer |
| `alert_limit` | nombre | 30 | Nombre maximal d'alertes de sécurité par dépôt (niveau 3) |

### `get_repo_summary`

Résumé concis et facile à comprendre. Nécessite seulement 4 appels API, idéal pour le tri initial.

```
get_repo_summary({ owner: "anthropics", repo: "claude-code" })
```

### `compare_repos`

Comparaison côte à côte de 2 à 5 dépôts. Nombre d'étoiles, langages, activité, santé de la communauté, taille.

```
compare_repos({ repos: [
  { owner: "vitejs", repo: "vite" },
  { owner: "webpack", repo: "webpack" }
]})
```

### `export_data`

Exporter les résultats de l'exploration sous forme de JSON, CSV ou Markdown. Le format CSV inclut une protection contre l'injection de formules.

```
export_data({ data: crawlResult, format: "markdown", sections: ["metadata", "issues"] })
```

## Niveaux de données

### Niveau 1 — Éléments fondamentaux du dépôt

Tout ce dont vous avez besoin pour comprendre un dépôt en un coup d'œil.

| Section | Point de terminaison API | Appels |
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

**Budget : environ 11 appels API par exploration complète. Environ 450 explorations complètes/heure avec un jeton.**

### Niveau 2 — Activité du projet (inclut le niveau 1)

Problèmes, demandes de tirage, trafic, jalons : le pouls du projet.

| Section | Point de terminaison API | Appels | Notes |
| --------- | ------------- | ------- | ------- |
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | Nécessite un accès push/admin. Gère les erreurs 403 de manière élégante. |
| `issues` | `GET /repos/.../issues` | 1+ | Exclut les demandes de tirage. Le corps est limité à 500 caractères. |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | Inclut le statut brouillon/fusionné, les références de base et de tête. |
| `milestones` | `GET /repos/.../milestones` | 1+ | Tous les états (ouverts + fermés). |
| `discussions` | _(GraphQL — stub)_ | 0 | Retourne une valeur vide. Prévu pour une version ultérieure. |

### Niveau 3 — Sécurité et conformité (inclut les niveaux 1 + 2)

Données de vulnérabilité, analyse des dépendances, secrets divulgués.

| Section | Point de terminaison API | Appels | Notes |
| --------- | ------------- | ------- | ------- |
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | Identifiants CVE/GHSA, versions corrigées, gravité. |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | Avis au niveau du dépôt avec les détails des vulnérabilités. |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | Format SPDX. Packages, versions, licences, écosystèmes. |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL, Semgrep, etc. Identifiants des règles, emplacements des fichiers. |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | Jetons/clés divulgués. Suivi du contournement de la protection push. |

**Suivi des autorisations :** Chaque section du niveau 3 renvoie un statut d'autorisation (`accordé`, `refusé` ou `non_activé`) afin que l'agent sache exactement ce qui est accessible et ce qui nécessite un accès élevé.

**Gestion des erreurs :** Chaque section est récupérée indépendamment. Une erreur 403 lors de l'analyse du code ne bloque pas Dependabot ou SBOM.

## Exemples

### Tri initial rapide des dépôts
```
get_repo_summary({ owner: "expressjs", repo: "express" })
```

### Audit de sécurité approfondi
```
crawl_repo({ owner: "myorg", repo: "api-server", tier: "3" })
```

### Comparer des frameworks
```
compare_repos({ repos: [
  { owner: "sveltejs", repo: "svelte" },
  { owner: "vuejs", repo: "core" },
  { owner: "facebook", repo: "react" }
], aspects: ["metadata", "activity", "community"] })
```

### Exporter les problèmes vers CSV
```
const result = crawl_repo({ owner: "myorg", repo: "app", tier: "2", sections: ["issues"] })
export_data({ data: result, format: "csv" })
```

### Analyse des vulnérabilités à l'échelle de l'organisation
```
crawl_org({ org: "myorg", tier: "3", alert_limit: 50 })
```

## Développement

```bash
npm install
npm run typecheck    # Type check with tsc
npm test             # Run tests with vitest
npm run build        # Compile to build/
```

### Couverture des tests

60 tests répartis sur 5 fichiers de tests :
- **Validation** — expressions régulières pour le propriétaire/le dépôt, analyse d'URL, cas limites
- **Échappement CSV** — vecteurs d'injection de formules, guillemets, caractères spéciaux
- **Échappement Markdown** — échappement des pipes et des sauts de ligne
- **Adaptateur GitHub** — récupération des niveaux 1/2/3, filtrage des sections, gestion des erreurs, suivi des autorisations
- **Schémas d'outils** — validation Zod, valeurs par défaut des paramètres

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

### Principes de conception

- **Récupération sélective par section** — Ne payez que pour ce que vous utilisez. Demandez `sections: ["metadata", "issues"]` et seules ces API seront appelées.
- **Parallélisation lorsque cela est possible** — Les points d'accès indépendants et fonctionnant avec un seul appel (métadonnées, arborescence, langues, fichier README, communauté) sont exécutés via `Promise.allSettled`. Les points d'accès paginés sont exécutés séquentiellement avec une terminaison anticipée.
- **Dégradation contrôlée** — Chaque appel d'API est encapsulé dans un bloc try/catch. Une erreur unique renvoie une valeur par défaut et ne provoque jamais l'arrêt du processus.
- **Conscience des permissions** — Le niveau 3 enregistre les points d'accès de sécurité qui ont renvoyé 403 au lieu de 404. L'agent peut déterminer les permissions dont il dispose.

## Licence

[MIT](LICENSE)

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
