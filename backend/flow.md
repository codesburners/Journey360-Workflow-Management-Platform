# Journey360 - Deep Analysis: Backend Flow & Architecture

This document outlines the comprehensive backend architecture and detailed data flows for the Journey360 application. It connects the frontend requirements with backend responsibilities, API endpoints, and database interactions.

## 1. System Overview

**Architecture Pattern**: Modular Monolith / Microservices-ready
**Framework**: FastAPI (Python)
**Authentication**: Firebase Admin SDK
**Database**: PostgreSQL / MongoDB (Implied by document structure usage)

### Core Modules
- **Auth**: Handles user verification via Firebase.
- **Users**: Manages user profiles.
- **Trips**: Core logic for creation, management, and retrieval of trips.
- **AI**: Specialized modules for itinerary generation, safety analysis, chat assistance, and post-trip application.
- **SOS**: Emergency trigger handling.

---

## 2. Screen-by-Screen Flow & Architecture

### 🖥️ SCREEN 1: Login / Signup
**Goal**: Secure user authentication and profile initialization.

*   **Flow**:
    1.  **Frontend**: Authenticates with Firebase (Google/Apple/Email). Receives an ID Token.
    2.  **API Call**: `POST /auth/verify-token` with the token.
    3.  **Backend**:
        *   Verifies token with Firebase Admin.
        *   Checks `users` table. If new user, creates record.
        *   Returns User Profile.
    4.  **Frontend**: Redirects to Dashboard.

*   **API**:
    *   `POST /auth/verify-token`
    *   `GET /user/profile`

---

### 🖥️ SCREEN 2: Dashboard / AI Trip Creator
**Goal**: Capture trip intent and generate the initial itinerary using AI.

*   **Flow**:
    1.  **Stage 1: Input**: User selects Destination, Dates, Budget, Interests, Pace.
    2.  **API Call (Create)**: `POST /trip/create`
        *   **DB Action**: Insert into `trips` (status=CREATED).
    3.  **Stage 2: Generation**: System triggers AI generation.
    4.  **API Call (Generate)**: `POST /ai/itinerary/generate` (async/background process recommended).
        *   **Backend Logic**:
            *   Fetch Attractions (Google Places).
            *   Calculate Routes (Maps API).
            *   Check Weather (Weather API).
            *   **AI Processing**: Organize components into a logical day-by-day plan, balancing budget and pace.
        *   **DB Action**: Insert into `itineraries`.
    5.  **Recent Trips**: `GET /trip/recent` fetches history.

*   **Data Model (Trips)**:
    ```json
    {
      "tripId": "UUID",
      "userId": "UUID",
      "destination": "Paris",
      "dates": { "start": "2024-06-01", "end": "2024-06-07" },
      "budget": 2000,
      "interests": ["Art", "Food"],
      "travelPace": "Relaxed",
      "status": "CREATED"
    }
    ```

---

### 🖥️ SCREEN 3: Itinerary Details + Map
**Goal**: Visualizing the trip and allowing AI-powered adjustments.

*   **Flow**:
    1.  **Fetch**: Frontend calls `GET /trip/{tripId}/itinerary`.
    2.  **Display**:
        *   Renders timeline from `itinerary.days`.
        *   Renders Map markers from `places[].lat/lng`.
        *   Calculates totals from `costSummary`.
    3.  **Regenerate**: User clicks "Regenerate with AI".
    4.  **API Call**: `POST /ai/itinerary/regenerate` with specific parameters (e.g., "swap museum for park").
        *   **Backend Logic**: Re-runs optimization logic with new constraints.

*   **Data Model (Itinerary)**:
    ```json
    {
      "tripId": "UUID",
      "days": [
        {
          "day": 1,
          "places": [
             { "name": "Eiffel Tower", "lat": 48.8584, "lng": 2.2945, "cost": 30 }
          ],
          "labels": ["CROWDED"]
        }
      ],
      "costSummary": { "food": 500, "stay": 1000, "travel": 500 },
      "safetyRating": "Green"
    }
    ```

---

### 🖥️ SCREEN 4: AI Travel Assistant (Chat)
**Goal**: Context-aware RAG (Retrieval Augmented Generation) chat.

*   **Flow**:
    1.  **Message**: User sends "Where should I eat lunch?"
    2.  **API Call**: `POST /ai/chat`
        *   Payload: `{ tripId, message, geolocation }`
    3.  **Backend Logic (RAG)**:
        *   **Retrieve Context**: Fetches current itinerary day + Personal preferences + Safety data.
        *   **LLM Prompt**: "User is in [Location]. Itinerary for today is [Schedule]. Recommend lunch nearby."
        *   **Store**: Save pair in `chat_logs`.
    4.  **Response**: "Since you are at the Louvre, I recommend 'Le Cafe Marly' (4.5 stars)."

---

### 🖥️ SCREEN 5: Safety Center
**Goal**: Real-time risk assessment and emergency handling.

*   **Flow**:
    1.  **Polling**: Frontend periodically calls `GET /ai/safety/risk`.
    2.  **Backend Logic**:
        *   Aggregates: Weather alerts + Location stats + Local news/events.
        *   Score: Calculates 0-100 risk score.
    3.  **SOS**: User presses SOS.
    4.  **API Call**: `POST /sos/trigger`.
        *   **Action**: Log event, potentially trigger SMS/Email integration (Twilio/SendGrid).

*   **Data Model (Safety)**:
    ```json
    {
       "score": 45,
       "level": "Moderate",
       "alerts": ["Heavy Rain Forecast", "Pickpocket warning in District 1"]
    }
    ```

---

### 🖥️ SCREEN 6: Post-Trip Summary
**Goal**: Nostalgia and analytics.

*   **Flow**:
    1.  **Trigger**: Trip End Date passed.
    2.  **Generation**: `POST /ai/post-trip/summary`.
    3.  **Backend Logic**:
        *   Summarize `itinerary` (places visited).
        *   Aggregate `costs`.
        *   **LLM**: Generate narrative "The Portuguese Escape".
    4.  **View**: `GET /trip/{tripId}/summary`.

---

## 3. Directory Structure Implementation

The backend follows a domain-driven structure to ensure scalability.

```
backend/
 ├── auth/             # Authentication logic
 ├── users/            # User profile management
 ├── trips/            # Trip CRUD operations
 ├── ai/               # AI Business Logic
 │   ├── __init__.py
 │   ├── itinerary.py  # Itinerary generation & regeneration
 │   ├── safety.py     # Risk scoring & alerts
 │   ├── assistant.py  # Context-aware chat bot
 │   └── post_trip.py  # Summary generation
 ├── sos/              # Emergency handling
 ├── database/         # DB connection & models
 └── main.py           # Application Entrypoint & Router Wiring
```
