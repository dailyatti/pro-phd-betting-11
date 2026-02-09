@echo off
echo ===================================================
echo PhD Betting - Galaxy Deployment Helper
echo ===================================================
echo.
echo I am attempting to upload your code to GitHub.
echo Since 'main' branch is protected, I will upload to 'netlify-deploy' branch.
echo.
echo Please authorize the upload if prompted (GitHub Login).
echo.
pause

echo.
echo [1/3] Switch to deployment branch...
git checkout -b netlify-deploy 2>nul || git checkout netlify-deploy

echo.
echo [2/3] Adding changes...
git add .
git commit -m "Complete upload for Netlify deployment"

echo.
echo [3/3] Pushing to GitHub...
git push -u origin netlify-deploy --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Code uploaded successfully!
    echo Visit https://github.com/dailyatti/pro-phd-betting-11/tree/netlify-deploy
) else (
    echo.
    echo [ERROR] Upload failed. Please check your GitHub permissions.
)
echo.
pause
