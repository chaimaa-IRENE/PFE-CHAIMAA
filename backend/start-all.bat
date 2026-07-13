@echo off
echo ============================================
echo  Smart Fleet - Demarrage des serveurs
echo ============================================
echo.

echo [1/3] Demarrage serveur TTS (Edge TTS - Voix Marocaine)...
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
start "SmartFleet TTS Server" /MIN python "%~dp0tts_temp\tts_http_server.py" 5000
timeout /t 3 /nobreak > nul

echo [2/3] Demarrage serveur Backend (Spring Boot)...
start "SmartFleet Backend" /MIN cmd /c "cd /d %~dp0 && mvn spring-boot:run"
timeout /t 5 /nobreak > nul

echo [3/3] Demarrage serveur Frontend (React)...
start "SmartFleet Frontend" /MIN cmd /c "cd /d %~dp0\..\mon-projet\frontend && npm start"

echo.
echo ============================================
echo  Tous les serveurs demarres!
echo  - TTS Server: http://localhost:5000
echo  - Backend API: http://localhost:8080
echo  - Frontend:    http://localhost:3000
echo ============================================
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause > nul