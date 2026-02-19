<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <strong>Español</strong> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="logo.png" alt="mcp-tool-shop" width="200" />
</p>

<h1 align="center">Repo Crawler MCP</h1>

<p align="center">
  Un servidor MCP que convierte repositorios de GitHub en datos estructurados para agentes de IA.<br>
  Metadatos, issues, alertas de seguridad, SBOMs — todo en una sola llamada.
</p>

<p align="center">
  <a href="#inicio-rápido">Inicio Rápido</a> &middot;
  <a href="#herramientas">Herramientas</a> &middot;
  <a href="#niveles-de-datos">Niveles de Datos</a> &middot;
  <a href="#configuración">Configuración</a> &middot;
  <a href="#arquitectura">Arquitectura</a> &middot;
  <a href="#licencia">Licencia</a>
</p>

---

## Por qué

Los agentes de IA que trabajan con código necesitan comprender los repositorios — no solo los archivos, sino el panorama completo: quién contribuye, qué está roto, qué dependencias son vulnerables, qué tan activo es el proyecto. Hacer scraping manual consume cuota de API y ventana de contexto.

**Repo Crawler MCP** expone toda la superficie de datos de GitHub como herramientas MCP estructuradas. Una sola llamada a `crawl_repo` con `tier: '3'` devuelve metadatos, árbol de archivos, lenguajes, README, commits, contribuyentes, ramas, etiquetas, releases, salud de la comunidad, flujos de trabajo CI, issues, PRs, tráfico, hitos, alertas de Dependabot, avisos de seguridad, SBOM, alertas de escaneo de código y alertas de escaneo de secretos — todo con selección por sección, limitación de tasa y degradación elegante.

## Características

- **5 herramientas MCP** — rastrear repos, rastrear organizaciones, resumir, comparar, exportar
- **Modelo de datos de 3 niveles** — empieza ligero, profundiza cuando lo necesites
- **Obtención selectiva por sección** — solo llama a las APIs que solicitas, ahorrando cuota
- **Degradación elegante** — un 403 en Dependabot no detiene el rastreo; permisos rastreados por sección
- **Limitación de tasa integrada** — throttling de Octokit con reintento automático en 429s
- **Exportaciones seguras** — CSV con prevención de inyección de fórmulas, Markdown con escape de pipes
- **Patrón adaptador** — GitHub primero, extensible a GitLab/Bitbucket

## Inicio Rápido

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

Agrega la misma configuración a tu `claude_desktop_config.json`.

### Configuración

| Variable | Requerido | Descripción |
|----------|-----------|-------------|
| `GITHUB_TOKEN` | Recomendado | Token de Acceso Personal de GitHub. Sin él: 60 req/hr. Con él: 5,000 req/hr. |

**Alcances de token por nivel:**

| Nivel | Alcances Requeridos |
|-------|--------------------|
| Nivel 1 | `public_repo` (o `repo` para repos privados) |
| Nivel 2 | Mismo + acceso push/admin para datos de tráfico |
| Nivel 3 | Mismo + `security_events` para Dependabot, escaneo de código, escaneo de secretos |

## Herramientas

### `crawl_repo`

La herramienta principal. Rastrea un solo repositorio en cualquier nivel de datos.

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| Parámetro | Tipo | Predeterminado | Descripción |
|-----------|------|---------------|-------------|
| `owner` | string | — | Propietario del repositorio |
| `repo` | string | — | Nombre del repositorio |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | Nivel de datos |
| `sections` | string[] | todos | Secciones específicas a incluir |
| `exclude_sections` | string[] | ninguno | Secciones a omitir |
| `commit_limit` | number | 30 | Máximo de commits (Nivel 1) |
| `contributor_limit` | number | 30 | Máximo de contribuyentes (Nivel 1) |
| `issue_limit` | number | 100 | Máximo de issues (Nivel 2) |
| `pr_limit` | number | 100 | Máximo de PRs (Nivel 2) |
| `issue_state` | `'open'` \| `'closed'` \| `'all'` | `'all'` | Filtro de Issue/PR (Nivel 2) |
| `alert_limit` | number | 100 | Máximo de alertas de seguridad (Nivel 3) |

### `crawl_org`

Rastrea todos los repos de una organización con filtros.

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| Parámetro | Tipo | Predeterminado | Descripción |
|-----------|------|---------------|-------------|
| `org` | string | — | Nombre de la organización |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | Nivel de datos por repo |
| `min_stars` | number | 0 | Mínimo de estrellas |
| `language` | string | any | Filtrar por lenguaje principal |
| `include_forks` | boolean | false | Incluir repos forkeados |
| `include_archived` | boolean | false | Incluir repos archivados |
| `repo_limit` | number | 30 | Máximo de repos |
| `alert_limit` | number | 30 | Máximo de alertas de seguridad por repo (Nivel 3) |

### `get_repo_summary`

Resumen rápido legible por humanos. Solo 4 llamadas API — ideal para triaje.

```
get_repo_summary({ owner: "anthropics", repo: "claude-code" })
```

### `compare_repos`

Comparación lado a lado de 2–5 repos. Estrellas, lenguajes, actividad, salud de la comunidad, tamaño.

```
compare_repos({ repos: [
  { owner: "vitejs", repo: "vite" },
  { owner: "webpack", repo: "webpack" }
]})
```

### `export_data`

Exporta resultados del rastreo como JSON, CSV o Markdown. CSV incluye prevención de inyección de fórmulas.

```
export_data({ data: crawlResult, format: "markdown", sections: ["metadata", "issues"] })
```

## Niveles de Datos

### Nivel 1 — Fundamentos del Repositorio

Todo lo que necesitas para entender un repo de un vistazo.

| Sección | Endpoint API | Llamadas |
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

**Presupuesto: ~11 llamadas API por rastreo completo. ~450 rastreos completos/hr con token.**

### Nivel 2 — Actividad del Proyecto (incluye Nivel 1)

Issues, PRs, tráfico, hitos — el pulso del proyecto.

| Sección | Endpoint API | Llamadas | Notas |
|---------|-------------|----------|-------|
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | Requiere acceso push/admin. Degrada elegantemente en 403. |
| `issues` | `GET /repos/.../issues` | 1+ | Filtra PRs. Cuerpo limitado a 500 caracteres. |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | Incluye estado borrador/fusionado, refs head/base. |
| `milestones` | `GET /repos/.../milestones` | 1+ | Todos los estados (open + closed). |
| `discussions` | _(GraphQL — stub)_ | 0 | Devuelve vacío. Planeado para futura versión. |

### Nivel 3 — Seguridad y Cumplimiento (incluye Nivel 1 + 2)

Datos de vulnerabilidad, análisis de dependencias, secretos filtrados.

| Sección | Endpoint API | Llamadas | Notas |
|---------|-------------|----------|-------|
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | IDs CVE/GHSA, versiones parcheadas, severidad. |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | Avisos a nivel de repo con detalles de vulnerabilidad. |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | Formato SPDX. Paquetes, versiones, licencias, ecosistemas. |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL, Semgrep, etc. IDs de reglas, ubicaciones de archivos. |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | Tokens/claves filtrados. Seguimiento de bypass de protección push. |

**Seguimiento de permisos:** Cada sección del Nivel 3 devuelve un estado de permiso (`granted`, `denied` o `not_enabled`) para que el agente sepa exactamente qué es accesible y qué requiere acceso elevado.

**Degradación elegante:** Cada sección se obtiene independientemente. Un 403 en escaneo de código no bloquea Dependabot o SBOM.

## Ejemplos

### Triaje rápido de repo
```
get_repo_summary({ owner: "expressjs", repo: "express" })
```

### Auditoría de seguridad profunda
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

### Exportar issues a CSV
```
const result = crawl_repo({ owner: "myorg", repo: "app", tier: "2", sections: ["issues"] })
export_data({ data: result, format: "csv" })
```

### Escaneo de vulnerabilidades de toda la organización
```
crawl_org({ org: "myorg", tier: "3", alert_limit: 50 })
```

## Desarrollo

```bash
npm install
npm run typecheck    # Verificación de tipos con tsc
npm test             # Ejecutar tests con vitest
npm run build        # Compilar a build/
```

### Cobertura de Tests

60 tests en 5 archivos de test:
- **Validación** — regex de owner/repo, análisis de URL, casos límite
- **Escape CSV** — vectores de inyección de fórmulas, entrecomillado, caracteres especiales
- **Escape Markdown** — escape de pipes y saltos de línea
- **Adaptador GitHub** — obtención de Nivel 1/2/3, filtrado de secciones, manejo de errores, seguimiento de permisos
- **Esquemas de herramientas** — validación Zod, valores predeterminados de parámetros

## Arquitectura

```
src/
  index.ts              # Punto de entrada (shebang para npx)
  server.ts             # Configuración del servidor MCP + registro de herramientas
  types.ts              # Todas las interfaces, esquemas Zod, códigos de error, constantes de nivel
  adapters/
    types.ts            # Interfaz de adaptador agnóstica de plataforma
    github.ts           # API de GitHub vía Octokit (Nivel 1/2/3)
  tools/
    crawlRepo.ts        # crawl_repo — rastreo de repo individual
    crawlOrg.ts         # crawl_org — rastreo de organización con filtros
    repoSummary.ts      # get_repo_summary — resumen ligero de 4 llamadas
    compareRepos.ts     # compare_repos — comparación lado a lado
    exportData.ts       # export_data — exportación JSON/CSV/Markdown
  utils/
    logger.ts           # Logger solo stderr (stdout reservado para MCP)
    errors.ts           # Clase CrawlerError, respuestas de error estructuradas
    validation.ts       # Validación de owner/repo/URL con regex
    csvEscape.ts        # Prevención de inyección de fórmulas + entrecomillado CSV
    mdEscape.ts         # Escape de pipes, eliminación de saltos de línea para tablas
```

### Principios de Diseño

- **Obtención selectiva por sección** — No pagues por lo que no usas. Solicita `sections: ["metadata", "issues"]` y solo esas APIs se llaman.
- **Paralelo cuando es seguro** — Endpoints independientes de una sola llamada (metadata, tree, languages, readme, community) se ejecutan con `Promise.allSettled`. Endpoints paginados se ejecutan secuencialmente con terminación temprana.
- **Degradación elegante** — Cada llamada API está envuelta en try/catch. Un fallo individual devuelve un valor predeterminado, nunca crashea el rastreo.
- **Conciencia de permisos** — El Nivel 3 rastrea qué endpoints de seguridad devolvieron 403 vs 404. El agente puede razonar sobre el acceso que tiene.

## Licencia

[MIT](LICENSE)
