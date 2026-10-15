# 生成 Favicon 图标文件

> **已过时：** 图标已改为「深夜食堂」灯笼设计，当前做法见 `scripts/icons/README.md`，分享图见 `scripts/og/README.md`。

## 🎯 需要生成的文件

从 `public/favicon.svg` 生成以下文件：

1. `favicon-16x16.png` (16x16)
2. `favicon-32x32.png` (32x32)
3. `favicon-192x192.png` (192x192)
4. `favicon-512x512.png` (512x512)
5. `apple-touch-icon.png` (180x180)
6. `og-image.png` (1200x630) - 社交媒体分享图

## 方法 1：使用在线工具（最简单）⭐

### RealFaviconGenerator（推荐）

1. 访问：https://realfavicongenerator.net/
2. 上传 `public/favicon.svg`
3. 按照向导自定义各平台图标
4. 下载图标包
5. 解压并复制所有文件到 `public/` 目录
6. 完成！

### Favicon.io

1. 访问：https://favicon.io/favicon-converter/
2. 上传 `public/favicon.svg`
3. 下载生成的文件
4. 复制到 `public/` 目录

## 方法 2：使用在线 SVG 转 PNG 工具

### CloudConvert

1. 访问：https://cloudconvert.com/svg-to-png
2. 上传 `favicon.svg`
3. 设置输出尺寸
4. 下载转换后的 PNG
5. 重命名并放到 `public/` 目录

### Convertio

1. 访问：https://convertio.co/zh/svg-png/
2. 选择文件并转换
3. 设置不同尺寸

## 方法 3：使用命令行工具

### 使用 ImageMagick（需安装）

```bash
# 安装 ImageMagick
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick

# Windows
# 从官网下载安装：https://imagemagick.org/

# 生成各种尺寸
cd public

convert favicon.svg -resize 16x16 favicon-16x16.png
convert favicon.svg -resize 32x32 favicon-32x32.png
convert favicon.svg -resize 192x192 favicon-192x192.png
convert favicon.svg -resize 512x512 favicon-512x512.png
convert favicon.svg -resize 180x180 apple-touch-icon.png
```

### 使用 Inkscape（需安装）

```bash
# 安装 Inkscape
# macOS
brew install inkscape

# Ubuntu/Debian
sudo apt-get install inkscape

# Windows
# 从官网下载：https://inkscape.org/

# 导出 PNG
inkscape favicon.svg --export-filename=favicon-16x16.png --export-width=16 --export-height=16
inkscape favicon.svg --export-filename=favicon-32x32.png --export-width=32 --export-height=32
inkscape favicon.svg --export-filename=favicon-192x192.png --export-width=192 --export-height=192
inkscape favicon.svg --export-filename=favicon-512x512.png --export-width=512 --export-height=512
inkscape favicon.svg --export-filename=apple-touch-icon.png --export-width=180 --export-height=180
```

## 方法 4：使用 Node.js 脚本

### 安装依赖

```bash
npm install sharp --save-dev
```

### 创建生成脚本

创建 `scripts/generate-icons.js`：

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-192x192.png', size: 192 },
  { name: 'favicon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

const inputFile = path.join(__dirname, '../public/favicon.svg');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  for (const { name, size } of sizes) {
    const outputFile = path.join(outputDir, name);
    await sharp(inputFile)
      .resize(size, size)
      .png()
      .toFile(outputFile);
    console.log(`✅ Generated: ${name}`);
  }
  console.log('🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
```

### 运行脚本

```bash
node scripts/generate-icons.js
```

## 方法 5：使用 Figma/Sketch 导出

### Figma

1. 打开 Figma
2. 创建新文件
3. 创建 512x512 画布
4. 绘制或粘贴图标
5. 选择图层
6. Export → PNG
7. 设置不同倍率导出多个尺寸

### Sketch

1. 打开 Sketch
2. 创建画板（512x512）
3. 绘制图标
4. Export
5. 选择所需尺寸

## 创建 OG Image（社交媒体分享图）

### 推荐尺寸：1200x630

#### 在线工具

1. **Canva** - https://www.canva.com/
   - 搜索 "Open Graph Image"
   - 选择模板
   - 自定义设计
   - 下载为 PNG

2. **Figma**
   - 创建 1200x630 画布
   - 添加 logo、标题、描述
   - 导出为 PNG

#### 设计建议

```
+----------------------------------+
|                                  |
|        🍜 CuisineChat           |
|                                  |
|   Temporary P2P Chat Room        |
|   临时、安全的在线聊天室          |
|                                  |
|   • No Registration              |
|   • File Sharing                 |
|   • Secure & Private             |
|                                  |
+----------------------------------+
```

## 快速检查清单

生成完成后检查：

- [ ] `favicon.svg` - SVG 图标
- [ ] `favicon.ico` - ICO 图标
- [ ] `favicon-16x16.png` - 16x16 PNG
- [ ] `favicon-32x32.png` - 32x32 PNG
- [ ] `favicon-192x192.png` - 192x192 PNG
- [ ] `favicon-512x512.png` - 512x512 PNG
- [ ] `apple-touch-icon.png` - 180x180 PNG
- [ ] `og-image.png` - 1200x630 PNG (可选但推荐)

## 验证图标

### 本地测试

```bash
npm run dev
# 访问 http://localhost:3000
# 查看浏览器标签页图标
```

### 在线验证

- https://realfavicongenerator.net/favicon_checker
- 输入你的网站 URL
- 查看各平台图标显示效果

## 故障排除

### 图标不显示？

1. **清除缓存**
   ```
   Ctrl + Shift + Delete (Chrome)
   Ctrl + F5 (强制刷新)
   ```

2. **检查文件路径**
   ```
   public/favicon.svg ✅
   public/favicon-32x32.png ✅
   ```

3. **检查文件大小**
   - 图标应该小于 100KB
   - SVG 应该小于 10KB

### SVG 没有颜色？

确保 SVG 文件中有 `fill` 或 `stroke` 属性：

```svg
<path fill="#F44336" ... />
```

## 推荐工作流程

**最简单的方法：**

1. 使用 RealFaviconGenerator.net
2. 上传 `favicon.svg`
3. 下载完整包
4. 解压到 `public/`
5. 完成！

**总共只需 5 分钟！** ⏱️



