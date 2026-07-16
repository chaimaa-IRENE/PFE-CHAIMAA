@echo off
echo ============================================
echo  Smart Fleet - Demarrage des serveurs
echo ============================================
echo.

echo [1/3] Demarrage serveur Backend (Spring Boot)...
set JAVA_HOME=C:\Program Files\Java\jdk-21
set MAVEN_HOME=C:\Users\moutaoch\Downloads\apache-maven-3.9.15-bin\apache-maven-3.9.15
start "SmartFleet Backend" /MIN cmd /c "cd /d %~dp0 && %MAVEN_HOME%\bin\mvn.cmd spring-boot:run"
timeout /t 5 /nobreak > nul

echo [2/3] Demarrage serveur Frontend (React)...
start "SmartFleet Frontend" /MIN cmd /c "cd /d %~dp0\..\frontend && npm start"

echo [3/3] Demarrage serveur TTS (Edge TTS - Voix Marocaine) - optionnel...
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
start "SmartFleet TTS Server" /MIN python "%~dp0tts_temp\tts_http_server.py" 5000

echo.
echo ============================================
echo  Tous les serveurs demarres!
echo  - Backend API:  http://localhost:8080
echo  - Frontend:     http://localhost:3000
echo  - TTS Server:   http://localhost:5000 (optionnel, TTS marche aussi via backend)
echo ============================================
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause > nul