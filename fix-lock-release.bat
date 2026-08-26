@echo off
rem ============================================================
rem  Ray Player v1.5.0 - Fix package-lock.json overrides + re-trigger CI
rem  Flow: restore lock -> fix overrides -> push main -> move tag -> re-run Release
rem  Usage: fix-lock-release.bat
rem ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "VERSION=1.5.0"
set "BRANCH=main"
set "REMOTE=origin"
set "REPO_URL=https://github.com/lxraytop/rayplayer.git"

echo.
echo ===== [1/7] Check git repo and remote =====
if not exist ".git" (
    git init || goto :fail
    git remote add %REMOTE% %REPO_URL% || goto :fail
)
git remote get-url %REMOTE% >nul 2>&1 || git remote add %REMOTE% %REPO_URL%
echo Remote OK: %REMOTE%

echo.
echo ===== [2/7] Restore package-lock.json from git =====
git checkout -- package-lock.json || goto :fail
echo Restored package-lock.json

echo.
echo ===== [3/7] Fix overrides =====
call :check_overrides
if errorlevel 1 (
    echo overrides missing, try npm offline first...
    npm install --package-lock-only --no-audit --no-fund --offline >nul 2>&1
    if errorlevel 1 (
        echo offline failed, try online (may take minutes)...
        npm install --package-lock-only --no-audit --no-fund || goto :fail
    )
    call :check_overrides
    if errorlevel 1 (
        echo npm did not write overrides, patching manually...
        node -e "const fs=require('fs');const l=JSON.parse(fs.readFileSync('package-lock.json','utf8'));const p=JSON.parse(fs.readFileSync('package.json','utf8'));if(!l.packages)l.packages={};if(!l.packages[''])l.packages['']={};l.packages[''].overrides=p.overrides||{};fs.writeFileSync('package-lock.json',JSON.stringify(l,null,2)+'\n');console.log('overrides patched:',JSON.stringify(p.overrides));" || goto :fail
    )
)

echo.
echo ===== [4/7] Verify overrides =====
call :check_overrides
if errorlevel 1 goto :fail
echo overrides verified [OK]
node -e "const l=require('./package-lock.json'); console.log('  root overrides:', JSON.stringify(l.packages[''].overrides))"

echo.
echo ===== [5/7] Commit and force-push %BRANCH% =====
git add package-lock.json package.json
git commit -m "fix: restore overrides in package-lock.json" >nul 2>&1
if errorlevel 1 ( echo no new commit, continue. ) else ( echo committed. )
git push %REMOTE% HEAD:%BRANCH% --force || goto :fail

echo.
echo ===== [6/7] Move tag v%VERSION% and push =====
git tag -f v%VERSION% || goto :fail
git push %REMOTE% v%VERSION% --force || goto :fail

echo.
echo ===== [7/7] Verify remote =====
git ls-remote %REMOTE% "refs/heads/%BRANCH%" >nul || goto :fail
echo Branch %BRANCH% [OK]
git ls-remote %REMOTE% "refs/tags/v%VERSION%" | findstr /C:"v%VERSION%" >nul || goto :fail
echo Tag v%VERSION% [OK]

echo.
echo Fix done! Release workflow re-triggered by tag v%VERSION%.
echo Watch: https://github.com/lxraytop/rayplayer/actions
exit /b 0

:check_overrides
node -e "const fs=require('fs');const l=JSON.parse(fs.readFileSync('package-lock.json','utf8'));const p=JSON.parse(fs.readFileSync('package.json','utf8'));const a=l.packages&&l.packages['']?l.packages[''].overrides:undefined;process.exit(JSON.stringify(a)===JSON.stringify(p.overrides)?0:1);"
exit /b %errorlevel%

:fail
echo.
echo [X] Fix script failed, check errors above.
exit /b 1
