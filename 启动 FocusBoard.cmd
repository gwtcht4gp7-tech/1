@echo off
setlocal
cd /d "%~dp0"

if not exist node_modules (
  echo Installing dependencies...
  call npm install
)

if not exist .env (
  copy .env.example .env
)

call npm run prisma:generate
call npm run db:init
call npm run db:seed

start "FocusBoard Server" cmd /k "cd /d ""%~dp0"" && npm run dev -- --port 3002"
timeout /t 5 /nobreak >nul
start "" "http://localhost:3002"

endlocal
