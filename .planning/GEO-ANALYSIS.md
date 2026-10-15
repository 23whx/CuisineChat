# GEO / AI 可讀性審查：cuisine-chat.oumashu.top

審查日期：2026-10-15。線上版本對應提交 `3a71be8 ads`；修正在本機完成，**尚未部署**。

## GEO 準備度分數

| 項目 | 權重 | 線上（修正前） | 說明 |
|---|---|---|---|
| 可引用性 | 25% | 0 / 25 | 原始 HTML 正文 0 字，沒有任何可引用的段落 |
| 結構可讀性 | 20% | 2 / 20 | 無標題層級；只有 `<title>` 與 meta description |
| 多媒體 | 15% | 6 / 15 | 有 OG 圖，但 `og:image` 指向已失效網域 |
| 權威與品牌訊號 | 20% | 3 / 20 | 無作者、無日期；結構化資料極簡 |
| 技術可存取性 | 20% | 8 / 20 | AI 爬蟲全部放行；但純客戶端渲染、canonical 指向 404 網域、全站假 200 |
| **合計** | | **19 / 100** | |

修正後的分數需在部署後重新量測，這裡不預估。各平台（Google AI Overviews / ChatGPT / Perplexity）的實際曝光**未用工具量測**。

## AI 爬蟲存取（robots.txt）

所有爬蟲都適用 `User-agent: * / Allow: /`，只有 `/room/` 被禁止（私人聊天室，正確）。

| 爬蟲 | 管轄能力 | 狀態 |
|---|---|---|
| Googlebot | Google 搜尋、AI Overviews、AI Mode | 允許 |
| OAI-SearchBot | ChatGPT 搜尋引用 | 允許 |
| ChatGPT-User | ChatGPT 代使用者瀏覽 | 允許 |
| Claude-SearchBot | Claude 搜尋引用 | 允許 |
| Claude-User | Claude 代使用者瀏覽 | 允許 |
| PerplexityBot | Perplexity 搜尋 | 允許 |
| Applebot | Siri / Spotlight / Safari 搜尋 | 允許 |
| Bingbot | Bing / Copilot | 允許 |
| GPTBot | OpenAI 模型訓練（不影響 ChatGPT 搜尋） | 允許 |
| ClaudeBot | Anthropic 模型訓練（不影響 Claude 搜尋） | 允許 |
| Google-Extended | Gemini / Vertex 訓練與 grounding（不影響 Google 搜尋） | 允許 |
| Applebot-Extended | Apple Intelligence 訓練 | 允許 |
| CCBot | Common Crawl 訓練資料 | 允許 |

訓練類爬蟲是否放行屬於授權偏好，與搜尋曝光無關；目前維持全部允許。

## 發現的問題與修正

| # | 問題（線上） | 影響 | 修正 |
|---|---|---|---|
| 1 | canonical、og:url、og:image、JSON-LD、sitemap、robots 的 Sitemap 全部指向 `cuisinechat.vercel.app`，該網域已回傳 404（DEPLOYMENT_NOT_FOUND） | 告訴搜尋引擎與 AI「正本在 404 頁」；分享預覽圖失效；sitemap 中沒有真實網址 | `SITE_URL` 改為 `https://cuisine-chat.oumashu.top`；robots.txt、OG 圖上的網址同步更新 |
| 2 | `<div id="root"></div>` 為空，內容完全依賴 JS | GPTBot、PerplexityBot、Claude 等不執行 JS 的爬蟲讀到 0 字 | 建置期預渲染：`/`、`/zh`、`/ja`、`/ko` 各自輸出完整正文（英 2050 字元、中 817、日 1072、韓 1143） |
| 3 | 任何路徑都回傳 200 + 首頁 HTML，包括 `/llms.txt`、`/nope` | AI 工具把首頁 HTML 當成 llms.txt；大量假 200 頁面 | 只改寫已知路由，其餘回傳真正的 404（`404.html`，noindex） |
| 4 | 四種語言共用一個網址，hreflang 全部指向同一頁 | 只有一種語言能被收錄與引用 | 每種語言獨立網址，雙向 hreflang + x-default |
| 5 | `<html lang="zh-CN">` 但內容是英文 | 語言判斷錯誤 | 每頁正確的 `lang` |
| 6 | 沒有「CuisineChat 是什麼」的定義性段落 | AI 回答「什麼是…」時沒有可直接引用的句子 | 頁首加入自成一段的定義（四種語言），並放在正文最前面 |
| 7 | 無作者、無更新日期 | 權威與新鮮度訊號缺失 | JSON-LD 加入 Person / Organization / WebPage，含 `dateModified`、`sameAs`；頁面顯示「最後更新」日期 |
| 8 | 結構化資料只有一個簡化的 WebApplication | 實體關係不清 | `@graph`：Person、Organization、WebSite、WebPage、WebApplication、FAQPage |
| 9 | 無 `/llms.txt` | 讀取它的非 Google AI 工具拿不到摘要（Google 搜尋不使用此文件） | 建置期由同一份翻譯生成 `/llms.txt` |

## 段落級可引用性

修正後每個語言頁的自成段落：

- **定義**（「CuisineChat 是什麼？」）：約 60 個英文單字，包含是什麼、怎麼用、隱私特性三個事實。
- **使用方法**：3 個步驟，有序列表。
- **特色**：6 項，每項一句可獨立引用的說明。
- **常見問題**：5 組以問題為標題的問答，對應「免費嗎」「會保存嗎」「有加密嗎」等真實查詢。

## 品牌提及

未量測（沒有可用的品牌監測工具）。目前沒有發現 Wikipedia、Reddit、YouTube 上的提及。這是 AI 引用的最強訊號之一，需要站外經營。

## 影響最大的 5 項改動

1. 部署本次修正（目前線上仍是舊版本）。
2. canonical 等網址改為真實網域（問題 1）。
3. 預渲染正文，讓不執行 JS 的 AI 爬蟲讀得到內容（問題 2）。
4. 真正的 404，以及真正的 `/llms.txt`（問題 3、9）。
5. 頁首定義段落與作者 / 日期訊號（問題 6、7）。

## 部署後待辦

- 在 Google Search Console 與 Bing Webmaster Tools 驗證 `cuisine-chat.oumashu.top`，提交 `/sitemap.xml`。
- 用 `curl -A "GPTBot" https://cuisine-chat.oumashu.top/zh` 確認原始 HTML 含正文；`curl -I .../nope` 應為 404。
- 在 Reddit、Product Hunt、V2EX 等社群建立品牌提及；考慮製作簡短的 YouTube 示範影片。
- 每次更新內容後重新部署，`dateModified` 與 sitemap 的 `lastmod` 會自動更新。
