# 社交分享圖（Open Graph）

- 原稿：`scripts/og/og-image.html`（1200×630，深夜食堂配色）
- 輸出：`public/og-image.jpg`（`index.html` 的 `og:image` / `twitter:image` 指向它）

## 重新輸出

1. 用瀏覽器以 1200×630 視窗打開 `og-image.html`，等字體載入完成後截圖（DPR 1）。
   例如使用 agent-browser：

   ```bash
   agent-browser set viewport 1200 630
   agent-browser open "file:///<repo>/scripts/og/og-image.html"
   agent-browser screenshot og.png
   ```

2. 轉成 JPEG（保持在 300KB 以內，WhatsApp 才會顯示預覽）：

   ```bash
   python -c "from PIL import Image; Image.open('og.png').convert('RGB').save('public/og-image.jpg', quality=88, optimize=True, progressive=True, subsampling=0)"
   ```

3. 部署後清除各平台快取：
   - Facebook：https://developers.facebook.com/tools/debug/
   - LinkedIn：https://www.linkedin.com/post-inspector/
   - X 會在數天內自動更新；Telegram 可向 @WebpageBot 發送網址刷新。
