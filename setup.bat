@echo off
echo.
echo  ======================================
echo   IdeaCheck - Setting up project...
echo  ======================================
echo.

:: Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed. Please install from https://git-scm.com
    pause
    exit /b
)

:: Set variables - CHANGE THESE
set GITHUB_USERNAME=tan-codes22
set REPO_NAME=ideacheck-ai
set YOUR_NAME=Tanisha Gotadke
set YOUR_EMAIL=your-email@example.com

:: Configure git if needed
git config --global user.name "%YOUR_NAME%"
git config --global user.email "%YOUR_EMAIL%"

echo [1/4] Initialising git repo...
git init
git add index.html style.css src/app.js README.md .gitignore
git commit -m "Day 2: Initial project setup - IdeaCheck AI Startup Validator"

echo.
echo [2/4] Connecting to GitHub...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git
git branch -M main

echo.
echo [3/4] Pushing to GitHub...
git push -u origin main

echo.
echo [4/4] Done!
echo.
echo  ======================================
echo   SUCCESS! Next steps:
echo  ======================================
echo   1. Create config.js with your OpenAI key
echo   2. Open index.html in your browser to test
echo   3. Enable GitHub Pages in repo settings
echo  ======================================
echo.
pause
