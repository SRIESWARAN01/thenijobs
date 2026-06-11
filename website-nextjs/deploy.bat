@echo off
REM ============================================================
REM  THENIJOBS - Firebase build & deploy
REM  Run this from E:\thenijobs-main (double-click or run in CMD)
REM  Deploys: root Next.js Hosting + Cloud Functions
REM           + Firestore rules/indexes + Storage rules
REM  Target project: thenijobs-9f01d
REM ============================================================
setlocal

cd /d "%~dp0"

echo.
echo === [1/6] Installing web dependencies ===
call npm install || goto :error

echo.
echo === [2/6] Installing Cloud Functions dependencies ===
call npm --prefix functions install || goto :error

echo.
echo === [3/6] Building web app ===
call npm run build || goto :error

echo.
echo === [4/6] Building Cloud Functions ===
call npm --prefix functions run build || goto :error

echo.
echo === [5/6] Ensuring Firebase CLI is installed ===
where firebase >nul 2>nul || call npm install -g firebase-tools || goto :error

echo.
echo === [6/6] Firebase login (opens a browser the first time) ===
call firebase login

echo.
echo === Deploying canonical app to project thenijobs-9f01d ===
call firebase deploy --project thenijobs-9f01d || goto :error

echo.
echo ============================================================
echo  DONE.  Live at:
echo    https://thenijobs-9f01d.web.app
echo    https://thenijobs-9f01d.firebaseapp.com
echo ============================================================
goto :end

:error
echo.
echo *** DEPLOY FAILED - read the error message above. ***
echo Common causes: build error, missing environment variables, not logged in, or wrong project.
exit /b 1

:end
endlocal
