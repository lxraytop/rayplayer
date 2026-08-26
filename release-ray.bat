@echo off
rem ============================================================
rem  Ray Player v1.5.0 Release Script (Windows CMD)
rem  Order: commit -> tag -> push tag -> force-push main -> build exe
rem  Usage: release-ray.bat
rem ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "VERSION=1.5.0"
set "REMOTE=origin"
set "BRANCH=main"
set "REPO_URL=https://github.com/lxraytop/rayplayer.git"

echo.
echo ===== [1/7] Check git repo and remote =====
if not exist ".git" (
    git init || goto :fail
    git remote add %REMOTE% %REPO_URL% || goto :fail
    echo Initialized repo, remote %REMOTE% -^> %REPO_URL%
) else (
    git remote get-url %REMOTE% >nul 2>&1 || git remote add %REMOTE% %REPO_URL%
    echo Remote OK: %REMOTE%
)

echo.
echo ===== [2/7] Commit local changes =====
git add -A
git commit -m "chore: release v%VERSION%" >nul 2>&1
if errorlevel 1 (
    echo Nothing to commit or commit failed, continue.
) else (
    echo Committed.
)

echo.
echo ===== [3/7] Create tag v%VERSION% =====
git tag -f v%VERSION% || goto :fail
echo Tag v%VERSION% created.

echo.
echo ===== [4/7] Push tag v%VERSION% =====
git push %REMOTE% v%VERSION% || goto :fail

echo.
echo ===== [5/7] Force-push %BRANCH% =====
git push %REMOTE% HEAD:%BRANCH% --force || goto :fail

echo.
echo ===== [6/7] Verify push results =====
git ls-remote %REMOTE% "refs/tags/v%VERSION%" | findstr /C:"v%VERSION%" >nul || goto :fail
echo Tag v%VERSION% verified on remote [OK]
git ls-remote %REMOTE% "refs/heads/%BRANCH%" >nul || goto :fail
echo Branch %BRANCH% verified on remote [OK]

echo.
echo ===== [7/7] Build Windows exe =====
if not exist "node_modules\electron\dist\electron.exe" (
    echo electron binary missing, installing...
    node node_modules\electron\install.js || goto :fail
)
call npm run build:electron || goto :fail
if exist "release\Ray-Setup-%VERSION%.exe" (
    echo.
    echo ============================================
    echo  Build OK: release\Ray-Setup-%VERSION%.exe
    echo ============================================
) else (
    echo [X] Ray-Setup-%VERSION%.exe not found in release\
    goto :fail
)

echo.
echo Release done: tag pushed, %BRANCH% overwritten, exe built.
echo GitHub Actions will build 3 platforms and create a Release from v%VERSION%.
exit /b 0

:fail
echo.
echo [X] Release flow failed, check errors above.
exit /b 1
