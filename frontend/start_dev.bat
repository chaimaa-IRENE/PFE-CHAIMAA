@echo off
cd /d %~dp0
set PORT=3000
set HOST=0.0.0.0
start "SmartFleet Frontend" /MIN npm start
echo Frontend demarre sur http://localhost:3000
