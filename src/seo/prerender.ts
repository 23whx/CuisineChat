/**
 * 建置期預渲染：為每種語言生成 <head> 標記、可被爬蟲直接讀取的首頁正文，以及 sitemap。
 * 只在 vite.config.ts 中使用（Node 環境），不會打包進前端。
 *
 * 正文與 React 首頁（src/pages/Home.tsx）使用同一份翻譯，內容一致，不構成隱藏內容（cloaking）。
 * React 掛載後會整體替換 #root 內的預渲染內容。
 */
import en from '../i18n/locales/en.json';
import zh from '../i18n/locales/zh.json';
import ja from '../i18n/locales/ja.json';
import ko from '../i18n/locales/ko.json';
import {
  DEFAULT_LANG,
  FAQS,
  FEATURES,
  HOW_STEPS,
  HREFLANG,
  HTML_LANG,
  LANGS,
  AUTHOR,
  LANG_LABEL,
  LOGO_IMAGE,
  OG_IMAGE,
  OG_LOCALE,
  SITE_URL,
  langPath,
  langUrl,
  type Lang,
} from './site';

/** 建置日期：頁面「最後更新」、結構化資料 dateModified、sitemap lastmod 共用 */
export const BUILD_DATE = new Date().toISOString().slice(0, 10);

type Dict = Record<string, unknown>;
const DICTS: Record<Lang, Dict> = { en, zh, ja, ko };

const t = (lang: Lang, key: string): string => {
  const value = key.split('.').reduce<unknown>((obj, k) => (obj as Dict | undefined)?.[k], DICTS[lang]);
  if (typeof value !== 'string') throw new Error(`[seo] 缺少翻譯 ${lang}:${key}`);
  return value;
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// JSON-LD 放在 <script> 內，需防止 </script> 提前結束
const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

export function renderHead(lang: Lang): string {
  const url = langUrl(lang);
  const title = t(lang, 'seo.title');
  const description = t(lang, 'seo.description');
  const imageAlt = t(lang, 'seo.imageAlt');

  const alternates = [
    ...LANGS.map((l) => `<link rel="alternate" hreflang="${HREFLANG[l]}" href="${langUrl(l)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${langUrl(DEFAULT_LANG)}" />`,
  ];

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#author`,
        name: AUTHOR.name,
        url: AUTHOR.url,
        sameAs: AUTHOR.sameAs,
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'CuisineChat',
        url: `${SITE_URL}/`,
        logo: LOGO_IMAGE,
        founder: { '@id': `${SITE_URL}/#author` },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: 'CuisineChat',
        inLanguage: LANGS.map((l) => HTML_LANG[l]),
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description: t(lang, 'landing.what'),
        inLanguage: HTML_LANG[lang],
        dateModified: BUILD_DATE,
        primaryImageOfPage: OG_IMAGE,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#app` },
        author: { '@id': `${SITE_URL}/#author` },
      },
      {
        '@type': 'WebApplication',
        '@id': `${url}#app`,
        name: 'CuisineChat',
        url,
        description: t(lang, 'landing.what'),
        image: OG_IMAGE,
        dateModified: BUILD_DATE,
        author: { '@id': `${SITE_URL}/#author` },
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: HTML_LANG[lang],
        applicationCategory: 'CommunicationApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript and WebRTC',
        isAccessibleForFree: true,
        featureList: FEATURES.map((n) => t(lang, `landing.f${n}Title`)),
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        inLanguage: HTML_LANG[lang],
        mainEntity: FAQS.map((n) => ({
          '@type': 'Question',
          name: t(lang, `landing.q${n}`),
          acceptedAnswer: { '@type': 'Answer', text: t(lang, `landing.a${n}`) },
        })),
      },
    ],
  };

  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="keywords" content="${esc(t(lang, 'seo.keywords'))}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<link rel="canonical" href="${url}" />`,
    ...alternates,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:secure_url" content="${OG_IMAGE}" />`,
    `<meta property="og:image:type" content="image/jpeg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(imageAlt)}" />`,
    `<meta property="og:site_name" content="CuisineChat" />`,
    `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`,
    ...LANGS.filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALE[l]}" />`),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    `<meta name="twitter:image:alt" content="${esc(imageAlt)}" />`,
    `<script type="application/ld+json">${jsonLd(graph)}</script>`,
  ]
    .map((line) => `    ${line}`)
    .join('\n');
}

/** 首頁正文的靜態版本（JS 執行前、或不執行 JS 的爬蟲看到的內容） */
export function renderBody(lang: Lang): string {
  const how = HOW_STEPS.map(
    (n) => `<li><h3>${esc(t(lang, `landing.how${n}Title`))}</h3><p>${esc(t(lang, `landing.how${n}`))}</p></li>`
  ).join('');
  const features = FEATURES.map(
    (n) => `<li><h3>${esc(t(lang, `landing.f${n}Title`))}</h3><p>${esc(t(lang, `landing.f${n}`))}</p></li>`
  ).join('');
  const faqs = FAQS.map(
    (n) => `<h3>${esc(t(lang, `landing.q${n}`))}</h3><p>${esc(t(lang, `landing.a${n}`))}</p>`
  ).join('');
  const langLinks = LANGS.map(
    (l) => `<a href="${langPath(l)}" hreflang="${HREFLANG[l]}" lang="${HTML_LANG[l]}">${LANG_LABEL[l]}</a>`
  ).join(' · ');

  return `<main class="prerender">
        <p class="prerender-brand">CuisineChat</p>
        <h1>${esc(t(lang, 'home.h1'))}</h1>
        <p>${esc(t(lang, 'home.tagline'))}</p>
        <section><h2>${esc(t(lang, 'landing.whatTitle'))}</h2><p>${esc(t(lang, 'landing.what'))}</p></section>
        <section><h2>${esc(t(lang, 'landing.howTitle'))}</h2><ol>${how}</ol></section>
        <section><h2>${esc(t(lang, 'landing.featuresTitle'))}</h2><ul>${features}</ul></section>
        <section><h2>${esc(t(lang, 'landing.faqTitle'))}</h2>${faqs}</section>
        <p><small>${esc(t(lang, 'landing.updated'))}: <time datetime="${BUILD_DATE}">${BUILD_DATE}</time></small></p>
        <nav aria-label="${esc(t(lang, 'landing.languages'))}">${langLinks}</nav>
      </main>`;
}

const HEAD_RE = /<!-- seo:head:start -->[\s\S]*?<!-- seo:head:end -->/;
const BODY_RE = /<!-- seo:body:start -->[\s\S]*?<!-- seo:body:end -->/;

/** 把 index.html 中標記區塊替換成指定語言的內容（可重複套用） */
export function applySeo(html: string, lang: Lang): string {
  if (!HEAD_RE.test(html) || !BODY_RE.test(html)) {
    throw new Error('[seo] index.html 缺少 seo:head / seo:body 標記');
  }
  return html
    .replace(/<html lang="[^"]*"/, `<html lang="${HTML_LANG[lang]}"`)
    .replace(HEAD_RE, `<!-- seo:head:start -->\n${renderHead(lang)}\n    <!-- seo:head:end -->`)
    .replace(BODY_RE, `<!-- seo:body:start -->${renderBody(lang)}<!-- seo:body:end -->`);
}

export function renderSitemap(lastmod: string): string {
  const urls = LANGS.map((lang) => {
    const links = [
      ...LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${langUrl(l)}" />`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${langUrl(DEFAULT_LANG)}" />`,
    ].join('\n');
    return `  <url>\n    <loc>${langUrl(lang)}</loc>\n    <lastmod>${lastmod}</lastmod>\n${links}\n  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

/** 404 頁：真正回傳 404 狀態（Vercel 對未匹配路徑提供 404.html），不可收錄 */
export function render404(baseHtml: string): string {
  return applySeo(baseHtml, DEFAULT_LANG)
    .replace(
      HEAD_RE,
      `<!-- seo:head:start -->\n    <title>404 · CuisineChat</title>\n    <meta name="robots" content="noindex" />\n    <!-- seo:head:end -->`
    )
    .replace(BODY_RE, `<!-- seo:body:start --><main class="prerender"><h1>404</h1><p><a href="/">CuisineChat</a></p></main><!-- seo:body:end -->`);
}

/**
 * /llms.txt：給會讀取它的 AI 工具一份純文字摘要（Google 搜尋不使用此文件，也不影響排名）。
 * 內容與首頁正文一致，以英文為主並列出各語言版本。
 */
export function renderLlmsTxt(): string {
  const L: Lang = 'en';
  const lines = [
    '# CuisineChat',
    '',
    `> ${t(L, 'landing.what')}`,
    '',
    '## Pages',
    '',
    ...LANGS.map((l) => `- [${LANG_LABEL[l]}](${langUrl(l)}): ${t(l, 'seo.title')}`),
    '',
    `## ${t(L, 'landing.howTitle')}`,
    '',
    ...HOW_STEPS.map((n) => `${n}. **${t(L, `landing.how${n}Title`)}**: ${t(L, `landing.how${n}`)}`),
    '',
    `## ${t(L, 'landing.featuresTitle')}`,
    '',
    ...FEATURES.map((n) => `- **${t(L, `landing.f${n}Title`)}**: ${t(L, `landing.f${n}`)}`),
    '',
    `## ${t(L, 'landing.faqTitle')}`,
    '',
    ...FAQS.flatMap((n) => [`### ${t(L, `landing.q${n}`)}`, '', t(L, `landing.a${n}`), '']),
    '## About',
    '',
    `- Website: ${SITE_URL}/`,
    `- Creator: ${AUTHOR.name} (${AUTHOR.sameAs.join(', ')})`,
    `- Last updated: ${BUILD_DATE}`,
    '',
  ];
  return lines.join('\n');
}
