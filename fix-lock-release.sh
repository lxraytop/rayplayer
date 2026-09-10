#!/usr/bin/env bash
# ============================================================
#  Ray Player v1.5.0 — 修复 package-lock.json overrides 缺失并重触发 CI
#  背景: 提交的 lock 缺 overrides 字段导致 npm ci 失败
#  流程: 恢复 lock → 补 overrides → 提交推送 main → 更新 tag 重触发 Release
#  用法: bash fix-lock-release.sh
# ============================================================
set -euo pipefail

VERSION="1.5.0"
BRANCH="main"
REMOTE="origin"
REPO_URL="https://github.com/lxraytop/rayplayer.git"

cd "$(dirname "$0")"

step() { echo; echo "===== [$1/7] $2 ====="; }
fail() { echo; echo "[X] 脚本失败: $1" >&2; exit 1; }

# ---------- 1. Git 仓库与 remote ----------
step 1 "检查 Git 仓库与 remote"
if [ ! -d .git ]; then
  git init || fail "git init 失败"
  git remote add "$REMOTE" "$REPO_URL" || fail "添加 remote 失败"
fi
git remote get-url "$REMOTE" >/dev/null 2>&1 || git remote add "$REMOTE" "$REPO_URL"
echo "remote OK: $(git remote get-url "$REMOTE")"

# ---------- 2. 恢复 package-lock.json ----------
step 2 "从 git 恢复 package-lock.json（丢弃本地被覆盖的内容）"
if git ls-files --error-unmatch package-lock.json >/dev/null 2>&1; then
  git checkout -- package-lock.json || fail "恢复 package-lock.json 失败"
  echo "已恢复（$(git log -1 --format=%h -- package-lock.json)）"
else
  fail "package-lock.json 未被 git 跟踪，无法恢复，请手动处理"
fi

# ---------- 3. 检查并修复 overrides ----------
step 3 "检查 overrides 是否缺失"
overrides_ok() {
  node -e "
    const fs = require('fs');
    const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const l = lock.packages && lock.packages[''] ? lock.packages[''].overrides : undefined;
    const p = pkg.overrides;
    process.exit(JSON.stringify(l) === JSON.stringify(p) ? 0 : 1);
  "
}

if overrides_ok; then
  echo "overrides 已存在且与 package.json 一致，跳过修复"
else
  echo "overrides 缺失或不一致，尝试重新生成 lock..."
  # 优先离线增量更新（快），失败则联网
  if npm install --package-lock-only --no-audit --no-fund --offline >/dev/null 2>&1; then
    echo "离线更新 lock 完成"
  else
    echo "离线更新失败，尝试联网更新（可能需要几分钟）..."
    npm install --package-lock-only --no-audit --no-fund || fail "npm 更新 lock 失败"
  fi

  if overrides_ok; then
    echo "overrides 已由 npm 写入"
  else
    echo "npm 未写入 overrides，手动补齐..."
    node -e "
      const fs = require('fs');
      const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (!lock.packages) lock.packages = {};
      if (!lock.packages['']) lock.packages[''] = {};
      lock.packages[''].overrides = pkg.overrides || {};
      fs.writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
      console.log('overrides 已手动补入:', JSON.stringify(pkg.overrides));
    " || fail "手动补 overrides 失败"
  fi
fi

# ---------- 4. 最终验证 ----------
step 4 "验证 overrides"
overrides_ok || fail "overrides 仍未写入 package-lock.json"
echo "overrides 验证通过 [OK]"
node -e "const l=require('./package-lock.json'); console.log('  根 overrides:', JSON.stringify(l.packages[''].overrides))"

# ---------- 5. 提交并推送 main ----------
step 5 "提交并强制推送 ${BRANCH}"
git add package-lock.json package.json
if git commit -m "fix: restore overrides in package-lock.json" >/dev/null 2>&1; then
  echo "已提交: $(git rev-parse --short HEAD)"
else
  echo "无新增提交（可能内容未变化），继续"
fi
git push "$REMOTE" "HEAD:${BRANCH}" --force || fail "推送 ${BRANCH} 失败，请检查 GitHub 认证"

# ---------- 6. 更新 tag 并推送（重新触发 CI）----------
step 6 "移动 v${VERSION} 标签并推送"
git tag -f "v${VERSION}" || fail "创建 tag 失败"
git push "$REMOTE" "v${VERSION}" --force || fail "推送 tag 失败"

# ---------- 7. 验证远程状态 ----------
step 7 "验证远程 main 与 tag"
git ls-remote "$REMOTE" "refs/heads/${BRANCH}" | grep -q "refs/heads/${BRANCH}" || fail "${BRANCH} 未推送成功"
echo "${BRANCH} 分支 [OK]"
git ls-remote "$REMOTE" "refs/tags/v${VERSION}" | grep -q "refs/tags/v${VERSION}" || fail "tag v${VERSION} 未推送成功"
echo "tag v${VERSION} [OK]"
git ls-remote "$REMOTE" "refs/tags/v${VERSION}" | awk '{print "  tag 指向:", substr($1,1,12)}'

echo
echo "修复完成！Release workflow 已由 tag v${VERSION} 重新触发。"
echo "查看进度: https://github.com/lxraytop/rayplayer/actions"
