# Journey360 – API & AI Feature Breakdown

This document details the external APIs, AI models, and feature-specific breakdowns for the Journey360 backend.

## 🔗 1. Authentication APIs
**Firebase Authentication API**
*   **Purpose**: User login & signup, Google/Email authentication.
*   **Used In**: Login / Signup screen, Session management.
*   **Cost**: ✅ FREE tier.

## 🧠 2. AI / Language Model APIs
**OpenAI API / Google Gemini API**
*   **Purpose**: AI itinerary generation, AI chat assistant, Post-trip summary.
*   **Used In**: Smart Itinerary AI, Context-aware Travel Assistant, Post-trip Memory AI.
*   **Cost**: ✅ Free credits available.

## 🧭 3. Maps & Navigation APIs
**Google Maps JavaScript API**
*   **Purpose**: Display maps, Plot itinerary routes.
*   **Used In**: Itinerary screen, Safety center.
*   **Cost**: ✅ Free with monthly credits.

**Google Directions API**
*   **Purpose**: Route optimization, Travel time estimation.
*   **Used In**: Smart itinerary planning.
*   **Cost**: ✅ Free tier via Google credits.

**Google Places API**
*   **Purpose**: Fetch attractions, restaurants.
*   **Used In**: AI itinerary creation, AI chat recommendations.
*   **Cost**: ✅ Free tier via Google credits.

## 🌦️ 4. Weather APIs
**OpenWeather API**
*   **Purpose**: Weather forecast, alerts.
*   **Used In**: Itinerary optimization, Safety risk calculation.
*   **Cost**: ✅ Completely FREE tier.

## 📰 5. News & Safety APIs
**NewsAPI.org**
*   **Purpose**: Local crime news, safety incidents.
*   **Used In**: Safety & risk prediction AI.
*   **Cost**: ✅ Free tier.

## 🔍 6. OCR & Scam Detection APIs (Optional)
**Tesseract OCR**
*   **Purpose**: Scan booking screenshots, Detect scam messages.
*   **Used In**: Scam & fraud detection AI.
*   **Cost**: ✅ 100% FREE.

## 📦 7. Storage APIs
**Firebase Storage**
*   **Purpose**: Store trip photos, documents.
*   **Used In**: Post-trip summary.
*   **Cost**: ✅ Free tier (5GB).

## 🗄️ 8. Database
**MongoDB Atlas**
*   **Purpose**: Store Users, Trips, Itineraries, Chat logs.
*   **Used In**: Entire backend.
*   **Cost**: ✅ FREE shared cluster.

## 🚨 9. Emergency APIs (Optional)
**Twilio / Email API**
*   **Purpose**: SOS alerts.
*   **Used In**: Safety Center.
*   **Cost**: ⚠️ Optional / Mocked.

---

## 🧠 AI FEATURE-WISE BREAKDOWN

### 🧠 AI Feature 1: Smart Itinerary Optimization Engine
*   **Purpose**: Generate day-wise, cost-aware, optimized travel itinerary.
*   **How it works**:
    1.  Collects user preferences (Budget, Dates, Interests).
    2.  Fetches real-world data (Places, Directions, Weather).
    3.  Backend constructs structured AI prompt.
    4.  LLM organizes attractions into day-wise schedule with optimized routes.
*   **AI Tools**: OpenAI/Gemini API, Google Maps & Places APIs.

### 🧠 AI Feature 2: Real-Time Risk & Safety Prediction AI
*   **Purpose**: Provide live safety awareness.
*   **How it works**:
    1.  Collects Weather alerts and Local news.
    2.  Assigns weighted risk scores (Rule-based + NLP).
    3.  Calculates risk level (Green/Yellow/Red).
*   **AI Tools**: NewsAPI, OpenWeather API, Backend classification logic.

### 🧠 AI Feature 3: Context-Aware Travel Assistant (Chat AI)
*   **Purpose**: Real-time intelligent assistance.
*   **How it works**:
    1.  Retrieves contextual data (Itinerary, Location, Safety).
    2.  Injects context into LLM prompt (RAG).
    3.  Generates situationally aware response.
*   **AI Tools**: OpenAI/Gemini API, Backend RAG pipeline.

### 🧠 AI Feature 4: Post-Trip Memory & Insight AI
*   **Purpose**: Trip summary and insights.
*   **How it works**:
    1.  Aggregates visited places, expenses, activity.
    2.  Sends structured data to LLM.
    3.  Generates narrative story and highlights.
*   **AI Tools**: OpenAI/Gemini API, Backend analytics logic.

### 🧠 (Optional) AI Feature 5: Scam & Fraud Detection
*   **Purpose**: Protect users from scams.
*   **How it works**:
    1.  Extracts text from screenshots (OCR).
    2.  Scans for scam indicators (NLP).
*   **AI Tools**: Tesseract OCR, Backend NLP rules.
