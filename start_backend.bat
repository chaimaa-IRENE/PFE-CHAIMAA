@echo off
set MAVEN_HOME=C:\Users\moutaoch\Downloads\apache-maven-3.9.15-bin\apache-maven-3.9.15
start "SmartFleet Backend" /MIN cmd /c "cd /d %~dp0backend && %MAVEN_HOME%\bin\mvn.cmd spring-boot:run"
echo Backend demarre sur http://localhost:8080
