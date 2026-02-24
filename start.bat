@echo off
title Journey360 - Starting...
echo.
echo  ======================================
echo   Journey360 - Full System Launcher
echo  ======================================
echo.

:: Find Wi-Fi LAN IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"Wi-Fi" /c:"Wireless LAN adapter Wi-Fi"') do set WIFI_FOUND=1
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r "IPv4.*10\. IPv4.*192\.168\."') do (
    set LAN_IP=%%a
)
:: Trim spaces
for /f "tokens=*" %%a in ("%LAN_IP%") do set LAN_IP=%%a

echo  [1/3] Your LAN IP: %LAN_IP%
echo.

:: Start Backend
echo  [2/3] Starting Backend (port 8001)...
start "Journey360 Backend" cmd /k "cd /d c:\Users\gowth\Pictures\Journey360\backend && python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
timeout /t 3 /nobreak >nul

:: Start Frontend
echo  [3/3] Starting Frontend (port 5173)...
start "Journey360 Frontend" cmd /k "cd /d c:\Users\gowth\Pictures\Journey360\frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo  ======================================
echo   All services started!
echo  ======================================
echo.
echo   Desktop:  https://localhost:5173
echo   Phone:    https://%LAN_IP%:5173
echo.
echo   To use AR Navigation:
echo     1. Open https://%LAN_IP%:5173 on desktop
echo     2. Go to an itinerary, click "Launch AR"
echo     3. Scan QR code with your phone
echo.
echo   Press any key to close this window...
pause >nul
