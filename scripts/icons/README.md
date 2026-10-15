# 網站圖示

| 文件 | 尺寸 | 來源 |
|---|---|---|
| `public/favicon.svg` | 向量 | 手寫 SVG（燈籠輪廓，無文字，小尺寸也清楚） |
| `public/favicon.ico` | 16 / 32 / 48 | 由 `favicon.svg` 輸出，四角透明 |
| `public/favicon-16x16.png`、`favicon-32x32.png` | 16、32 | 同上 |
| `public/apple-touch-icon.png` | 180 | `scripts/icons/app-icon.html`（帶「食」字，不透明滿版） |
| `public/icon-192.png`、`icon-512.png` | 192、512 | 同上；燈籠在中央 80% 安全區內，兼作 maskable |

## 重新輸出

1. 以 512×512 視窗截圖：
   - `favicon.svg`：用 `<img src="favicon.svg" width="512" height="512">` 包一層、背景設 `#15110e` 再截圖
   - `app-icon.html`：直接打開截圖（等 Noto Serif TC 載入完成）
2. 用 Pillow 縮放：
   - favicon：套用圓角遮罩（半徑 = 尺寸 × 14/64）後縮成 16、32，並存成 `favicon.ico`（16/32/48）
   - app icon：縮成 180、192，原圖存為 512
