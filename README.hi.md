<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <strong>हिन्दी</strong> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="logo.png" alt="mcp-tool-shop" width="200" />
</p>

<h1 align="center">Repo Crawler MCP</h1>

<p align="center">
  एक MCP सर्वर जो GitHub रिपॉजिटरी को AI एजेंट्स के लिए संरचित डेटा में बदलता है।<br>
  मेटाडेटा, इश्यूज़, सुरक्षा अलर्ट, SBOMs — सब एक टूल कॉल में।
</p>

<p align="center">
  <a href="#त्वरित-शुरुआत">त्वरित शुरुआत</a> &middot;
  <a href="#टूल्स">टूल्स</a> &middot;
  <a href="#डेटा-टियर">डेटा टियर</a> &middot;
  <a href="#कॉन्फ़िगरेशन">कॉन्फ़िगरेशन</a> &middot;
  <a href="#आर्किटेक्चर">आर्किटेक्चर</a> &middot;
  <a href="#लाइसेंस">लाइसेंस</a>
</p>

---

## क्यों

कोड के साथ काम करने वाले AI एजेंट्स को रिपॉजिटरी समझने की ज़रूरत होती है — सिर्फ़ फ़ाइलें नहीं, बल्कि पूरी तस्वीर: कौन कॉन्ट्रिब्यूट कर रहा है, क्या टूटा हुआ है, कौन सी डिपेंडेंसी कमज़ोर हैं, प्रोजेक्ट कितना सक्रिय है। इसे मैन्युअली स्क्रैप करना API कोटा और कॉन्टेक्स्ट विंडो बर्बाद करता है।

**Repo Crawler MCP** GitHub की पूरी डेटा सतह को संरचित MCP टूल्स के रूप में उपलब्ध कराता है। `crawl_repo` को `tier: '3'` के साथ एक बार कॉल करें और आपको मिलेगा: मेटाडेटा, फ़ाइल ट्री, भाषाएँ, README, कमिट्स, कॉन्ट्रिब्यूटर्स, ब्रांचेज़, टैग्स, रिलीज़, कम्युनिटी हेल्थ, CI वर्कफ़्लोज़, इश्यूज़, PRs, ट्रैफ़िक, माइलस्टोन्स, Dependabot अलर्ट, सुरक्षा एडवाइज़री, SBOM, कोड स्कैनिंग अलर्ट, और सीक्रेट स्कैनिंग अलर्ट — सभी सेक्शन-सेलेक्टिव, रेट-लिमिटेड, और ग्रेसफ़ुल डिग्रेडेशन के साथ।

## विशेषताएँ

- **5 MCP टूल्स** — रिपोज़ क्रॉल करें, ऑर्ग क्रॉल करें, सारांश बनाएं, तुलना करें, एक्सपोर्ट करें
- **3-टियर डेटा मॉडल** — हल्के से शुरू करें, ज़रूरत पड़ने पर गहराई में जाएं
- **सेक्शन-सेलेक्टिव फ़ेचिंग** — सिर्फ़ वही APIs कॉल करता है जो आप मांगते हैं, कोटा बचाता है
- **ग्रेसफ़ुल डिग्रेडेशन** — Dependabot पर 403 पूरे क्रॉल को नहीं रोकता; हर सेक्शन की अनुमतियां अलग से ट्रैक होती हैं
- **बिल्ट-इन रेट लिमिटिंग** — Octokit थ्रॉटलिंग, 429 पर ऑटोमैटिक रीट्राई
- **सुरक्षित एक्सपोर्ट** — फ़ॉर्मूला इंजेक्शन प्रिवेंशन के साथ CSV, पाइप एस्केपिंग के साथ Markdown
- **एडाप्टर पैटर्न** — पहले GitHub, GitLab/Bitbucket तक विस्तार योग्य

## त्वरित शुरुआत

### Claude Code के साथ

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

### Claude Desktop के साथ

वही कॉन्फ़िगरेशन अपनी `claude_desktop_config.json` में जोड़ें।

### कॉन्फ़िगरेशन

| वेरिएबल | आवश्यक | विवरण |
|---------|--------|-------|
| `GITHUB_TOKEN` | अनुशंसित | GitHub पर्सनल एक्सेस टोकन। बिना: 60 रिक्वेस्ट/घंटा। साथ: 5,000 रिक्वेस्ट/घंटा। |

**टियर के अनुसार टोकन स्कोप:**

| टियर | आवश्यक स्कोप |
|------|-------------|
| टियर 1 | `public_repo` (प्राइवेट रिपोज़ के लिए `repo`) |
| टियर 2 | वही + ट्रैफ़िक डेटा के लिए push/admin एक्सेस |
| टियर 3 | वही + Dependabot, कोड स्कैनिंग, सीक्रेट स्कैनिंग के लिए `security_events` |

## टूल्स

### `crawl_repo`

मुख्य टूल। किसी भी डेटा टियर पर एक रिपॉजिटरी क्रॉल करें।

```
crawl_repo({ owner: "facebook", repo: "react", tier: "2" })
```

| पैरामीटर | टाइप | डिफ़ॉल्ट | विवरण |
|---------|------|---------|-------|
| `owner` | string | — | रिपॉजिटरी ओनर |
| `repo` | string | — | रिपॉजिटरी नाम |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | डेटा टियर |
| `sections` | string[] | सभी | शामिल करने के लिए विशिष्ट सेक्शन |
| `exclude_sections` | string[] | कोई नहीं | छोड़ने के लिए सेक्शन |
| `commit_limit` | number | 30 | अधिकतम कमिट्स (टियर 1) |
| `contributor_limit` | number | 30 | अधिकतम कॉन्ट्रिब्यूटर्स (टियर 1) |
| `issue_limit` | number | 100 | अधिकतम इश्यूज़ (टियर 2) |
| `pr_limit` | number | 100 | अधिकतम PRs (टियर 2) |
| `issue_state` | `'open'` \| `'closed'` \| `'all'` | `'all'` | इश्यू/PR फ़िल्टर (टियर 2) |
| `alert_limit` | number | 100 | अधिकतम सुरक्षा अलर्ट (टियर 3) |

### `crawl_org`

फ़िल्टर के साथ एक ऑर्गनाइज़ेशन की सभी रिपोज़ क्रॉल करें।

```
crawl_org({ org: "vercel", tier: "1", min_stars: 100, language: "TypeScript" })
```

| पैरामीटर | टाइप | डिफ़ॉल्ट | विवरण |
|---------|------|---------|-------|
| `org` | string | — | ऑर्गनाइज़ेशन नाम |
| `tier` | `'1'` \| `'2'` \| `'3'` | `'1'` | प्रति रिपो डेटा टियर |
| `min_stars` | number | 0 | न्यूनतम स्टार काउंट |
| `language` | string | any | प्राथमिक भाषा से फ़िल्टर |
| `include_forks` | boolean | false | फ़ोर्क शामिल करें |
| `include_archived` | boolean | false | आर्काइव्ड शामिल करें |
| `repo_limit` | number | 30 | अधिकतम रिपोज़ |
| `alert_limit` | number | 30 | प्रति रिपो अधिकतम सुरक्षा अलर्ट (टियर 3) |

### `get_repo_summary`

तेज़ मानव-पठनीय सारांश। सिर्फ़ 4 API कॉल — ट्रायज के लिए आदर्श।

```
get_repo_summary({ owner: "anthropics", repo: "claude-code" })
```

### `compare_repos`

2–5 रिपोज़ की साइड-बाई-साइड तुलना। स्टार्स, भाषाएँ, गतिविधि, कम्युनिटी हेल्थ, साइज़।

```
compare_repos({ repos: [
  { owner: "vitejs", repo: "vite" },
  { owner: "webpack", repo: "webpack" }
]})
```

### `export_data`

क्रॉल रिज़ल्ट्स को JSON, CSV, या Markdown में एक्सपोर्ट करें। CSV में फ़ॉर्मूला इंजेक्शन प्रिवेंशन शामिल है।

```
export_data({ data: crawlResult, format: "markdown", sections: ["metadata", "issues"] })
```

## डेटा टियर

### टियर 1 — रिपॉजिटरी बुनियादी बातें

एक नज़र में रिपो समझने के लिए सब कुछ।

| सेक्शन | API एंडपॉइंट | कॉल्स |
|--------|-------------|-------|
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

**बजट: प्रति पूर्ण क्रॉल ~11 API कॉल। टोकन के साथ ~450 पूर्ण क्रॉल/घंटा।**

### टियर 2 — प्रोजेक्ट गतिविधि (टियर 1 शामिल)

इश्यूज़, PRs, ट्रैफ़िक, माइलस्टोन्स — प्रोजेक्ट की धड़कन।

| सेक्शन | API एंडपॉइंट | कॉल्स | नोट्स |
|--------|-------------|-------|-------|
| `traffic` | `.../traffic/views` + `.../traffic/clones` | 2 | push/admin एक्सेस आवश्यक। 403 पर ग्रेसफ़ुल डिग्रेडेशन। |
| `issues` | `GET /repos/.../issues` | 1+ | PRs को फ़िल्टर करता है। बॉडी 500 अक्षरों तक सीमित। |
| `pullRequests` | `GET /repos/.../pulls` | 1+ | ड्राफ़्ट/मर्ज़्ड स्टेटस, head/base refs शामिल। |
| `milestones` | `GET /repos/.../milestones` | 1+ | सभी स्टेट (open + closed)। |
| `discussions` | _(GraphQL — स्टब)_ | 0 | खाली लौटाता है। भविष्य के रिलीज़ में योजनाबद्ध। |

### टियर 3 — सुरक्षा और अनुपालन (टियर 1 + 2 शामिल)

भेद्यता डेटा, डिपेंडेंसी विश्लेषण, लीक हुए सीक्रेट्स।

| सेक्शन | API एंडपॉइंट | कॉल्स | नोट्स |
|--------|-------------|-------|-------|
| `dependabotAlerts` | `GET /repos/.../dependabot/alerts` | 1 | CVE/GHSA IDs, पैच किए गए वर्शन, गंभीरता। |
| `securityAdvisories` | `GET /repos/.../security-advisories` | 1 | भेद्यता विवरण के साथ रिपो-स्तरीय एडवाइज़री। |
| `sbom` | `GET /repos/.../dependency-graph/sbom` | 1 | SPDX फ़ॉर्मेट। पैकेज, वर्शन, लाइसेंस, इकोसिस्टम। |
| `codeScanningAlerts` | `GET /repos/.../code-scanning/alerts` | 1 | CodeQL, Semgrep, आदि। रूल IDs, फ़ाइल लोकेशन। |
| `secretScanningAlerts` | `GET /repos/.../secret-scanning/alerts` | 1 | लीक हुए टोकन/कीज़। पुश प्रोटेक्शन बाईपास ट्रैकिंग। |

**अनुमति ट्रैकिंग:** हर टियर 3 सेक्शन एक अनुमति स्टेटस लौटाता है (`granted`, `denied`, या `not_enabled`) ताकि एजेंट को पता रहे कि क्या एक्सेसिबल है और किसके लिए उच्च अनुमति चाहिए।

**ग्रेसफ़ुल डिग्रेडेशन:** हर सेक्शन स्वतंत्र रूप से फ़ेच होता है। कोड स्कैनिंग पर 403 Dependabot या SBOM को ब्लॉक नहीं करता।

## उदाहरण

### त्वरित रिपो ट्रायज
```
get_repo_summary({ owner: "expressjs", repo: "express" })
```

### गहन सुरक्षा ऑडिट
```
crawl_repo({ owner: "myorg", repo: "api-server", tier: "3" })
```

### फ़्रेमवर्क तुलना
```
compare_repos({ repos: [
  { owner: "sveltejs", repo: "svelte" },
  { owner: "vuejs", repo: "core" },
  { owner: "facebook", repo: "react" }
], aspects: ["metadata", "activity", "community"] })
```

### इश्यूज़ को CSV में एक्सपोर्ट
```
const result = crawl_repo({ owner: "myorg", repo: "app", tier: "2", sections: ["issues"] })
export_data({ data: result, format: "csv" })
```

### ऑर्ग-वाइड भेद्यता स्कैन
```
crawl_org({ org: "myorg", tier: "3", alert_limit: 50 })
```

## डेवलपमेंट

```bash
npm install
npm run typecheck    # tsc से टाइप चेक
npm test             # vitest से टेस्ट चलाएं
npm run build        # build/ में कंपाइल
```

### टेस्ट कवरेज

5 टेस्ट फ़ाइलों में 60 टेस्ट:
- **वेलिडेशन** — owner/repo regex, URL पार्सिंग, एज केसेस
- **CSV एस्केपिंग** — फ़ॉर्मूला इंजेक्शन वेक्टर, कोटिंग, स्पेशल कैरेक्टर
- **Markdown एस्केपिंग** — पाइप और न्यूलाइन एस्केपिंग
- **GitHub एडाप्टर** — टियर 1/2/3 फ़ेचिंग, सेक्शन फ़िल्टरिंग, एरर हैंडलिंग, परमिशन ट्रैकिंग
- **टूल स्कीमा** — Zod वेलिडेशन, पैरामीटर डिफ़ॉल्ट्स

## आर्किटेक्चर

```
src/
  index.ts              # एंट्री पॉइंट (npx के लिए shebang)
  server.ts             # MCP सर्वर सेटअप + टूल रजिस्ट्रेशन
  types.ts              # सभी इंटरफ़ेस, Zod स्कीमा, एरर कोड, टियर कॉन्स्टेंट्स
  adapters/
    types.ts            # प्लेटफ़ॉर्म-अज्ञेयवादी एडाप्टर इंटरफ़ेस
    github.ts           # Octokit के माध्यम से GitHub API (टियर 1/2/3)
  tools/
    crawlRepo.ts        # crawl_repo — सिंगल रिपो क्रॉलिंग
    crawlOrg.ts         # crawl_org — फ़िल्टर के साथ ऑर्ग क्रॉलिंग
    repoSummary.ts      # get_repo_summary — हल्का 4-कॉल सारांश
    compareRepos.ts     # compare_repos — साइड-बाई-साइड तुलना
    exportData.ts       # export_data — JSON/CSV/Markdown एक्सपोर्ट
  utils/
    logger.ts           # सिर्फ़ stderr लॉगर (stdout MCP के लिए आरक्षित)
    errors.ts           # CrawlerError क्लास, स्ट्रक्चर्ड एरर रिस्पॉन्स
    validation.ts       # owner/repo/URL वेलिडेशन (regex)
    csvEscape.ts        # फ़ॉर्मूला इंजेक्शन प्रिवेंशन + CSV कोटिंग
    mdEscape.ts         # पाइप एस्केपिंग, टेबल के लिए न्यूलाइन रिमूवल
```

### डिज़ाइन सिद्धांत

- **सेक्शन-सेलेक्टिव फ़ेचिंग** — जो उपयोग नहीं करते उसके लिए भुगतान न करें। `sections: ["metadata", "issues"]` रिक्वेस्ट करें और सिर्फ़ वही APIs कॉल होती हैं।
- **सुरक्षित होने पर समानांतर** — स्वतंत्र सिंगल-कॉल एंडपॉइंट्स (metadata, tree, languages, readme, community) `Promise.allSettled` से चलते हैं। पेजिनेटेड एंडपॉइंट्स अर्ली टर्मिनेशन के साथ क्रमिक रूप से चलते हैं।
- **ग्रेसफ़ुल डिग्रेडेशन** — हर API कॉल try/catch में लिपटी है। एक विफलता डिफ़ॉल्ट वैल्यू लौटाती है, क्रॉल को कभी क्रैश नहीं करती।
- **अनुमति जागरूकता** — टियर 3 ट्रैक करता है कि कौन से सुरक्षा एंडपॉइंट्स ने 403 vs 404 लौटाया। एजेंट अपनी एक्सेस के बारे में तर्क कर सकता है।

## लाइसेंस

[MIT](LICENSE)
