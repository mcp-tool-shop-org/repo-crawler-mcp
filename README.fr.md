<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <strong>Français</strong> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="logo.png" alt="mcp-tool-shop" width="200" />
</p>

<h1 align="center">Repo Crawler MCP</h1>

<p align="center">
  Un serveur MCP qui transforme les dépôts GitHub en données structurées pour les agents IA.<br>
  Métadonnées, issues, alertes de sécurité, SBOMs — le tout en un seul appel d'outil.
</p>

<p align="center">
  <a href="#démarrage-rapide">Démarrage Rapide</a> &middot;
  <a href="#outils">Outils</a> &middot;
  <a href="#niveaux-de-données">Niveaux de Données</a> &middot;
  <a href="#configuration">Configuration</a> &middot;
  <a href="#architecture">Architecture</a> &middot;
  <a href="#licence">Licence</a>
</p>

---

## Pourquoi

Les agents IA qui travaillent avec du code ont besoin de comprendre les dépôts — pas seulement les fichiers, mais la vue d'ensemble : qui contribue, ce qui est cassé, quelles dépendances sont vulnérables, le niveau d'activité du projet. Le scraping manuel consomme le quota API et la fenêtre de contexte.

**Repo Crawler MCP** expose toute la surface de données de GitHub sous forme d'outils MCP structurés. Un seul appel à `crawl_repo` avec `tier: '3'` retourne les métadonnées, l'arbre de fichiers, les langages, le README, les commits, les contributeurs, les branches, les tags, les releases, la santé communautaire, les workflows CI, les issues, les PRs, le trafic, les jalons, les alertes Dependabot, les avis de sécurité, le SBOM, les alertes d'analyse de code et les alertes d'analyse de secrets — le tout avec sélection par section, limitation de débit et dégradation gracieuse.

## Fonctionnalités

- **5 outils MCP** — explorer des dépôts, explorer des organisations, résumer, comparer, exporter
- **Modèle de données à 3 niveaux** — commencez léger, approfondissez selon vos besoins
- **Récupération sélective par section** — n'appelle que les APIs demandées, économisant le quota
- **Dégradation gracieuse** — un 403 sur Dependabot n'arrête pas l'exploration ; permissions suivies par section
- **Limitation de débit intégrée** — throttling Octokit avec retry automatique sur les 429
- **Exports sécurisés** — CSV avec prévention d'injection de formules, Markdown avec échappement des pipes
- **Patron adaptateur** — GitHub d'abord, extensible à GitLab/Bitbucket

## Démarrage Rapide

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

Ajoutez la même configuration à votre `claude_desktop_config.json`.

### Configuration

| Variable | Requis | Description |
|----------|--------|-------------|
| `GITHUB_TOKEN` | Recommandé | Token d'Accès Personnel GitHub. Sans : 60 req/h. Avec : 5 000 req/h. |

**Portées de token par niveau :**

| Niveau | Portées Requises |
|--------|-----------------|
| Niveau 1 | `public_repo` (ou `repo` pour les dépôts privés) |
| Niveau 2 | Idem + accès push/admin pour les données de trafic |
| Niveau 3 | Idem + `security_events` pour Dependabot, analyse de code, analyse de secrets |

## Outils

### `crawl_repo`

L'outil principal. Explore un seul dépôt à n'importe quel niveau de données.

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `owner` | string | — | Propriétaire du dépôt |
| `repo` | string | — | Nom du dépôt |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | Niveau de données |
| `sections` | string[] | tous | Sections spécifiques à inclure |
| `exclude_sections` | string[] | aucune | Sections à ignorer |
| `commit_limit` | number | 30 | Maximum de commits (Niveau 1) |
| `contributor_limit` | number | 30 | Maximum de contributeurs (Niveau 1) |
| `issue_limit` | number | 100 | Maximum d'issues (Niveau 2) |
| `pr_limit` | number | 100 | Maximum de PRs (Niveau 2) |
| `issue_state` | `'open'` \| `'closed'` \| `'all'` | `'all'` | Filtre Issue/PR (Niveau 2) |
| `alert_limit` | number | 100 | Maximum d'alertes de sécurité (Niveau 3) |

### `crawl_org`

Explore tous les dépôts d'une organisation avec des filtres.

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `org` | string | — | Nom de l'organisation |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | Niveau de données par dépôt |
| `min_stars` | number | 0 | Nombre minimum d'étoiles |
| `language` | string | any | Filtrer par langage principal |
| `include_forks` | boolean | false | Inclure les dépôts forkés |
| `include_archived` | boolean | false | Inclure les dépôts archivés |
| `repo_limit` | number | 30 | Maximum de dépôts |
| `alert_limit` | number | 30 | Maximum d'alertes de sécurité par dépôt (Niveau 3) |

### `get_repo_summary`

Résumé rapide lisible par un humain. Seulement 4 appels API — idéal pour le triage.

```
get_repo_summary({ owner: "anthropics", repo: "claude-code" })
```

### `compare_repos`

Comparaison côte à côte de 2 à 5 dépôts. Étoiles, langages, activité, santé communautaire, taille.

```
compare_repos({ repos: [
  { owner: "vitejs", repo: "vite" },
  { owner: "webpack", repo: "webpack" }
]})
```

### `export_data`

Exporte les résultats d'exploration en JSON, CSV ou Markdown. Le CSV inclut la prévention d'injection de formules.

```
export_data({ data: crawlResult, format: "markdown", sections: ["metadata", "issues"] })
```

## Niveaux de Données

### Niveau 1 — Fondamentaux du Dépôt

Tout ce qu'il faut pour comprendre un dépôt en un coup d'œil.

| Section | Endpoint API | Appels |
|---------|-------------|--------|
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

**Budget : ~11 appels API par exploration complète. ~450 explorations complètes/h avec token.**

### Niveau 2 — Activité du Projet (inclut Niveau 1)

Issues, PRs, trafic, jalons — le pouls du projet.

| Section | Endpoint API | Appels | Notes |
|---------|-------------|--------|-------|
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | Nécessite un accès push/admin. Dégradation gracieuse sur 403. |
| `issues` | `GET /repos/.../issues` | 1+ | Filtre les PRs. Corps limité à 500 caractères. |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | Inclut statut brouillon/fusionné, refs head/base. |
| `milestones` | `GET /repos/.../milestones` | 1+ | Tous les états (open + closed). |
| `discussions` | _(GraphQL — stub)_ | 0 | Retourne vide. Prévu pour une future version. |

### Niveau 3 — Sécurité & Conformité (inclut Niveau 1 + 2)

Données de vulnérabilité, analyse des dépendances, secrets divulgués.

| Section | Endpoint API | Appels | Notes |
|---------|-------------|--------|-------|
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | IDs CVE/GHSA, versions corrigées, sévérité. |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | Avis au niveau du dépôt avec détails des vulnérabilités. |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | Format SPDX. Paquets, versions, licences, écosystèmes. |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL, Semgrep, etc. IDs de règles, emplacements de fichiers. |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | Tokens/clés divulgués. Suivi du contournement de la protection push. |

**Suivi des permissions :** Chaque section du Niveau 3 retourne un statut de permission (`granted`, `denied` ou `not_enabled`) pour que l'agent sache exactement ce qui est accessible et ce qui nécessite un accès élevé.

**Dégradation gracieuse :** Chaque section est récupérée indépendamment. Un 403 sur l'analyse de code ne bloque pas Dependabot ou le SBOM.

## Exemples

### Triage rapide de dépôt
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

### Exporter les issues en CSV
```
const result = crawl_repo({ owner: "myorg", repo: "app", tier: "2", sections: ["issues"] })
export_data({ data: result, format: "csv" })
```

### Scan de vulnérabilités à l'échelle de l'organisation
```
crawl_org({ org: "myorg", tier: "3", alert_limit: 50 })
```

## Développement

```bash
npm install
npm run typecheck    # Vérification de types avec tsc
npm test             # Exécuter les tests avec vitest
npm run build        # Compiler dans build/
```

### Couverture des Tests

60 tests dans 5 fichiers de test :
- **Validation** — regex owner/repo, analyse d'URL, cas limites
- **Échappement CSV** — vecteurs d'injection de formules, mise entre guillemets, caractères spéciaux
- **Échappement Markdown** — échappement des pipes et sauts de ligne
- **Adaptateur GitHub** — récupération Niveau 1/2/3, filtrage de sections, gestion d'erreurs, suivi des permissions
- **Schémas d'outils** — validation Zod, valeurs par défaut des paramètres

## Architecture

```
src/
  index.ts              # Point d'entrée (shebang pour npx)
  server.ts             # Configuration du serveur MCP + enregistrement des outils
  types.ts              # Toutes les interfaces, schémas Zod, codes d'erreur, constantes de niveau
  adapters/
    types.ts            # Interface d'adaptateur agnostique de plateforme
    github.ts           # API GitHub via Octokit (Niveau 1/2/3)
  tools/
    crawlRepo.ts        # crawl_repo — exploration d'un seul dépôt
    crawlOrg.ts         # crawl_org — exploration d'organisation avec filtres
    repoSummary.ts      # get_repo_summary — résumé léger en 4 appels
    compareRepos.ts     # compare_repos — comparaison côte à côte
    exportData.ts       # export_data — export JSON/CSV/Markdown
  utils/
    logger.ts           # Logger stderr uniquement (stdout réservé au MCP)
    errors.ts           # Classe CrawlerError, réponses d'erreur structurées
    validation.ts       # Validation owner/repo/URL avec regex
    csvEscape.ts        # Prévention d'injection de formules + mise entre guillemets CSV
    mdEscape.ts         # Échappement des pipes, suppression des sauts de ligne pour les tableaux
```

### Principes de Conception

- **Récupération sélective par section** — Ne payez pas pour ce que vous n'utilisez pas. Demandez `sections: ["metadata", "issues"]` et seules ces APIs sont appelées.
- **Parallèle quand c'est sûr** — Les endpoints indépendants à un seul appel (metadata, tree, languages, readme, community) s'exécutent via `Promise.allSettled`. Les endpoints paginés s'exécutent séquentiellement avec terminaison anticipée.
- **Dégradation gracieuse** — Chaque appel API est enveloppé dans un try/catch. Un échec unique retourne une valeur par défaut, ne fait jamais crasher l'exploration.
- **Conscience des permissions** — Le Niveau 3 suit quels endpoints de sécurité ont retourné 403 vs 404. L'agent peut raisonner sur l'accès dont il dispose.

## Licence

[MIT](LICENSE)
