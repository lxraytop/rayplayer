<p align="center">
  <img src="/img/head2.png" alt="Ray" width="100%" />
</p>

<div align="center">

# Ray

Lyrics Reimagined // 辞曲新境

[![GitHub release](https://img.shields.io/github/v/release/lxraytop/rayplayer?label=release)](https://github.com/lxraytop/rayplayer/releases)
[![License](https://img.shields.io/github/license/lxraytop/rayplayer)](https://github.com/lxraytop/rayplayer/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/lxraytop/rayplayer?style=social)](https://github.com/lxraytop/rayplayer/stargazers)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Discord](https://img.shields.io/discord/1541051241822687232?logo=discord&logoColor=white&label=Join%20our%20Discord)](https://discord.gg/dMDBTHxeKd)

[获取方式](https://github.com/lxraytop/rayplayer#%E8%8E%B7%E5%8F%96%E6%96%B9%E5%BC%8F)
·
[使用指南](https://folia-site.cielaniska.top/guide/)
·
[技术说明](docs/technical.md)

</div>

## 项目简介

Ray 是一款以全屏沉浸式歌词播放为核心的在线音乐播放器，支持网易云、酷狗、Navidrome 与本地音乐库，通过智能歌词匹配、AI 生成配色主题与多种全屏歌词动画，提供独特的听歌体验。

提供 Windows / macOS / Linux 桌面端（Electron）与 Web 版本，支持多平台部署。

## 核心能力

| 模块 | 说明 |
| --- | --- |
| 在线搜索与播放 | 搜索歌曲、歌手或专辑即可播放，自动加载封面与歌词。 |
| 本地音乐支持 | 导入本地音频，本地保存索引，不上传文件；详见 [本地音乐库管理](docs/local-library-management.md)。 |
| 智能歌词匹配 | 本地歌曲自动匹配在线歌词与封面，支持手动修正；识别 `.lrc` / `.vtt` / `.ttml` / `.qrc` / `.yrc` / `.krc` 及 LDDC 逐字格式。 |
| Now Playing 接入 | 通过 [Now Playing](https://github.com/Widdit/now-playing-service/) 接入外部播放器，驱动舞台视图与全屏歌词。 |
| AI 主题生成 | 基于歌曲情绪与歌词内容生成沉浸式背景与视觉参数。 |
| 多端体验 | 支持 Web 部署与桌面端打包分发。 |

## 获取方式

- **桌面端**：前往 [Releases](https://github.com/lxraytop/rayplayer/releases/latest) 下载 Windows / macOS / Linux 安装包；Arch Linux 用户可通过 AUR 安装 `ray-player-bin`。
- **Web 端**：阅读 [Vercel 部署指南](https://folia-site.cielaniska.top/guide/deploy-vercel) 一键部署，或参考 [QQ 音乐部署指南](docs/qq-music-deployment.md) 与 [Docker Compose 全栈部署](deploy/docker/README.md)。
- **Sync Server**：可选同步服务，用于多设备同步外观与 AI 主题库，支持 Cloudflare Workers / Docker / Node.js 自托管，详见 [部署指南](https://folia-site.cielaniska.top/guide/deploy-sync)。

## 文档与开发

使用说明见 [Ray Guide](https://folia-site.cielaniska.top/guide/)；部署、环境变量、本地开发、Stage API 与技术栈见 [技术与开发说明](docs/technical.md)。

## Community

加入 [Discord 社群](https://discord.gg/dMDBTHxeKd) 交流与获取帮助。

## 贡献者

感谢所有贡献者（Issue、Bug 报告、建议、测试与代码），贡献记录见 [贡献者名单](CONTRIBUTORS.md)。

## 法律与免责声明

本项目在 AI 的广泛协助下开发，可能存在细微问题。项目主要用于展示播放动效、界面设计与相关工程实现，涉及的在线音乐流媒体、歌词、封面等版权归对应权利人所有。本仓库及源码仅供个人学习、技术交流与非营利测试使用，请勿商用。请尊重数字版权，并通过官方平台支持正版音乐。

## 致谢

感谢以下项目：[chenmozhijin/LDDC](https://github.com/chenmozhijin/LDDC)、[NeteaseCloudMusicApiEnhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)、[chenglou/pretext](https://github.com/chenglou/pretext)、[MakcRe/KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi)、[paper-design/shaders](https://github.com/paper-design/shaders)、[yakult-green-tea/qq-music-api](https://github.com/yakult-green-tea/qq-music-api)、[amll-ttml-db](https://github.com/amll-dev/amll-ttml-db)。

## 许可证

本项目基于 `AGPL-3.0` 许可证开源。
