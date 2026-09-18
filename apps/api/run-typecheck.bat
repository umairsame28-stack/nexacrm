@echo off
cd /d "c:\Users\LAP ZONE\CRM project\apps\api"
"C:\Program Files\nodejs\node.exe" "c:\Users\LAP ZONE\CRM project\node_modules\typescript\lib\tsc.js" --noEmit > typecheck-output.txt 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> typecheck-output.txt
