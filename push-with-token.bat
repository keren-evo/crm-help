@echo off
REM Push crm-help to keren-evo/crm-help using GITHUB_TOKEN env var
setlocal
cd /d "%~dp0"
if "%GITHUB_TOKEN%"=="" (
  echo Set GITHUB_TOKEN to a GitHub PAT with repo access to keren-evo/crm-help
  echo Example: set GITHUB_TOKEN=ghp_xxxx
  exit /b 1
)
git push "https://%GITHUB_TOKEN%@github.com/keren-evo/crm-help.git" main
exit /b %ERRORLEVEL%
