@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Ray Player v1.2.0 - 一键启动
echo ============================================
echo.

set "PATH=F:\ProjectAI\rayplayer\node24\node-v24.9.0-win-x64;%PATH%"
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

echo [1/3] 检查 Node.js 版本...
node -v
echo.

if not exist "node_modules\" (
    echo [2/3] 安装依赖...
    call npm install --registry=https://registry.npmmirror.com
) else (
    echo [2/3] 依赖已存在，跳过
)
echo.

echo [3/3] 启动 Vite 开发服务器 + Electron...
echo.
call npx cross-env ELECTRON_DEV=true concurrently -k "npx vite" "npx wait-on tcp:3000 && npx electron ."
pause
