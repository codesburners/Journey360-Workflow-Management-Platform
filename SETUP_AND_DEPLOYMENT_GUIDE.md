# Journey360 - Complete Setup & Deployment Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [API Keys & Services](#api-keys--services)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)

---


---

## ⚡ Quick Start (Evaluators)

**The validation is automated.** You do not need to manually install dependencies or configure keys.

1.  **Navigate** to the `Journey360` project folder.
2.  **Double-click** the `run_journey360.bat` file.
    *   *This will automatically install Python/Node requirements, configure API keys, and launch the app.*
3.  The browser will open automatically to `http://localhost:5173`.

---

## 🎯 Project Overview

**Journey360** is a comprehensive travel planning and safety platform built with:
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: Firebase Authentication
- **AI Services**: Google Gemini, OpenRouter

---

## 📦 Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **Python** (v3.11 or higher)
   - Download: https://www.python.org/downloads/
   - Verify: `python --version`

3. **MongoDB** (v6.0 or higher)
   - Download: https://www.mongodb.com/try/download/community
   - Verify: `mongod --version`
   - **OR** Use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

4. **Git** (for version control)
   - Download: https://git-scm.com/downloads
   - Verify: `git --version`

---

## 🔑 API Keys & Services

You need to obtain API keys for the following services:

### 1. **Firebase** (Authentication & Hosting)
- **Website**: https://console.firebase.google.com/
- **Required**:
  - Create a new Firebase project
  - Enable Authentication (Email/Password, Google Sign-In)
  - Download `firebase_key.json` (Service Account Key)
  - Get Web App configuration

**Steps**:
1. Go to Firebase Console → Create Project
2. Project Settings → Service Accounts → Generate New Private Key
3. Save as `backend/firebase_key.json`
4. Project Settings → General → Your apps → Web app config

### 2. **Google Gemini API** (AI Chat & Recommendations)
- **Website**: https://makersuite.google.com/app/apikey
- **Required**: API Key for Gemini Pro model
- **Usage**: Trip planning, itinerary generation, chat assistance

### 3. **OpenRouter API** (Alternative AI Provider)
- **Website**: https://openrouter.ai/
- **Required**: API Key
- **Usage**: Fallback AI service for chat and recommendations

### 4. **OpenWeather API** (Weather Data)
- **Website**: https://openweathermap.org/api
- **Required**: API Key
- **Usage**: Real-time weather information for destinations

### 5. **OpenRouteService API** (Maps & Routing)
- **Website**: https://openrouteservice.org/dev/#/signup
- **Required**: API Key
- **Usage**: Route planning, distance calculations, map rendering

### 6. **SerpAPI** (Search & News)
- **Website**: https://serpapi.com/
- **Required**: API Key
- **Usage**: Travel news, destination information, safety alerts

### 7. **NewsAPI** (News Articles)
- **Website**: https://newsapi.org/
- **Required**: API Key
- **Usage**: Safety news, travel advisories, destination updates

### 8. **MongoDB** (Database)
- **Option 1**: Local Installation
  - Download: https://www.mongodb.com/try/download/community
  - Default URI: `mongodb://localhost:27017/journey360`

- **Option 2**: MongoDB Atlas (Cloud - Recommended)
  - Website: https://www.mongodb.com/cloud/atlas
  - Create free cluster
  - Get connection string

### 9. **SMTP Email Service** (Optional - for notifications)
- **Gmail SMTP** (Recommended for testing):
  - Email: Your Gmail address
  - App Password: Generate from Google Account settings
  - Guide: https://support.google.com/accounts/answer/185833

---

## 🚀 Installation

### Step 1: Clone/Navigate to Project
```bash
cd "c:\Users\kaart\OneDrive\Documents\Projects\LEARNING FOR 2026\SAMSUNG PRISM\Journey360_Integrate\Journey\Journey360-updated"
```

### Step 2: Backend Setup

#### 2.1 Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

**Key Backend Dependencies**:
- `fastapi==0.115.6` - Web framework
- `uvicorn==0.40.0` - ASGI server
- `pymongo==4.11.0` - MongoDB driver
- `firebase-admin==6.7.0` - Firebase authentication
- `python-dotenv==1.0.1` - Environment variables
- `google-generativeai==0.8.3` - Google Gemini AI
- `pyotp==2.9.0` - Two-factor authentication
- `feedparser==6.0.10` - RSS/News parsing
- `python-dateutil==2.9.0.post0` - Date utilities

#### 2.2 Create Backend Environment File
Create `backend/.env`:
```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/journey360

# API Keys
OPENROUTE_API_KEY=your_openroute_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
SERPAPI_API_KEY=your_serpapi_api_key_here
NEWS_API_KEY=your_newsapi_key_here

# Application Settings
MOCK_AI=false
OFFLINE_MODE=false

# Email Configuration (Optional)
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
```

#### 2.3 Add Firebase Service Account Key
Place your `firebase_key.json` in the `backend/` directory.

### Step 3: Frontend Setup

#### 3.1 Install Node Dependencies
```bash
cd ../frontend
npm install
```

**Key Frontend Dependencies**:
- `react==19.0.0` - UI framework
- `react-router-dom==7.1.3` - Routing
- `firebase==11.2.0` - Authentication
- `lucide-react==0.469.0` - Icons
- `leaflet==1.9.4` - Maps
- `recharts==2.15.0` - Charts/Analytics
- `react-markdown==9.0.2` - Markdown rendering

#### 3.2 Create Frontend Environment File
Create `frontend/.env`:
```env
# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Backend API URL
VITE_BACKEND_URL=http://localhost:8001
```

---

## ⚙️ Configuration

### MongoDB Setup

#### Option 1: Local MongoDB
1. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

2. Verify connection:
   ```bash
   mongosh
   ```

#### Option 2: MongoDB Atlas (Cloud)
1. Create cluster at https://www.mongodb.com/cloud/atlas
2. Get connection string
3. Update `backend/.env`:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/journey360?retryWrites=true&w=majority
   ```

### Firebase Setup
1. Go to Firebase Console → Authentication
2. Enable sign-in methods:
   - Email/Password
   - Google (optional)
3. Add authorized domain: `localhost`

---

## 🏃 Running the Application

### Development Mode (Recommended)

#### Terminal 1: Start Backend
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

**Expected Output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Application startup complete.
```

#### Terminal 2: Start Frontend
```bash
cd frontend
npm run dev
```

**Expected Output**:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **Port Already in Use**
**Error**: `Address already in use`

**Solution**:
```bash
# Windows
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8001 | xargs kill -9
```

#### 2. **MongoDB Connection Failed**
**Error**: `ServerSelectionTimeoutError`

**Solutions**:
- Verify MongoDB is running: `mongosh`
- Check `MONGO_URI` in `.env`
- For Atlas: Whitelist your IP address

#### 3. **Firebase Authentication Error**
**Error**: `Failed to initialize Firebase`

**Solutions**:
- Verify `firebase_key.json` exists in `backend/`
- Check Firebase project settings
- Ensure service account has correct permissions

#### 4. **CORS Errors**
**Error**: `Access-Control-Allow-Origin header is present`

**Solutions**:
- Ensure backend is running on `localhost:8001`
- Check `frontend/.env` has `VITE_BACKEND_URL=http://localhost:8001`
- Restart both frontend and backend

#### 5. **API Key Errors**
**Error**: `Invalid API key` or `401 Unauthorized`

**Solutions**:
- Verify all API keys in `backend/.env`
- Check API key quotas/limits
- Ensure keys are active and not expired

#### 6. **Module Not Found Errors**
**Backend Error**: `ModuleNotFoundError: No module named 'X'`

**Solution**:
```bash
cd backend
pip install -r requirements.txt
```

**Frontend Error**: `Cannot find module 'X'`

**Solution**:
```bash
cd frontend
npm install
```

---

## 📊 API Usage Summary

| Service | Purpose | Free Tier | Docs |
|---------|---------|-----------|------|
| Firebase | Authentication | Yes (50K MAU) | [Link](https://firebase.google.com/docs) |
| Google Gemini | AI Chat | Yes (60 req/min) | [Link](https://ai.google.dev/docs) |
| OpenRouter | AI Fallback | Pay-as-you-go | [Link](https://openrouter.ai/docs) |
| OpenWeather | Weather Data | Yes (1K calls/day) | [Link](https://openweathermap.org/api) |
| OpenRouteService | Maps/Routing | Yes (2K req/day) | [Link](https://openrouteservice.org/dev/) |
| SerpAPI | Search/News | Yes (100 searches/mo) | [Link](https://serpapi.com/docs) |
| NewsAPI | News Articles | Yes (100 req/day) | [Link](https://newsapi.org/docs) |
| MongoDB | Database | Yes (512MB) | [Link](https://docs.mongodb.com/) |

---

## 🎯 Quick Start Checklist

- [ ] Install Node.js, Python, MongoDB
- [ ] Obtain all required API keys
- [ ] Create `backend/.env` with all keys
- [ ] Create `frontend/.env` with Firebase config
- [ ] Add `firebase_key.json` to backend folder
- [ ] Run `pip install -r requirements.txt` in backend
- [ ] Run `npm install` in frontend
- [ ] Start MongoDB service
- [ ] Start backend: `uvicorn main:app --reload --host 0.0.0.0 --port 8001`
- [ ] Start frontend: `npm run dev`
- [ ] Open http://localhost:5173

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API documentation links
3. Check browser console (F12) for frontend errors
4. Check terminal output for backend errors

---

## 📝 Notes

- **Development**: Use `localhost` for all URLs
- **Production**: Update CORS settings and environment variables
- **Security**: Never commit `.env` files or API keys to version control
- **Backups**: Regularly backup your MongoDB database

---

**Last Updated**: January 25, 2026
**Version**: 2.2.0
