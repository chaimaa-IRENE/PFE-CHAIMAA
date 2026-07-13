@echo off
cd /d C:\Users\EmsiC\Desktop\mon-projet-extraction\frontend
set PORT=3000
set HOST=0.0.0.0
npm start > frontend_new.log 2> frontend_new_err.log
