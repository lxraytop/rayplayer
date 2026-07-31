@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Ray Player v1.2.1 - 发布脚本
echo   构建安装包 + 推送 GitHub + 创建 Release
echo ============================================
echo.

:: 设置 Node 24
set "PATH=F:\ProjectAI\rayplayer\node24\node-v24.9.0-win-x64;%PATH%"

:: 设置国内镜像（如果 404 会自动回退到 GitHub）
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo [1/5] 检查环境...
node -v
git --version
echo.

echo [2/5] 构建前端（Electron 模式）...
call npx cross-env ELECTRON=true vite build
if %errorlevel% neq 0 (
    echo ✗ 前端构建失败
    pause
    exit /b 1
)
echo.

echo [3/5] 打包 Electron 安装包...
call npx electron-builder --win
if %errorlevel% neq 0 (
    echo.
    echo ⚠ 镜像下载失败，回退到 GitHub 直连重试...
    set ELECTRON_MIRROR=
    set ELECTRON_BUILDER_BINARIES_MIRROR=
    rmdir /s /q release 2>nul
    call npx electron-builder --win
    if %errorlevel% neq 0 (
        echo ✗ Electron 打包失败
        pause
        exit /b 1
    )
)
echo.

:: 查找生成的 exe
set EXE_PATH=
for %%f in (release\Ray-Setup-*.exe) do set EXE_PATH=%%f
if not defined EXE_PATH (
    echo ✗ 未找到安装包
    pause
    exit /b 1
)
echo ✓ 安装包: %EXE_PATH%
echo.

echo [4/5] 推送到 GitHub...
git push -u origin main --force --tags
if %errorlevel% neq 0 (
    echo ⚠ Git 推送失败，请手动执行: git push -u origin main --force --tags
    echo.
)
echo.

echo [5/5] 创建 GitHub Release...
gh --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ 未安装 GitHub CLI (gh)
    echo.
    echo 请手动创建 Release:
    echo   1. 打开 https://github.com/lxraytop/rayplayer/releases/new
    echo   2. Tag 选择 v1.2.1
    echo   3. Title: Ray v1.2.1
    echo   4. 上传: %EXE_PATH%
    echo   5. 点击 Publish release
    echo.
    echo 或安装 gh: https://cli.github.com/
    echo 安装后执行:
    echo   gh auth login
    echo   gh release create v1.2.1 %EXE_PATH% --title "Ray v1.2.1" --notes "Ray Player v1.2.1 正式版"
) else (
    call gh release create v1.2.1 "%EXE_PATH%" --title "Ray v1.2.1" --notes "Ray Player v1.2.1 正式版"
    if %errorlevel% neq 0 (
        echo ⚠ Release 创建失败（可能已存在），尝试上传资源...
        call gh release upload v1.2.1 "%EXE_PATH%" --clobber
    )
)
echo.

echo ============================================
echo   ✓ 完成！
echo   安装包: %EXE_PATH%
echo   GitHub: https://github.com/lxraytop/rayplayer/releases
echo ============================================
pause
