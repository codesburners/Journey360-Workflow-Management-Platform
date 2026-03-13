@echo off
TITLE Journey360 One-Click Setup

echo ===================================================
echo      Journey360 - One-Click Setup & Run
echo ===================================================

:: 1. Generate Backend Environment
echo [+] Configuring Backend...
:: Create a template if it doesn't exist, but don't overwrite if it does
if not exist backend\.env (
    echo MONGO_URI=your_mongodb_uri_here> backend\.env
    echo OPENROUTE_API_KEY=your_key_here>> backend\.env
    echo OPENWEATHER_API_KEY=your_key_here>> backend\.env
    echo OPENROUTER_API_KEY=your_key_here>> backend\.env
    echo GEMINI_API_KEY=your_key_here>> backend\.env
    echo MOCK_AI=true>> backend\.env
    echo OFFLINE_MODE=false>> backend\.env
    echo SERPAPI_API_KEY=your_key_here>> backend\.env
    echo SMTP_EMAIL=your_email_here>> backend\.env
    echo SMTP_PASSWORD=your_app_password_here>> backend\.env
    echo NEWS_API_KEY=your_key_here>> backend\.env
    echo RAPIDAPI_KEY=your_key_here>> backend\.env
    echo AVIATIONSTACK_KEY=your_key_here>> backend\.env
    echo [!] Created backend\.env template. Please fill in your secrets.
) else (
    echo [!] backend\.env already exists. Skipping...
)

:: 2. Generate Frontend Environment
echo [+] Configuring Frontend...
if not exist frontend\.env (
    echo VITE_FIREBASE_API_KEY=your_key_here> frontend\.env
    echo VITE_FIREBASE_AUTH_DOMAIN=your_domain_here>> frontend\.env
    echo VITE_FIREBASE_PROJECT_ID=your_id_here>> frontend\.env
    echo VITE_FIREBASE_STORAGE_BUCKET=your_bucket_here>> frontend\.env
    echo VITE_FIREBASE_MESSAGING_SENDER_ID=your_id_here>> frontend\.env
    echo VITE_FIREBASE_APP_ID=your_id_here>> frontend\.env
    echo VITE_FIREBASE_MEASUREMENT_ID=your_id_here>> frontend\.env
    echo VITE_BACKEND_URL=http://localhost:8001>> frontend\.env
    echo VITE_ORS_API_KEY=your_key_here>> frontend\.env
    echo [!] Created frontend\.env template. Please fill in your secrets.
) else (
    echo [!] frontend\.env already exists. Skipping...
)

:: 3. Launch Services
echo [+] Launching Backend Server...
start "Journey360 Backend" cmd /k "cd backend && echo Installing Python Dependencies... && pip install -r requirements.txt && echo Starting Server... && uvicorn main:app --reload --host 0.0.0.0 --port 8001"

echo [+] Launching Frontend Server...
start "Journey360 Frontend" cmd /k "cd frontend && echo Installing Node Dependencies... && npm install && echo Starting Client... && npm run dev"

echo.
echo ===================================================
echo    App is starting! Check the new windows.
echo    Once ready, open: http://localhost:5173
echo ===================================================
pause