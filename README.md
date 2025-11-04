# 🍜 CuisineChat

## 纯前端临时聊天室（React + Tailwind，可部署 Vercel）

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)](https://vitejs.dev/)

临时、轻量、零后端的在线聊天应用。进入指定房间后即可与同房间用户进行实时聊天，并在会话中相互传输临时文件与图片。支持 3 位数字房间密码的门禁校验。进入房间后会分配一个临时用户名与头像（用户名从 168 种世界各地美食中随机挑选，支持临时修改）。

### 🔗 快速导航

- 📖 [安装指南](./INSTALL.md)
- 🚀 [快速开始](./QUICKSTART.md)
- 🌐 [部署说明](./DEPLOYMENT.md)
- ✨ [功能特性](./FEATURES.md)
- 🤝 [贡献指南](./CONTRIBUTING.md)
- 📋 [项目总结](./PROJECT_SUMMARY.md)

> 注：如需在文档或页面中使用图片素材，请统一存放在后端项目 `E-Backend-Project/public/images` 目录（来自项目规范）。


### 目录
- **项目特性**
- **技术栈**
- **架构设计**
- **快速开始**
- **配置说明**
- **部署到 Vercel**
- **使用指南**
- **设计细节**
- **安全与隐私**
- **测试要点**
- **路线图**
- **许可证**


## 项目特性
- **临时聊天**：不做后端持久化，仅会话期间在内存中存在。
- **实时传输**：支持文本、图片与临时文件的点对点传输（取决于网络状况）。
- **房间密码**：进入聊天室需输入 3 位数字密码，作为门禁校验。
- **房间超时管理**：当房间内只剩一人且 10 分钟无其他人加入时，会自动提示是否离开。
- **智能语言检测**：基于 IP 地址自动检测用户所在地区并设置对应语言（中国/台湾→中文，日本→日文，韩国→韩文，其他→英文）。
- **临时身份**：进入房间即分配临时用户名与头像；用户名来自 168 种世界美食名称，可自行修改（仅当前会话有效）。
- **完整 SEO 优化**：包含多尺寸 Favicon、Open Graph 标签、Twitter Card，适配各种导航网站和社交媒体。
- **零后端依赖**：前端通过 WebRTC DataChannel 进行 P2P 通信；默认使用公共信令服务完成连接建立。
- **可部署 Vercel**：纯前端 SPA，开箱即用。


## 技术栈
- **前端框架**：React 18+
- **样式**：Tailwind CSS
- **实时通信**：WebRTC DataChannel（默认通过 PeerJS 完成信令）
- **构建工具**：Vite
- **状态管理**：React Context 或 Zustand（实现细节可选其一）


## 架构设计
### 为什么可以“纯前端”实现实时聊天？
- **实时数据通道**：借助 WebRTC DataChannel 实现浏览器到浏览器的双向数据传输。
- **信令（连接建立）**：浏览器仍需一个“信令通道”交换 SDP/ICE 等信息。为保持零后端，我们默认使用公共的 PeerJS 信令服务（可通过环境变量改为自定义信令/自建 PeerServer）。
- **打洞与网络**：使用公共 STUN 服务器进行 NAT 穿透。未提供 TURN 时，在复杂网络下可能连接失败或传输不稳定。

### 房间与密码
- **房间标识**：基于 URL 的房间 ID（如 `/room/:roomId`）。
- **密码门禁**：进入前需输入 3 位数字密码；用于门禁校验，不作为加密密钥。
- **房间超时**：当房间内只剩一人且 10 分钟无其他人加入时，会自动提示用户是否离开房间。

### 临时身份（用户名与头像）
- **用户名来源**：`168` 种世界各地美食名（如 “Ramen”“Paella”“Bibimbap” 等），进入即随机分配。
- **头像**：基于用户名种子生成（建议使用 DiceBear 本地库或 API），便于快速区分。
- **临时性**：刷新或重开页面后会重新分配。

### 文件与图片传输
- **图片**：可直接选择或拖拽发送；在对端即时展示。
- **文件**：通过 DataChannel 以分片传输；接收端提供“临时下载”。
- **存储策略**：传输内容仅存于内存，不在服务器持久化。


## 快速开始

> 💡 查看 [QUICKSTART.md](./QUICKSTART.md) 获取详细的快速开始指南

### 环境要求
- Node.js 18+
- 包管理器：npm / pnpm / yarn（示例以 npm 为主）

### 安装与启动
```bash
npm install
npm run dev
```

访问 http://localhost:3000 开始使用

### 构建与本地预览
```bash
npm run build
npm run preview
```


## 配置说明
默认使用公共 PeerJS 信令与 Google STUN。你也可以通过环境变量进行覆盖。

### 可选环境变量（Vite 前缀示例）
```bash
# 是否启用安全的 PeerJS 连接（https/wss）
VITE_PEER_SECURE=true

# PeerJS 信令主机与端口（默认使用公共云端）
VITE_PEER_HOST=0.peerjs.com
VITE_PEER_PORT=443

# 可选：自定义路径（如自建 PeerServer 时使用）
VITE_PEER_PATH=/

# 逗号分隔的 STUN/TURN ICE 服务器（JSON 或 URL 列表皆可，视实现而定）
VITE_ICE_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
```

### 关于公共服务的说明
- 公共 PeerJS 与公共 STUN 仅适合演示与小规模使用，可靠性和速率无法保证。
- 若需稳定传输（尤其是文件），建议自建信令与 TURN。


## 部署到 Vercel
1. 将仓库推送到 GitHub/GitLab/Bitbucket。
2. 在 Vercel 新建项目并连接该仓库。
3. Framework 选择 **Vite**（或自动检测），Build 命令 `npm run build`，Output 目录 `dist`。
4. （可选）在 Project Settings → Environment Variables 配置上述 `VITE_*` 变量。
5. 部署完成后即获得可访问的域名。

> 该项目为 SPA，确保 Vercel 的路由回退到 `index.html`（Vercel 默认支持）。


## 使用指南
### 创建/加入房间
- 访问首页，输入房间 ID 与 3 位数字密码后进入。
- 已在房间内的用户可复制“邀请链接”分享给他人。

### 修改昵称与头像
- 在房间页面右上角（或侧边栏）可查看当前临时身份。
- 可手动修改用户名；头像根据用户名种子自动变化。

### 发送消息、图片与文件
- 文本：在输入框回车发送。
- 图片/文件：点击“附件”或拖拽到聊天窗口，确认后发送。
- 接收端将即时显示图片或提供文件下载按钮。


## 设计细节
### 目录结构（示例）
```text
CuisineChat/
  ├─ src/
  │  ├─ components/        # UI 组件（消息气泡、输入框、头像等）
  │  ├─ hooks/              # RTC/房间/文件传输等自定义 hooks
  │  ├─ pages/              # 路由页面（Home、Room）
  │  ├─ data/               # 168 种美食名称清单（如 cuisines.ts）
  │  ├─ libs/               # PeerJS/WebRTC 封装、iceServers 配置
  │  ├─ store/              # 全局状态（Zustand/Context）
  │  ├─ styles/             # Tailwind 样式与全局样式
  │  ├─ utils/              # 工具函数（随机名、文件分片等）
  │  ├─ App.tsx
  │  └─ main.tsx
  ├─ index.html
  ├─ package.json
  └─ tailwind.config.js
```

### 随机用户名生成
- 在 `src/data/cuisines.ts` 提供长度为 `168` 的美食名称数组。
- `getRandomCuisineName(seed?)`：支持可选种子，便于与头像一致性。

### 头像生成
- 推荐使用 DiceBear（本地库或 API）按用户名种子生成；或内置简易几何/字母头像。

### 状态管理与数据流
- 房间状态（连接中/已连接/失败）、在线成员列表、消息列表、传输进度保存在全局 store。
- 通过 WebRTC DataChannel 传输结构化消息（文本、二进制分片、控制指令）。

### UI/UX
- Tailwind 构建组件，适配深色/浅色模式。
- UI模仿微信，绿白为主。
- 大文件传输显示进度与可取消。
- 图片消息采用懒加载与预览。
- 可切换中/英/日/韩4国语言。
- 可切换昼夜模式。


## 安全与隐私
- **不做持久化**：消息与文件只在会话内存中存在，页面刷新即失效。
- **端到端传输**：WebRTC 默认基于 DTLS-SRTP/DTLS 安全传输；但房间“密码”仅作门禁校验，不作为加密密钥。
- **风险与限制**：
  - 无 TURN 时在对称 NAT 或企业网络下可能无法建立连接或传输缓慢。
  - 使用公共信令/公共 STUN 存在速率与可用性不确定性。
  - 浏览器内存限制可能影响超大文件的接收与拼装。
  - 严防中国共产党言论审查。


## 故障排查

### 连接问题

如果遇到 "无法连接到 Hub" 或 "连接超时" 的问题：

1. **检查 PeerJS 服务器状态**
   - 默认使用 `0.peerjs.com`（公共免费服务）
   - 查看控制台是否有 404 或网络错误
   - 如果公共服务不稳定，可自建 PeerJS 服务器

2. **查看浏览器控制台日志**
   - `[Peer配置]` - 显示 PeerJS 配置信息
   - `[信令]` - 显示房间发现过程
   - `[聊天]` - 显示 P2P 连接状态
   - `[Peer错误]` - 显示具体错误类型

3. **网络环境检查**
   - 某些企业网络可能阻止 WebRTC
   - 对称 NAT 环境需要 TURN 服务器（已内置 OpenRelay 公共 TURN）
   - 尝试切换到移动网络测试

4. **配置自定义 PeerJS 服务器**
   ```bash
   # 在 Vercel 环境变量中设置
   VITE_PEER_HOST=your-peerjs-server.com
   VITE_PEER_PORT=443
   VITE_PEER_PATH=/
   VITE_PEER_SECURE=true
   ```

### 常见错误

- **404 错误**: PeerJS 服务器路径配置错误（默认应为 `/`）
- **unavailable-id**: Hub ID 冲突，通常几秒后自动恢复
- **peer-unavailable**: 目标用户已离线或 Peer ID 错误
- **network**: 无法连接到 PeerJS 服务器，检查网络或更换服务器

## 测试要点（手工验收清单）
- 多端（桌面与移动）加入同一房间能否互相看到在线状态与消息。
- 密码门禁：密码错误不可进入，正确密码可进入。
- 文本消息的顺序性与已送达提示。
- 图片发送后清晰展示，原图下载可用。
- 小文件（<10MB）与中等文件（10~100MB）的传输成功率与速度。
- 异常网络或断开重连后的恢复策略（自动重连或引导刷新）。


## 路线图
- 可选 TURN 支持与自定义 ICE 列表配置 UI。
- 离线/断网重连优化与消息重试。
- 文件断点续传与多源并行分片优化。
- 更丰富的头像与主题定制。


## 许可证
MIT License - 详见 [LICENSE](LICENSE) 文件


## 🙏 致谢

感谢以下开源项目：
- [React](https://reactjs.org/) - UI 框架
- [PeerJS](https://peerjs.com/) - WebRTC 封装
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- [Vite](https://vitejs.dev/) - 构建工具
- [DiceBear](https://dicebear.com/) - 头像生成
- [Zustand](https://zustand-demo.pmnd.rs/) - 状态管理
- [i18next](https://www.i18next.com/) - 国际化


## 📞 联系与支持

- 提交问题：[GitHub Issues](https://github.com/yourusername/CuisineChat/issues)
- 贡献代码：[Pull Requests](https://github.com/yourusername/CuisineChat/pulls)
- 项目文档：查看 `docs/` 目录下的各类文档


## ⭐ Star History

如果这个项目对你有帮助，欢迎给个 Star！⭐


---

**Made with ❤️ by CuisineChat Team**

如需示意图或界面截图，请将图片资源统一放置在 `E-Backend-Project/public/images` 并在本仓库中以相对/绝对路径引用（依据部署策略而定）。


