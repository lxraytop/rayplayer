@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Ray Player v1.2.1 - 打包安装包
echo ============================================
echo.

set "PATH=F:\ProjectAI\rayplayer\node24\node-v24.9.0-win-x64;%PATH%"
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo [1/4] 检查 Node.js 版本...
node -v
echo.

echo [2/4] 安装依赖...
call npm install --registry=https://registry.npmmirror.com
if %errorlevel% neq 0 (
    echo ✗ 依赖安装失败
    pause
    exit /b 1
)
echo.

echo [3/4] 构建前端（Electron 模式）...
call npx cross-env ELECTRON=true vite build
if %errorlevel% neq 0 (
    echo ✗ 前端构建失败
    pause
    exit /b 1
)
echo.

echo [4/4] 打包 Electron 安装包...
call npx electron-builder
if %errorlevel% neq 0 (
    echo ✗ Electron 打包失败
    pause
    exit /b 1
)
echo.

echo ============================================
echo   ✓ 打包完成！输出目录: release\
echo ============================================
dir /b release\*.exe 2>nul
echo.
pause
