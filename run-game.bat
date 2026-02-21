@echo off
setlocal
set PORT=8000

echo Starting Agar.io Mini Clone at http://localhost:%PORT%

where py >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" http://localhost:%PORT%
  py -m http.server %PORT%
  goto :eof
)

where python >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" http://localhost:%PORT%
  python -m http.server %PORT%
  goto :eof
)

echo.
echo Python was not found. Install Python 3 and try again.
pause
