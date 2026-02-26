<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## क्यों

एआई एजेंट जो कोड के साथ काम करते हैं, उन्हें रिपॉजिटरी को समझने की आवश्यकता होती है - न कि केवल फ़ाइलों को, बल्कि पूरे चित्र को: कौन योगदान देता है, क्या टूटा हुआ है, कौन से निर्भरताएं असुरक्षित हैं, परियोजना कितनी सक्रिय है। मैन्युअल रूप से इस जानकारी को निकालना एपीआई कोटा और संदर्भ विंडो का उपयोग करता है।

**रेपो क्रॉलर एमसीपी** GitHub के संपूर्ण डेटा को संरचित एमसीपी उपकरणों के रूप में प्रस्तुत करता है। `crawl_repo` को `tier: '3'` के साथ एक बार कॉल करने से मेटाडेटा, फ़ाइल ट्री, भाषाएं, README, कमिट, योगदानकर्ता, शाखाएं, टैग, रिलीज़, समुदाय का स्वास्थ्य, सीआई वर्कफ़्लो, मुद्दे, पीआर, ट्रैफ़िक, मील के पत्थर, डिपेंडabot अलर्ट, सुरक्षा सलाह, एसबीओएम, कोड स्कैनिंग अलर्ट और सीक्रेट स्कैनिंग अलर्ट - सभी अनुभाग-विशिष्ट, सभी दर-सीमित, और सभी में सुचारू गिरावट होती है।

## विशेषताएं

- **5 एमसीपी उपकरण** - रिपॉजिटरी क्रॉल करें, संगठनों को क्रॉल करें, सारांशित करें, तुलना करें, निर्यात करें
- **3-स्तरीय डेटा मॉडल** - हल्के से शुरुआत करें, जब आपको आवश्यकता हो तो गहराई में जाएं
- **अनुभाग-विशिष्ट फ़ेचिंग** - केवल उन एपीआई को कॉल करें जिन्हें आप मांगते हैं, जिससे कोटा बचता है
- **सुचारू गिरावट** - डिपेंडabot पर 403 त्रुटि क्रॉल को बाधित नहीं करती है; अनुमतियां प्रत्येक अनुभाग के लिए ट्रैक की जाती हैं
- **अंतर्निहित दर सीमा** - ऑक्टोकिट थ्रॉटलिंग, 429 त्रुटियों पर स्वचालित पुनः प्रयास
- **सुरक्षित निर्यात** - सीएसवी जिसमें फ़ॉर्मूला इंजेक्शन से सुरक्षा, मार्कडाउन जिसमें पाइप एस्केपिंग
- **एडाप्टर पैटर्न** - पहले GitHub, GitLab/Bitbucket के लिए विस्तार योग्य

## शुरुआत कैसे करें

### क्लाउड कोड के साथ

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

### क्लाउड डेस्कटॉप के साथ

अपने `claude_desktop_config.json` में भी यही कॉन्फ़िगरेशन जोड़ें।

### कॉन्फ़िगरेशन

| चर | आवश्यक | विवरण |
| ---------- | ---------- | ------------- |
| `GITHUB_TOKEN` | अनुशंसित | GitHub पर्सनल एक्सेस टोकन। इसके बिना: 60 अनुरोध/घंटा। इसके साथ: 5,000 अनुरोध/घंटा। |

**प्रत्येक स्तर के लिए टोकन स्कोप:**

| स्तर | आवश्यक स्कोप |
| ------ | ---------------- |
| स्तर 1 | `public_repo` (या निजी रिपॉजिटरी के लिए `repo`) |
| स्तर 2 | ऊपर दिए गए + ट्रैफ़िक डेटा के लिए पुश/एडमिन एक्सेस |
| स्तर 3 | ऊपर दिए गए + डिपेंडabot, कोड स्कैनिंग और सीक्रेट स्कैनिंग के लिए `security_events` |

## उपकरण

### `crawl_repo`

मुख्य उपकरण। किसी भी डेटा स्तर पर एक एकल रिपॉजिटरी को क्रॉल करें।

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| पैरामीटर | प्रकार | डिफ़ॉल्ट | विवरण |
| ------- | ------ | --------- | ------------- |
| `owner` | string | — | रिपॉजिटरी का स्वामी |
| `repo` | string | — | रिपॉजिटरी का नाम |
| `tier` | `'1'` | `'2'` | `'3'` | `'1'` | डेटा स्तर |
| `sections` | string[] | सभी | शामिल करने के लिए विशिष्ट अनुभाग |
| `exclude_sections` | string[] | कोई नहीं | छोड़ने के लिए अनुभाग |
| `commit_limit` | number | 30 | अधिकतम कमिट (स्तर 1) |
| `contributor_limit` | number | 30 | अधिकतम योगदानकर्ता (स्तर 1) |
| `issue_limit` | number | 100 | अधिकतम मुद्दे (स्तर 2) |
| `pr_limit` | number | 100 | अधिकतम पीआर (स्तर 2) |
| `issue_state` | `'open'` | `'closed'` | `'all'` | `'all'` | मुद्दे/पीआर फ़िल्टर (स्तर 2) |
| `alert_limit` | number | 100 | अधिकतम सुरक्षा अलर्ट (स्तर 3) |

### `crawl_org`

फ़िल्टर के साथ एक संगठन में प्रत्येक रिपॉजिटरी को क्रॉल करें।

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| पैरामीटर | प्रकार | डिफ़ॉल्ट | विवरण |
| ------- | ------ | --------- | ------------- |
| `org` | string | — | संगठन का नाम |
| `tier` | `'1'` | `'2'` | `'3'` | `'1'` | Data tier per repo |
| `min_stars` | संख्या | 0 | न्यूनतम स्टार की संख्या |
| `language` | स्ट्रिंग | कोई भी | प्राथमिक भाषा के आधार पर फ़िल्टर करें |
| `include_forks` | बूलियन | गलत | फोर्क किए गए रिपॉजिटरी को शामिल करें |
| `include_archived` | बूलियन | गलत | आर्काइव किए गए रिपॉजिटरी को शामिल करें |
| `repo_limit` | संख्या | 30 | स्कैन करने के लिए अधिकतम रिपॉजिटरी |
| `alert_limit` | संख्या | 30 | प्रति रिपॉजिटरी अधिकतम सुरक्षा अलर्ट (टियर 3) |

### `get_repo_summary`

त्वरित, आसानी से समझने योग्य सारांश। केवल 4 एपीआई कॉल - प्रारंभिक जांच के लिए आदर्श।

```
get_repo_summary({ owner: "anthropics", repo: "claude-code" })
```

### `compare_repos`

2-5 रिपॉजिटरी की तुलना, एक साथ। स्टार, भाषाएं, गतिविधि, समुदाय स्वास्थ्य, आकार।

```
compare_repos({ repos: [
  { owner: "vitejs", repo: "vite" },
  { owner: "webpack", repo: "webpack" }
]})
```

### `export_data`

स्कैन के परिणामों को JSON, CSV या Markdown के रूप में निर्यात करें। CSV में फॉर्मूला इंजेक्शन से बचाव शामिल है।

```
export_data({ data: crawlResult, format: "markdown", sections: ["metadata", "issues"] })
```

## डेटा टियर

### टियर 1 — रिपॉजिटरी की बुनियादी जानकारी

वह सब कुछ जो आपको एक नज़र में रिपॉजिटरी को समझने के लिए आवश्यक है।

| अनुभाग | एपीआई एंडपॉइंट | कॉल |
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

**बजट: प्रति पूर्ण स्कैन लगभग 11 एपीआई कॉल। टोकन के साथ प्रति घंटा लगभग 450 पूर्ण स्कैन।**

### टियर 2 — प्रोजेक्ट गतिविधि (टियर 1 शामिल)

इश्यू, पीआर, ट्रैफ़िक, मील के पत्थर - परियोजना की गति।

| अनुभाग | एपीआई एंडपॉइंट | कॉल | टिप्पणियाँ |
| --------- | ------------- | ------- | ------- |
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | पुश/एडमिन एक्सेस की आवश्यकता है। 403 त्रुटि होने पर भी ठीक से काम करता है। |
| `issues` | `GET /repos/.../issues` | 1+ | पीआर को फ़िल्टर करता है। बॉडी 500 वर्णों तक सीमित है। |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | ड्राफ्ट/मर्ज स्थिति, हेड/बेस रेफ शामिल हैं। |
| `milestones` | `GET /repos/.../milestones` | 1+ | सभी स्थितियां (खुले + बंद)। |
| `discussions` | _(GraphQL — स्टब)_ | 0 | खाली मान लौटाता है। भविष्य में जारी करने की योजना है। |

### टियर 3 — सुरक्षा और अनुपालन (टियर 1 + 2 शामिल)

भेद्यता डेटा, निर्भरता विश्लेषण, लीक हुए गुप्त जानकारी।

| अनुभाग | एपीआई एंडपॉइंट | कॉल | टिप्पणियाँ |
| --------- | ------------- | ------- | ------- |
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | CVE/GHSA आईडी, पैच किए गए संस्करण, गंभीरता। |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | भेद्यता विवरण के साथ रिपॉजिटरी-स्तरीय सलाह। |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | SPDX प्रारूप। पैकेज, संस्करण, लाइसेंस, पारिस्थितिकी तंत्र। |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL, Semgrep, आदि। नियम आईडी, फ़ाइल स्थान। |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | लीक हुए टोकन/कुंजी। पुश सुरक्षा बाईपास ट्रैकिंग। |

**अनुमति ट्रैकिंग:** टियर 3 का प्रत्येक अनुभाग एक अनुमति स्थिति लौटाता है (`अनुमत`, `अस्वीकृत`, या `सक्षम नहीं`) ताकि एजेंट को ठीक से पता चल सके कि क्या सुलभ है और किस चीज़ के लिए उन्नत एक्सेस की आवश्यकता है।

**सुचारू गिरावट:** प्रत्येक अनुभाग स्वतंत्र रूप से प्राप्त किया जाता है। कोड स्कैनिंग पर 403 त्रुटि होने से Dependabot या SBOM प्रभावित नहीं होते हैं।

## उदाहरण

### त्वरित रिपॉजिटरी जांच
```
get_repo_summary({ owner: "expressjs", repo: "express" })
```

### गहन सुरक्षा ऑडिट
```
crawl_repo({ owner: "myorg", repo: "api-server", tier: "3" })
```

### फ्रेमवर्क की तुलना करें
```
compare_repos({ repos: [
  { owner: "sveltejs", repo: "svelte" },
  { owner: "vuejs", repo: "core" },
  { owner: "facebook", repo: "react" }
], aspects: ["metadata", "activity", "community"] })
```

### इश्यू को CSV में निर्यात करें
```
const result = crawl_repo({ owner: "myorg", repo: "app", tier: "2", sections: ["issues"] })
export_data({ data: result, format: "csv" })
```

### पूरे संगठन के लिए भेद्यता स्कैन
```
crawl_org({ org: "myorg", tier: "3", alert_limit: 50 })
```

## विकास

```bash
npm install
npm run typecheck    # Type check with tsc
npm test             # Run tests with vitest
npm run build        # Compile to build/
```

### टेस्ट कवरेज

5 टेस्ट फ़ाइलों में 60 टेस्ट:
- **सत्यापन** — मालिक/रिपॉजिटरी रेगुलर एक्सप्रेशन, यूआरएल पार्सिंग, किनारे के मामले
- **CSV एस्केपिंग** — फॉर्मूला इंजेक्शन वेक्टर, उद्धरण, विशेष वर्ण
- **मार्कडाउन एस्केपिंग** — पाइप और नई लाइन एस्केपिंग
- **GitHub एडाप्टर** — टियर 1/2/3 प्राप्त करना, अनुभाग फ़िल्टरिंग, त्रुटि प्रबंधन, अनुमति ट्रैकिंग
- **टूल स्कीमा** — Zod सत्यापन, पैरामीटर डिफ़ॉल्ट

## आर्किटेक्चर

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

### डिजाइन सिद्धांत

- **सेक्शन-विशिष्ट डेटा प्राप्त करना** — केवल वही डेटा प्राप्त करें जिसका आप उपयोग करते हैं। `sections: ["metadata", "issues"]` का अनुरोध करें, और केवल उन्हीं एपीआई को कॉल किया जाएगा।
- **सुरक्षित होने पर समानांतर प्रसंस्करण** — स्वतंत्र, एकल-कॉल एंडपॉइंट (मेटाडेटा, ट्री, भाषाएं, रीडमी, समुदाय) `Promise.allSettled` के माध्यम से चलते हैं। पेजिनेटेड एंडपॉइंट क्रमिक रूप से चलते हैं, और यदि आवश्यक हो तो प्रक्रिया जल्दी समाप्त हो जाती है।
- **सुचारू रूप से काम करने की क्षमता** — प्रत्येक एपीआई कॉल को `try/catch` में लपेटा जाता है। यदि कोई त्रुटि होती है, तो एक डिफ़ॉल्ट मान वापस किया जाता है, और यह प्रक्रिया कभी भी बाधित नहीं होती है।
- **अनुमति का ध्यान रखना** — तीसरे स्तर पर यह ट्रैक किया जाता है कि कौन से सुरक्षा एंडपॉइंट 403 (अनुमति अस्वीकृत) बनाम 404 (पृष्ठ नहीं मिला) त्रुटि वापस करते हैं। एजेंट यह समझ सकता है कि उसे किस तक पहुंच है।

## लाइसेंस

[MIT](LICENSE)

---

यह <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा बनाया गया है।
