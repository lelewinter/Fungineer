@echo off
title Fungineer Queue Orchestrator
color 0B
echo.
echo  ================================================
echo   Fungineer Queue Orchestrator
echo   Tasks sequenciais, commit a cada 10 tasks
echo   Verificacao visual via Cowork (Chrome)
echo  ================================================
echo.

cd /d "%~dp0.."
python tools/queue-orchestrator.py
pause
