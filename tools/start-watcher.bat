@echo off
title Cowork ^<^> Claude Code Bridge
color 0A
echo.
echo  ============================================
echo   Cowork ^<^> Claude Code Autonomous Bridge
echo  ============================================
echo.
echo  Instalando dependencias...
pip install watchdog --quiet --break-system-packages 2>nul || pip install watchdog --quiet

echo.
echo  Iniciando watcher...
echo  (Deixe essa janela aberta enquanto trabalha/dorme)
echo  (Pressione Ctrl+C para parar)
echo.

cd /d "%~dp0.."
python tools\cowork-watcher.py --poll

pause
