# Ray Player 项目管理文档

> 项目仓库：`lxraytop/rayplayer`
> 最后更新：2026-07-25

---

## 一、开发环境搭建

### 1.1 前置要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 24.0.0 | 必须使用 Node.js 24+，项目在 `package.json` 中声明 `engines.node >= 24.0.0` |
| npm | >= 11.x | 随 Node.js 24 自带 |
| Git | 最新稳定版 | 用于版本控制和协作 |
| Python | >= 3.10 | 仅部分脚本需要（歌词处理等） |

### 1.2 克隆与安装

```bash
# 克隆仓库
git clone git@github.com:lxraytop/rayplayer.git
cd rayplayer

# 安装依赖（确保使用 Node.js 24+）
node --version  # 应输出 v24.x.x
npm install
```

### 1.3 环境变量

复制 `.env.example` 为 `.env.local` 并根据需要配置：

```bash
cp .env.example .env.local
```

关键环境变量：

| 变量 | 说明 |
|------|------|
| `VITE_NETEASE_API_BASE` | 网易云 API 地址（默认 http://localhost:3000） |
| `VITE_KUGOU_API_BASE` | 酷狗 API 地址（可选） |
| `GEMINI_API_KEY` | Google Gemini API Key（AI 主题生成） |
| `OPENAI_API_KEY` / `OPENAI_API_URL` | OpenAI 兼容 API 配置（备选） |

### 1.4 核心依赖说明

| 依赖 | 版本 | 说明 |
|------|------|------|
| `electron` | ^43.1.1 | 桌面端框架，需要 Node.js 24+ |
| `electron-builder` | ^26.15.3 | 打包工具，支持 Windows/macOS/Linux |
| `electron-updater` | ^6.8.9 | 自动更新组件 |
| `react` / `react-dom` | ^19.2.7 | UI 框架 |
| `vite` | ^8.1.5 | 构建工具 |
| `typescript` | ~7.0.2 | 类型系统 |
| `three` | ^0.185.1 | 3D 渲染引擎 |
| `@react-three/fiber` | ^9.6.1 | React Three.js 集成 |
| `@google/genai` | ^2.12.0 | AI 主题生成 |
| `dexie` | ^4.4.4 | IndexedDB 封装 |
| `zustand` | ^5.0.14 | 状态管理 |

**兼容性注意**：上述版本要求较新，请确保开发环境满足最低版本约束。升级依赖时务必运行全量测试。

---

## 二、本地开发

### 2.1 常用命令

```bash
# 启动 Web 开发服务器（默认 http://localhost:3000）
npm run dev

# TypeScript 类型检查
npm run typecheck

# 运行单元测试（Vitest）
npm test

# 运行 UI 截图测试（Playwright）
npm run test:ui

# 构建 Web 版本
npm run build

# 启动 Electron 桌面端开发
npm run dev:electron

# 构建 Electron 桌面端
npm run build:electron

# 启动 OBS Stage Client 开发
npm run stage:client

# 歌词解析性能基准测试
npm run benchmark:lyrics

# 歌词手动测试 CLI
npm run manual:lyrics
```

### 2.2 项目结构

```
ray-player/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   │   ├── app/            # 应用主体
│   │   ├── modal/          # 弹窗与设置
│   │   ├── ray-grid/       # 网格视图组件
│   │   ├── visualizer/     # 可视化渲染器
│   │   └── ...
│   ├── hooks/              # React Hooks
│   ├── services/           # 业务服务层
│   │   ├── sync/           # 多设备同步
│   │   ├── onlineMusic/    # 在线音乐提供商
│   │   └── ...
│   ├── stores/             # Zustand 状态管理
│   ├── utils/              # 工具函数
│   │   └── lyrics/         # 歌词解析引擎
│   └── i18n/               # 国际化（zh-CN / en / in）
├── electron/               # Electron 主进程
├── sync-server/            # 同步服务端
├── packaging/              # 打包配置
│   ├── linux/              # Linux .desktop 文件
│   └── aur/                # Arch Linux AUR 包
├── test/                   # 测试
│   ├── unit/               # 单元测试
│   ├── ui/                 # Playwright UI 测试
│   └── manual/             # 手动测试脚本
├── docs/                   # 文档
├── skills/                 # AI 技能定义
├── worker/                 # Cloudflare Worker
├── api/                    # Serverless API 函数
├── api-ts/                 # API TypeScript 源码
├── shared/                 # 前后端共享代码
└── build/                  # 构建资源（图标等）
```

### 2.3 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 19, TypeScript 7 |
| 构建工具 | Vite 8 |
| CSS | Tailwind CSS 4 |
| 状态管理 | Zustand 5 |
| 3D 渲染 | Three.js, React Three Fiber |
| 桌面端 | Electron 43 |
| 测试 | Vitest, Playwright |
| 数据库 | IndexedDB (Dexie) |
| 同步服务 | Cloudflare Workers/D1, Docker |
| AI | Google Gemini, OpenAI 兼容 API |
| 音乐 API | 网易云、酷狗、Navidrome |

---

## 三、构建与打包

### 3.1 Web 版本构建

```bash
npm run build
```

构建产物位于 `dist/` 目录。可部署到 Vercel、Cloudflare Pages 或任何静态文件服务器。

### 3.2 Electron 桌面端打包

```bash
# 打包当前平台
npm run build:electron

# 仅 Linux 目录输出（调试用）
npm run build:electron:dir
```

构建产物位于 `release/` 目录，包含：
- Windows: `Ray-Setup-x.x.x.exe`
- macOS: `Ray-x.x.x-arm64.dmg` / `Ray-x.x.x-x64.dmg`
- Linux: `ray-player-x.x.x-linux-x64.tar.gz` / `.deb` / `.rpm`

### 3.3 构建配置说明

- `electron-builder` 配置在 `package.json` 的 `build` 字段
- 应用 ID：`top.lxray.player`
- 图标：`build/icon.png`（512×512 PNG）
- 代码签名：未配置（如需分发到 macOS App Store 需添加）

---

## 四、版本发布流程

### 4.1 发布准备

1. 确保所有测试通过：
   ```bash
   npm test        # 单元测试
   npm run test:ui # UI 截图测试
   npm run typecheck
   ```

2. 更新版本号：
   ```bash
   # 编辑 package.json 中的 version 字段
   # 同时更新 sync-server/package.json 中的版本
   ```

3. 创建 Release 标签：
   ```bash
   git tag v0.6.2
   git push origin v0.6.2
   ```

### 4.2 GitHub Actions 自动发布

推送标签后，GitHub Actions 会自动触发构建：

- `.github/workflows/electron-release.yml` — 正式版构建
- `.github/workflows/canary-pre-release.yml` — Canary 预发布版
- `.github/workflows/release-candidate.yml` — 候选发布版

需要在 GitHub Secrets 中配置：
- `GH_TOKEN` — GitHub Personal Access Token（用于发布 Release）

### 4.3 发布频道

| 频道 | 标签 | 说明 |
|------|------|------|
| Realeco | `latest` | 正式版（稳定） |
| Limo | `limo` | Beta 滚动发布 |
| Cielo | `cielo` | Alpha 滚动发布 |

### 4.4 自动更新

自动更新由 `electron-updater` 驱动，配置如下：

- **Releases URL**：`https://github.com/lxraytop/rayplayer/releases`
- **更新检测**：通过 GitHub API 检测最新 Release
- **更新频道**：用户在应用设置中可选择 Realeco / Limo / Cielo

更新策略：
- 发布新版本时，GitHub Actions 自动上传安装包到 Release Assets
- `electron-updater` 检测到新版本后自动下载并提示安装
- Linux 的 `publishAutoUpdate` 默认关闭（由各发行版包管理器管理）

---

## 五、Sync Server 部署

### 5.1 Cloudflare Workers（推荐）

```bash
cd sync-server
npm install
npx wrangler deploy
```

需要配置：
- Cloudflare D1 数据库
- `wrangler.toml` 中的 `RAY_SYNC_DB` 绑定
- 环境变量 `SYNC_TOKEN`（用于客户端认证）

### 5.2 Docker 部署

```bash
cd sync-server
docker-compose up -d
```

### 5.3 Node.js 自托管

```bash
cd sync-server
npm install
bash install.sh  # Linux/macOS
# 或
powershell install.ps1  # Windows
```

### 5.4 客户端配置

在 Ray Player 的「存储设置」中填写：
- **服务端地址**：`https://your-domain.com` 或 `http://localhost:8787`
- **Sync Token**：与服务端配置的 `SYNC_TOKEN` 一致

---

## 六、CI/CD 工作流

### 6.1 可用工作流

| 文件 | 触发条件 | 说明 |
|------|----------|------|
| `pr-unit-tests.yml` | PR 到 main | 运行单元测试和类型检查 |
| `electron-release.yml` | 推送 v* 标签 | 构建并发布正式版 |
| `canary-pre-release.yml` | 定时 / 手动 | 构建 Canary 预发布 |
| `nightly-pre-release.yml` | 每日定时 | Nightly 构建 |
| `release-candidate.yml` | 推送 rc* 分支 | 候选发布版构建 |
| `sync-server-docker-publish.yml` | 推送到 main | 构建并推送 Docker 镜像 |

### 6.2 环境变量配置

在 GitHub Settings → Secrets and variables → Actions 中配置：

| Secret | 说明 |
|--------|------|
| `GH_TOKEN` | GitHub Personal Access Token（发布 Release 必需） |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（同步服务端部署） |

---

## 七、贡献指南

### 7.1 代码规范

- 使用 TypeScript 严格模式
- 遵循项目现有的代码风格（见 `.editorconfig`）
- 组件文件放在 `src/components/` 对应子目录
- 新功能需要配套单元测试

### 7.2 提交流程

1. Fork 仓库并创建功能分支
2. 运行 `npm run typecheck` 确保类型正确
3. 运行 `npm test` 确保测试通过
4. 提交 PR 到 `main` 分支

### 7.3 测试要求

- 单元测试使用 Vitest
- UI 截图测试使用 Playwright
- 新增功能必须包含测试覆盖
- 恢复已有测试快照：`npm run test:ui:update`

---

## 八、常见问题

### Q: 构建提示 Node.js 版本不匹配？
```bash
# 确保使用 Node.js 24+ 并检查
node --version  # 应 >= v24.0.0
```

### Q: Electron 启动崩溃？
```bash
# Windows: 确保安装了 Visual C++ Redistributable
# Linux: 尝试不同图形模式
npm run dev:electron:dist:swiftshader  # AppImage 环境
npm run dev:electron:dist:software     # 软件渲染回退
```

### Q: 同步服务连接失败？
- 检查服务端地址和 `SYNC_TOKEN` 是否正确
- 确认服务端正常运行（访问 `/health` 端点）
- 检查防火墙/CORS 设置

### Q: 网易云 API 无法连接？
- 确认本地或远程 API 服务正在运行
- 检查 `VITE_NETEASE_API_BASE` 环境变量
- 可自行部署 [NeteaseCloudMusicApiEnhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)

### Q: 如何更新 AUR 包？
```bash
# 修改 packaging/aur/ray-player-bin/PKGBUILD
# 更新 pkgver, sha256sums
# 然后推送更新
```

---

## 九、许可证

本项目基于 **AGPL-3.0** 许可证开源。任何基于本项目的二次分发或修改必须同样以 AGPL-3.0 开源。
