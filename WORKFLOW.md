# Journey360 - Workflow Documentation

## Workflow Overview

Journey360 follows a three-step workflow pattern for all major user interactions. Below are detailed workflows for the core features.

---

## 🎯 **Workflow 1: Trip Creation & Itinerary Generation**

### **Step 1 (Input):** User enters data or triggers an action
- User logs in via Firebase Authentication (Google/Email/Apple)
- User navigates to Dashboard and fills out the AI Trip Creator form:
  - **Destination**: Text input (e.g., "Paris, France")
  - **Dates**: Start date and end date picker
  - **Budget**: Numeric input (converted to INR)
  - **Interests**: Multi-select (Adventure, Culture, Foodie, Relaxation, Photography)
  - **Travel Pace**: Dropdown (Relaxed, Balanced, Fast-paced)
- User clicks "Generate Itinerary" button

**Frontend Action**: `POST /trip/create` → `POST /ai/itinerary/generate`

---

### **Step 2 (Processing):** System processes the request using tech stack

#### **2.1 Trip Creation (Backend: FastAPI)**
- **Authentication**: Firebase Admin SDK verifies user token
- **Database**: MongoDB Atlas stores trip data:
  ```json
  {
    "trip_id": "UUID",
    "user_id": "Firebase UID",
    "destination": "Paris",
    "start_date": "2024-06-01",
    "end_date": "2024-06-07",
    "days": 7,
    "budget": 200000,
    "interests": ["Culture", "Foodie"],
    "travel_pace": "Balanced",
    "status": "CREATED"
  }
  ```
- **Image Service**: Fetches destination image via SerpApi/Google Images
- Returns `trip_id` to frontend

#### **2.2 Itinerary Generation (AI Processing)**
- **Cache Check**: MongoDB queries for cached itineraries (same destination + duration)
  - If cached: Clone and personalize for user
  - If not cached: Proceed to full generation

- **Data Aggregation** (Parallel API calls):
  - **Google Places API** (via SerpApi): Fetches top attractions, restaurants, hotels
  - **OpenWeatherMap API**: Gets current weather and forecasts
  - **OpenRouteService API**: Calculates route distances and travel times
  - **Image Service**: Fetches place images

- **AI Processing** (Google Gemini 2.0 Flash/Pro):
  - **Prompt Engineering**: Constructs comprehensive prompt with:
    - User preferences (interests, pace, budget)
    - Real place data (50+ attractions, 10 hotels, 15 restaurants)
    - Weather forecasts
    - Budget constraints
  - **LLM Call**: Sends structured prompt to Gemini API
  - **Response Parsing**: Extracts JSON itinerary structure:
    ```json
    {
      "days": [
        {
          "day": 1,
          "places": [
            {
              "name": "Eiffel Tower",
              "time": "09:00",
              "description": "...",
              "cost": 30,
              "lat": 48.8584,
              "lng": 2.2945
            }
          ]
        }
      ],
      "costSummary": {
        "food": 500,
        "stay": 1000,
        "activities": 500,
        "total": 2000
      }
    }
    ```
  - **Fallback**: If Gemini fails, uses OpenRouter API (OpenAI models)

- **Database Storage**: Saves complete itinerary to MongoDB `itineraries` collection
- **Background Task**: Queues email notification with itinerary summary

---

### **Step 3 (Output):** User receives the final result/value
- **Frontend Response**: Receives complete itinerary JSON
- **UI Rendering**:
  - **Timeline View**: Day-by-day schedule with time slots
  - **Interactive Map**: Leaflet map with markers for all places
  - **Cost Breakdown**: Visual cost summary (food, stay, activities)
  - **Weather Widget**: Current conditions and forecasts
- **Navigation**: User redirected to `/itinerary?trip_id={trip_id}`
- **Email**: User receives formatted email with itinerary (background task)

**Result**: Complete personalized travel plan ready for use

---

## 🔄 **Workflow 2: Itinerary Regeneration (Natural Language)**

### **Step 1 (Input):** User enters data or triggers an action
- User views existing itinerary
- User types natural language instruction in regeneration box:
  - Examples: "Make day 2 more relaxing", "Add more budget-friendly options", "Swap museum for park"
- User clicks "Regenerate with AI" button

**Frontend Action**: `POST /ai/itinerary/regenerate`

---

### **Step 2 (Processing):** System processes the request using tech stack

- **Authentication**: Firebase Admin SDK verifies user
- **Context Retrieval**: 
  - Fetches original trip data from MongoDB
  - Fetches existing itinerary
- **AI Processing** (Google Gemini 2.0 Flash/Pro):
  - **Prompt Construction**: 
    - Original itinerary context
    - User's natural language instruction
    - Constraints (budget, dates, interests)
  - **LLM Call**: Sends regeneration prompt
  - **Response**: Modified itinerary JSON maintaining structure
- **Database Update**: Updates itinerary in MongoDB
- **Background Task**: Queues updated itinerary email

---

### **Step 3 (Output):** User receives the final result/value
- **Frontend Response**: Updated itinerary JSON
- **UI Update**: Timeline and map refresh with new plan
- **Visual Feedback**: Success message "Itinerary updated successfully"
- **Email**: User receives updated itinerary email

**Result**: Modified travel plan matching user's request

---

## 💬 **Workflow 3: AI Travel Assistant Chat**

### **Step 1 (Input):** User enters data or triggers an action
- User opens chat interface (can be trip-specific or general)
- User types question: "Where should I eat lunch?" or "What's the best time to visit the Eiffel Tower?"
- User clicks send or presses Enter

**Frontend Action**: `POST /ai/chat?trip_id={optional}`

---

### **Step 2 (Processing):** System processes the request using tech stack

- **Authentication**: Firebase Admin SDK verifies user
- **Context Retrieval** (RAG - Retrieval Augmented Generation):
  - If `trip_id` provided: Fetches current trip and itinerary from MongoDB
  - Retrieves user preferences from profile
  - Fetches safety data for destination (if applicable)
- **AI Processing** (Google Gemini 2.0 Flash/Pro):
  - **Prompt Construction**: 
    - User's question
    - Trip context (current location, day schedule, preferences)
    - Safety information
    - Local recommendations from Places API
  - **LLM Call**: Context-aware response generation
  - **Response**: Natural language answer with recommendations
- **Logging**: Saves chat interaction to database (optional)

---

### **Step 3 (Output):** User receives the final result/value
- **Frontend Response**: AI-generated text response
- **UI Display**: Message appears in chat interface
- **Rich Content**: May include:
  - Restaurant recommendations with ratings
  - Time suggestions based on itinerary
  - Safety tips
  - Links to places on map

**Result**: Contextual, helpful travel advice

---

## 🛡️ **Workflow 4: Safety Risk Assessment**

### **Step 1 (Input):** User enters data or triggers an action
- User navigates to Safety Center
- User selects destination or system auto-detects from active trip
- User clicks "Check Safety" or system auto-refreshes

**Frontend Action**: `GET /ai/safety/risk?location={destination}`

---

### **Step 2 (Processing):** System processes the request using tech stack

- **Authentication**: Firebase Admin SDK verifies user
- **Data Aggregation**:
  - **NewsAPI**: Fetches recent news articles for destination (last 7 days)
  - **OpenWeatherMap API**: Gets severe weather alerts
  - **Risk Engine**: Analyzes news articles for:
    - Crime incidents
    - Protests/demonstrations
    - Natural disasters
    - Health alerts
    - Political instability
- **Risk Calculation**:
  - Scores each incident (High: +30, Medium: +15, Low: +5)
  - Calculates total risk score (0-100)
  - Categorizes: Low (<35), Medium (35-69), High (≥70)
- **AI Processing** (Google Gemini 2.0 Flash):
  - Analyzes news context for severity assessment
  - Generates human-readable risk summary

---

### **Step 3 (Output):** User receives the final result/value
- **Frontend Response**: Risk assessment JSON:
  ```json
  {
    "score": 45,
    "level": "Medium",
    "reason": "Moderate safety concerns reported",
    "alerts": [
      "Heavy Rain Forecast",
      "Pickpocket warning in District 1"
    ],
    "articles": [...]
  }
  ```
- **UI Display**:
  - **Risk Indicator**: Color-coded badge (Green/Yellow/Red)
  - **Risk Score**: Visual gauge (0-100)
  - **Alert List**: Scrollable list of safety concerns
  - **News Feed**: Recent relevant articles
- **Notifications**: Real-time alerts for high-risk situations

**Result**: Comprehensive safety assessment for destination

---

## 📱 **Workflow 5: AR Navigation**

### **Step 1 (Input):** User enters data or triggers an action
- User views itinerary on desktop
- User clicks "AR Navigate" button on a specific place
- System generates QR code
- User scans QR code with mobile device
- Mobile app requests AR navigation

**Frontend Action**: `GET /ai/itinerary/ar-nearby?trip_id={id}&lat={lat}&lng={lng}&radius=1000`

---

### **Step 2 (Processing):** System processes the request using tech stack

- **Authentication**: Firebase Admin SDK verifies user
- **Trip Verification**: Confirms user owns the trip
- **Itinerary Retrieval**: Fetches itinerary from MongoDB
- **Geolocation Processing**:
  - Calculates distances using Haversine formula
  - Filters places within radius (default 1000m)
  - Sorts by proximity
- **Route Calculation** (OpenRouteService API):
  - Generates walking directions
  - Calculates travel time
  - Provides turn-by-turn instructions

---

### **Step 3 (Output):** User receives the final result/value
- **Frontend Response**: Array of nearby places with distances
- **Mobile AR Display** (Three.js):
  - **3D Visualization**: Overlays 3D arrows and markers
  - **Sensor Fusion**: Combines GPS, Compass, Camera feed
  - **Real-time Updates**: Updates as user moves
  - **Route Overlay**: Shows path to destination
- **Desktop Sync**: Real-time position updates

**Result**: Immersive AR navigation experience

---

## 📝 **Workflow 6: Post-Trip Summary Generation**

### **Step 1 (Input):** User enters data or triggers an action
- Trip end date has passed
- User navigates to completed trip
- User clicks "Generate Trip Summary" button

**Frontend Action**: `POST /ai/post-trip/summary?trip_id={id}`

---

### **Step 2 (Processing):** System processes the request using tech stack

- **Authentication**: Firebase Admin SDK verifies user
- **Data Aggregation**:
  - Fetches complete trip data from MongoDB
  - Retrieves itinerary with all places visited
  - Aggregates cost data
  - Retrieves trip photos (if available)
- **AI Processing** (Google Gemini 2.0 Pro):
  - **Prompt Construction**: 
    - Trip destination, dates, duration
    - List of places visited
    - Cost summary
    - User interests
  - **LLM Call**: Generates narrative blog post
  - **Response**: Beautifully formatted travel story

---

### **Step 3 (Output):** User receives the final result/value
- **Frontend Response**: Generated summary JSON
- **UI Display**:
  - **Blog Post View**: Formatted narrative with markdown
  - **Photo Gallery**: Trip images (if available)
  - **Statistics**: Places visited, total cost, duration
  - **Share Button**: Social media sharing
- **Export Options**: PDF download, email sharing

**Result**: Beautiful travel memory document

---

## 🔑 **Common Processing Patterns Across All Workflows**

### **Authentication Layer**
- Firebase Admin SDK verifies JWT tokens
- User context injected via dependency injection

### **Database Layer**
- MongoDB Atlas for flexible document storage
- Collections: `trips`, `itineraries`, `users`, `chat_logs`

### **AI Layer**
- Primary: Google Gemini 2.0 Flash/Pro
- Fallback: OpenRouter API (multiple models)
- Intelligent caching to reduce API costs

### **External APIs**
- **Places**: SerpApi / Google Places
- **Weather**: OpenWeatherMap
- **Navigation**: OpenRouteService
- **News**: NewsAPI
- **Images**: SerpApi Image Search

### **Background Tasks**
- Email notifications (SendGrid/Twilio)
- Async processing for long operations
- Caching strategies for performance

---

## 📊 **Performance Optimizations**

1. **Caching**: Itineraries cached by destination + duration
2. **Parallel API Calls**: Multiple external APIs called concurrently
3. **Database Indexing**: Optimized queries on `trip_id`, `user_id`
4. **CDN**: Static assets served via Vercel edge network
5. **Lazy Loading**: Frontend components load on demand

---

## 🔄 **Error Handling & Fallbacks**

- **AI Failures**: Automatic fallback to OpenRouter API
- **API Timeouts**: Retry logic with exponential backoff
- **Database Errors**: Graceful degradation with cached data
- **Network Issues**: Offline mode with local storage

---

This workflow architecture ensures **scalability**, **reliability**, and **user experience** across all Journey360 features.


