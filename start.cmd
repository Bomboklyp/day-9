@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
for /d %%N in ("%~dp0.tools\node-v*-win-x64") do set "PATH=%%~fN;%PATH%"
for /d %%N in ("%~dp0..\.tools\node-v*-win-x64") do set "PATH=%%~fN;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js LTS is required: https://nodejs.org/
  echo Install Node.js 24.15 or later, then run this file again.
  pause
  exit /b 1
)
set "NUXT_TELEMETRY_DISABLED=1"
set "DEBUG="
if /i "%~1"=="--check" (
  node --version
  exit /b 0
)
if not exist "node_modules\nuxt\package.json" (
  echo Installing project dependencies...
  call npm.cmd ci --no-audit --no-fund
  if errorlevel 1 (
    echo Installation failed. Check your internet connection.
    pause
    exit /b 1
  )
)
call npm.cmd run db:local
if errorlevel 1 (
  echo Database setup failed. See README.md.
  pause
  exit /b 1
)
echo.
echo WorkFlow Day 9: open http://127.0.0.1:3008 after the server starts.
echo To stop the server, press Ctrl+C in this window.
echo.
call npm.cmd run dev
if errorlevel 1 pause
