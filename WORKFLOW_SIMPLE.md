# Journey360 - Workflow

## Workflow

### **Step 1 (Input):** User enters data or triggers an action
- User fills form: **Destination**, **Dates**, **Budget**, **Interests**, **Travel Pace**
- User clicks "Generate Itinerary"

---

### **Step 2 (Processing):** System processes the request using tech stack

**Backend (FastAPI + MongoDB):**
- Authenticates user (Firebase), stores trip data, checks cache

**Data Aggregation:**
- **Google Places API** → Attractions, restaurants, hotels
- **OpenWeatherMap** → Weather forecasts
- **OpenRouteService** → Routes & distances

**AI Processing (Google Gemini 2.0):**
- Generates personalized day-by-day itinerary with costs
- Fallback to OpenRouter API if needed
- Saves to MongoDB

---

### **Step 3 (Output):** User receives the final result/value
- **Complete Itinerary**: Day-by-day schedule, places with maps, cost breakdown
- **UI Display**: Interactive timeline, Leaflet map, weather widget
- **Email**: Trip plan sent to user

