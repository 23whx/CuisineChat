import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { BUILD_DATE, applySeo, render404, renderLlmsTxt, renderSitemap } from './src/seo/prerender'
import { DEFAULT_LANG, LANGS } from './src/seo/site'

/**
 * SEO 預渲染：
 * - index.html（英文，/）在開發與建置時都注入完整的 head 與首頁正文
 * - 建置結束後另外輸出 zh/index.html、ja/index.html、ko/index.html、404.html、sitemap.xml 與 llms.txt
 */
function seoPrerender(): Plugin {
  let outDir = 'dist'
  return {
    name: 'seo-prerender',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => applySeo(html, DEFAULT_LANG),
    },
    closeBundle() {
      const indexPath = path.join(outDir, 'index.html')
      if (!fs.existsSync(indexPath)) return
      const base = fs.readFileSync(indexPath, 'utf-8')
      for (const lang of LANGS) {
        if (lang === DEFAULT_LANG) continue
        const dir = path.join(outDir, lang)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), applySeo(base, lang))
      }
      fs.writeFileSync(path.join(outDir, '404.html'), render404(base))
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), renderSitemap(BUILD_DATE))
      fs.writeFileSync(path.join(outDir, 'llms.txt'), renderLlmsTxt())
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), seoPrerender()],
  define: {
    // 首頁顯示的「最後更新」日期，與預渲染、結構化資料一致
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'i18n-vendor': ['i18next', 'react-i18next'],
          'peer-vendor': ['peerjs'],
          'avatar-vendor': ['@dicebear/core', '@dicebear/collection'],
        },
      },
    },
  },
})
