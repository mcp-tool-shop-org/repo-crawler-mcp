<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## ¿Por qué?

Los agentes de IA que trabajan con código necesitan comprender los repositorios, no solo los archivos, sino la imagen completa: quién contribuye, qué está roto, qué dependencias son vulnerables, qué tan activo está el proyecto. Recopilar esta información manualmente consume cuota de la API y espacio de contexto.

**Repo Crawler MCP** expone toda la superficie de datos de GitHub como herramientas MCP estructuradas. Una sola llamada a `crawl_repo` con `tier: '3'` devuelve metadatos, árbol de archivos, lenguajes, README, commits, contribuyentes, ramas, etiquetas, lanzamientos, estado de la comunidad, flujos de trabajo de CI, problemas, solicitudes de extracción (PR), tráfico, hitos, alertas de Dependabot, avisos de seguridad, SBOM (Software Bill of Materials), alertas de análisis de código y alertas de detección de secretos, todo esto de forma selectiva por sección, con límites de velocidad y con una degradación gradual.

## Características

- **5 herramientas MCP** — rastreo de repositorios, rastreo de organizaciones, resumen, comparación, exportación.
- **Modelo de datos de 3 niveles** — comience de forma sencilla y profundice cuando lo necesite.
- **Recopilación selectiva por sección** — solo llama a las API que solicite, ahorrando cuota.
- **Degradación gradual** — un error 403 en Dependabot no interrumpe el rastreo; los permisos se rastrean por sección.
- **Límite de velocidad integrado** — limitación de velocidad de Octokit con reintento automático en caso de errores 429.
- **Exportaciones seguras** — CSV con prevención de inyección de fórmulas, Markdown con escape de tuberías.
- **Patrón de adaptador** — primero GitHublindado para GitLab/Bitbucket.

## Comienzo rápido

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

Agregue la misma configuración a su archivo `claude_desktop_config.json`.

### Configuración

| Variable | Requerida | Descripción |
| ---------- | ---------- | ------------- |
| `GITHUB_TOKEN` | Recomendada | Token de acceso personal de GitHub. Sin él: 60 solicitudes/hora. Con él: 5000 solicitudes/hora. |

**Alcances del token por nivel:**

| Nivel | Alcances requeridos |
| ------ | ---------------- |
| Nivel 1 | `public_repo` (o `repo` para repositorios privados) |
| Nivel 2 | Lo anterior + acceso de escritura/administrador para datos de tráfico |
| Nivel 3 | Lo anterior + `security_events` para Dependabot, análisis de código y detección de secretos |

## Herramientas

### `crawl_repo`

La herramienta principal. Rastrea un solo repositorio en cualquier nivel de datos.

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| Parámetro | Tipo | Valor predeterminado | Descripción |
| ------- | ------ | --------- | ------------- |
| `owner` | string | — | Propietario del repositorio |
| `repo` | string | — | Nombre del repositorio |
| `tier` | `'1'` | `'2'` | `'3'` | `'1'` | Nivel de datos |
| `sections` | string[] | todos | Secciones específicas a incluir |
| `exclude_sections` | string[] | ninguna | Secciones a omitir |
| `commit_limit` | number | 30 | Máximo de commits (Nivel 1) |
| `contributor_limit` | number | 30 | Máximo de contribuyentes (Nivel 1) |
| `issue_limit` | number | 100 | Máximo de problemas (Nivel 2) |
| `pr_limit` | number | 100 | Máximo de solicitudes de extracción (Nivel 2) |
| `issue_state` | `'abierto'` | `'cerrado'` | `'all'` | `'all'` | Filtro de problemas/solicitudes de extracción (Nivel 2) |
| `alert_limit` | number | 100 | Máximo de alertas de seguridad (Nivel 3) |

### `crawl_org`

Rastrea cada repositorio en una organización con filtros.

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| Parámetro | Tipo | Valor predeterminado | Descripción |
| ------- | ------ | --------- | ------------- |
| `org` | string | — | Nombre de la organización |
| `tier` | `'1'` | `'2'` | `'3'` | `'1'` | Data por nivel de repositorio |
| `min_stars` | número | 0 | Número mínimo de estrellas |
| `language` | cadena de texto | cualquier valor | Filtrar por lenguaje principal |
| `include_forks` | booleano | falso | Incluir repositorios bifurcados |
| `include_archived` | booleano | falso | Incluir repositorios archivados |
| `repo_limit` | número | 30 | Número máximo de repositorios a analizar |
| `alert_limit` | número | 30 | Número máximo de alertas de seguridad por repositorio (Nivel 3) |

### `get_repo_summary`

Resumen conciso y fácil de entender. Solo requiere 4 llamadas a la API, ideal para la evaluación inicial.

```
get_repo_summary({ owner: "anthropics", repo: "claude-code" })
```

### `compare_repos`

Comparación lado a lado de 2 a 5 repositorios. Incluye: estrellas, lenguajes, actividad, salud de la comunidad, tamaño.

```
compare_repos({ repos: [
  { owner: "vitejs", repo: "vite" },
  { owner: "webpack", repo: "webpack" }
]})
```

### `export_data`

Exportar los resultados del análisis en formato JSON, CSV o Markdown. El formato CSV incluye protección contra inyección de fórmulas.

```
export_data({ data: crawlResult, format: "markdown", sections: ["metadata", "issues"] })
```

## Niveles de datos

### Nivel 1: Fundamentos del repositorio

Todo lo que necesita para comprender un repositorio de un vistazo.

| Sección | Punto de acceso de la API | Llamadas |
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

**Presupuesto: ~11 llamadas a la API por análisis completo. ~450 análisis completos/hora con token.**

### Nivel 2: Actividad del proyecto (incluye el Nivel 1)

Problemas, solicitudes de extracción, tráfico, hitos: el pulso del proyecto.

| Sección | Punto de acceso de la API | Llamadas | Notas |
| --------- | ------------- | ------- | ------- |
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | Requiere acceso de administrador o de escritura. Se adapta de forma gradual en caso de error 403. |
| `issues` | `GET /repos/.../issues` | 1+ | Excluye las solicitudes de extracción. El cuerpo del texto está limitado a 500 caracteres. |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | Incluye el estado de borrador/fusionado, las referencias de origen/destino. |
| `milestones` | `GET /repos/.../milestones` | 1+ | Todos los estados (abiertos + cerrados). |
| `discussions` | _(GraphQL — prototipo)_ | 0 | Devuelve un valor vacío. Planeado para una futura versión. |

### Nivel 3: Seguridad y cumplimiento (incluye el Nivel 1 + 2)

Datos de vulnerabilidades, análisis de dependencias, secretos filtrados.

| Sección | Punto de acceso de la API | Llamadas | Notas |
| --------- | ------------- | ------- | ------- |
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | Identificadores CVE/GHSA, versiones corregidas, gravedad. |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | Avisos a nivel de repositorio con detalles de las vulnerabilidades. |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | Formato SPDX. Paquetes, versiones, licencias, ecosistemas. |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL, Semgrep, etc. Identificadores de reglas, ubicaciones de archivos. |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | Tokens/claves filtrados. Seguimiento de la protección contra escritura. |

**Seguimiento de permisos:** Cada sección del Nivel 3 devuelve un estado de permiso (`otorgado`, `denegado` o `no_habilitado`) para que el agente sepa exactamente qué es accesible y qué requiere acceso elevado.

**Adaptación gradual:** Cada sección se recupera de forma independiente. Un error 403 en el análisis de código no bloquea Dependabot ni SBOM.

## Ejemplos

### Evaluación inicial rápida de un repositorio
```
get_repo_summary({ owner: "expressjs", repo: "express" })
```

### Auditoría de seguridad exhaustiva
```
crawl_repo({ owner: "myorg", repo: "api-server", tier: "3" })
```

### Comparación de frameworks
```
compare_repos({ repos: [
  { owner: "sveltejs", repo: "svelte" },
  { owner: "vuejs", repo: "core" },
  { owner: "facebook", repo: "react" }
], aspects: ["metadata", "activity", "community"] })
```

### Exportar problemas a CSV
```
const result = crawl_repo({ owner: "myorg", repo: "app", tier: "2", sections: ["issues"] })
export_data({ data: result, format: "csv" })
```

### Análisis de vulnerabilidades a nivel de organización
```
crawl_org({ org: "myorg", tier: "3", alert_limit: 50 })
```

## Desarrollo

```bash
npm install
npm run typecheck    # Type check with tsc
npm test             # Run tests with vitest
npm run build        # Compile to build/
```

### Cobertura de pruebas

60 pruebas en 5 archivos de prueba:
- **Validación** — expresiones regulares para propietario/repositorio, análisis de URL, casos límite
- **Escapado de CSV** — vectores de inyección de fórmulas, comillas, caracteres especiales
- **Escapado de Markdown** — escapado de tuberías y saltos de línea
- **Adaptador de GitHub** — recuperación de los Niveles 1/2/3, filtrado de secciones, manejo de errores, seguimiento de permisos
- **Esquemas de herramientas** — validación Zod, valores predeterminados de parámetros

## Arquitectura

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

### Principios de diseño

- **Recuperación selectiva por sección** — No pague por lo que no utiliza. Solicite `sections: ["metadata", "issues"]` y solo se llamarán esas API.
- **Procesamiento paralelo cuando sea seguro** — Los puntos finales independientes y de llamada única (metadatos, árbol, idiomas, archivo README, comunidad) se ejecutan mediante `Promise.allSettled`. Los puntos finales paginados se ejecutan de forma secuencial con terminación temprana.
- **Degradación controlada** — Cada llamada a la API está envuelta en un bloque try/catch. Un solo fallo devuelve un valor predeterminado y nunca interrumpe el proceso de rastreo.
- **Conciencia de permisos** — El nivel 3 registra qué puntos finales de seguridad devolvieron un código 403 en lugar de 404. El agente puede determinar qué permisos tiene.

## Licencia

[MIT](LICENSE)

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
