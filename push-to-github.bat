@echo off
echo ========================================
echo  NexaCRM - Push to GitHub
echo ========================================
echo.
echo Your GitHub Username: umairsame28-stack
echo Repository: nexacrm
echo.
echo IMPORTANT: Make sure you created the repository on GitHub first!
echo Go to: https://github.com/new
echo.
pause

echo.
echo Adding GitHub remote...
git remote add origin https://github.com/umairsame28-stack/nexacrm.git

echo.
echo Renaming branch to main...
git branch -M main

echo.
echo Pushing to GitHub...
echo (You may need to authenticate)
git push -u origin main

echo.
echo ========================================
echo  Done!
echo ========================================
echo.
echo Your repository: https://github.com/umairsame28-stack/nexacrm
echo.
pause
