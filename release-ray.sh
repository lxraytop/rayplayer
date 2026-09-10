#!/usr/bin/env bash
# ============================================================
#  Ray Player v1.5.0 一键发布脚本（Git Bash / Linux / macOS）
#  执行顺序: 提交 → 打 Tag → 推送 Tag → 强制覆盖 main → 打包 exe
#  用法: bash release-ray.sh
# ============================================================
set -euo pipefail   # 任何错误立即终止

VERSION="1.5.0"
REMOTE="origin"
BRANCH="main"
REPO_URL="https://github.com/lxraytop/rayplayer.git"

cd "$(dirname "$0")"

step() { echo; echo "===== [$1/7] $2 ====="; }
fail() { echo; echo "[X] 发布流程失败: $1" >&2; exit 1; }

# ---------- 1. Git 仓库与 remote ----------
step 1 "检查 Git 仓库与 remote"
if [ ! -d .git ]; then
  git init || fail "git init 失败"
  git remote add "$REMOTE" "$REPO_URL" || fail "添加 remote 失败"
  echo "已初始化仓库并添加 remote: $REMOTE -> $REPO_URL"
else
  git remote get-url "$REMOTE" >/dev/null 2>&1 || git remote add "$REMOTE" "$REPO_URL"
  echo "remote OK: $(git remote get-url "$REMOTE")"
fi

# ---------- 2. 提交本地改动 ----------
step 2 "提交本地改动"
git add -A
if git commit -m "chore: release v${VERSION}" >/dev/null 2>&1; then
  echo "已提交: $(git rev-parse --short HEAD)"
else
  echo "无改动可提交（或已是最新），继续"
fi

# ---------- 3. 打标签 ----------
step 3 "打标签 v${VERSION}"
git tag -f "v${VERSION}" || fail "创建 tag 失败"
echo "Tag v${VERSION} -> $(git rev-parse --short "v${VERSION}")"

# ---------- 4. 推送 Tag（会触发 GitHub Actions 构建）----------
step 4 "推送 Tag v${VERSION} 到 ${REMOTE}"
git push "$REMOTE" "v${VERSION}" || fail "推送 Tag 失败，请检查 GitHub 认证（HTTPS PAT 或 SSH key）"

# ---------- 5. 强制覆盖 main 分支 ----------
step 5 "强制覆盖 ${BRANCH} 分支"
git push "$REMOTE" "HEAD:${BRANCH}" --force || fail "强制推送 ${BRANCH} 失败"

# ---------- 6. 验证推送结果 ----------
step 6 "验证推送结果"
git ls-remote "$REMOTE" "refs/tags/v${VERSION}" | grep -q "refs/tags/v${VERSION}" \
  || fail "远端未找到 Tag v${VERSION}"
echo "Tag v${VERSION} 已确认推送成功 [OK]"
git ls-remote "$REMOTE" "refs/heads/${BRANCH}" >/dev/null \
  || fail "远端未找到 ${BRANCH} 分支"
echo "${BRANCH} 分支已确认推送成功 [OK]"

# ---------- 7. 打包 Windows exe ----------
step 7 "打包 Windows exe"
if [ ! -f node_modules/electron/dist/electron.exe ]; then
  echo "electron 二进制缺失，先补装（约 100MB）..."
  node node_modules/electron/install.js || fail "electron 二进制安装失败"
fi
npm run build:electron || fail "electron-builder 打包失败"

if [ -f "release/Ray-Setup-${VERSION}.exe" ]; then
  echo
  echo "============================================"
  echo " 打包成功: release/Ray-Setup-${VERSION}.exe"
  echo "============================================"
  ls -lh "release/Ray-Setup-${VERSION}.exe"
else
  fail "未检测到 release/Ray-Setup-${VERSION}.exe"
fi

echo
echo "发布完成: Tag 已推送、${BRANCH} 已覆盖、exe 已生成。"
echo "GitHub Actions 已配置 tag 触发，将基于 v${VERSION} 自动三平台构建并创建 Release。"
