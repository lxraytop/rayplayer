@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Ray Player v1.2.1 - 完整发布流程
echo   提交代码 → 打标签 → 推送 → 打包 → 上传
echo ============================================
echo.

:: 设置 Node 24
set "PATH=F:\ProjectAI\rayplayer\node24\node-v24.9.0-win-x64;%PATH%"

echo [1/6] 检查环境...
node -v
git --version
echo.

echo [2/6] 构建前端（Electron 模式）...
call npx cross-env ELECTRON=true vite build
if %errorlevel% neq 0 (
    echo ✗ 前端构建失败
    pause
    exit /b 1
)
echo.

echo [3/6] 提交代码...
git add -A
git status --short
git commit -m "feat: Ray Player v1.2.1 - playback optimization and prefetch improvements"
if %errorlevel% neq 0 (
    echo ⚠ 没有需要提交的更改，继续...
)
echo.

echo [4/6] 打标签 v1.2.1...
git tag -f v1.2.1
echo.

echo [5/6] 推送到 GitHub...
git push origin main --tags --force
if %errorlevel% neq 0 (
    echo ✗ Git 推送失败，请检查网络或 SSH 连接
    pause
    exit /b 1
)
echo.

echo [6/6] 打包 Electron 安装包...
:: 关闭可能锁定文件的进程
taskkill /f /im Ray.exe 2>nul
taskkill /f /im "Ray Player.exe" 2>nul
:: 优先使用缓存，跳过下载
set ELECTRON_SKIP_BINARY_DOWNLOAD=1
:: 等待文件释放
timeout /t 2 /nobreak >nul
rmdir /s /q release 2>nul

call npx electron-builder --win
if %errorlevel% neq 0 (
    echo.
    echo ⚠ 缓存打包失败，尝试从 GitHub 下载 Electron...
    set ELECTRON_SKIP_BINARY_DOWNLOAD=
    set "ELECTRON_MIRROR=https://github.com/electron/electron/releases/download/"
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

echo ============================================
echo   ✓ 全部完成！
echo ============================================
echo.
echo   安装包: %EXE_PATH%
echo   GitHub: https://github.com/lxraytop/rayplayer/releases
echo.
echo   上传到 Release:
echo   1. 打开 https://github.com/lxraytop/rayplayer/releases/new
echo   2. Tag 选择 v1.2.1
echo   3. Title: Ray v1.2.1
echo   4. 上传: %EXE_PATH%
echo   5. 点击 Publish release
echo.
echo   或安装 gh CLI 后执行:
echo   gh release create v1.2.1 "%EXE_PATH%" --title "Ray v1.2.1" --notes "Ray Player v1.2.1"
echo ============================================
pause
