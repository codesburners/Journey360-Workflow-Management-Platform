# 🌍 Journey360 - AI-Powered Travel Companion

![Journey360 Banner](/api/placeholder/1200/300)

**Journey360** (Part of SRIB-PRISM / IXR Prismatics Program) is a next-generation travel planning platform that leverages advanced AI, Augmented Reality (AR), and real-time data to create personalized, safe, and immersive travel experiences.

🔗 **Live Demo:** [https://journey-beta-two.vercel.app/](https://journey-beta-two.vercel.app/)

---

## ✨ Key Features

### 🧠 Smart AI Itineraries
*   **Personalized Planning:** Generates day-by-day itineraries based on your budget, interests, and pace.
*   **Adaptive Regeneration:** modify your plan on the fly with natural language (e.g., "Make day 2 more relaxing").
*   **Real-Time Costs:** Estimates reliable local costs for hotels, food, and activities.

### 👓 AR Navigation
*   **Live Walking Directions:** Visualizes your path with 3D arrows and markers in the real world.
*   **Sensor Fusion:** Combines GPS, Compass, and Camera feed for precise guidance.
*   **Seamless Sync:** Connect your phone to the desktop app to take your itinerary to the streets.

### 🤖 Intelligent Travel Assistant
*   **Context-Aware Chat:** Ask questions about your trip, local customs, or hidden gems.
*   **24/7 Availability:** Your personal travel guide is always ready to help.

### 🛡️ Safety & Risk Engine
*   **Live Risk Assessment:** Analyzes local news and operational reports to determine safety levels (Low/Medium/High).
*   **Real-Time Alerts:** Get notified about potential risks like protests, severe weather, or crime hotspots.

### 📝 Post-Trip Memories
*   **Automated Journals:** AI sums up your trip into a beautiful narrative blog post to share with friends.

---

## 🛠️ Tech Stack

### Frontend
-   **Framework:** React 19 (Vite)
-   **Styling:** Tailwind CSS 4
-   **Maps:** Leaflet / React-Leaflet
-   **AR/3D:** Three.js
-   **State/Auth:** Firebase

### Backend
-   **Framework:** Python (FastAPI / Flask)
-   **Database:** MongoDB Atlas
-   **AI Models:** Google Gemini 2.0 Flash / Pro, OpenAI Integration
-   **APIs:**
    -   OpenRouteService (Navigation)
    -   NewsAPI (Safety)
    -   OpenWeatherMap (Weather)
    -   SerpApi/Google Places (Local Data)

---

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   Python (3.10+)
-   MongoDB Atlas Account
-   API Keys (Gemini, Firebase, etc.)

### 1️⃣ Installation

**Clone the repository:**
```bash
git clone https://github.com/your-username/journey360.git
cd journey360
```

#### Frontend Setup
```bash
cd frontend
npm install
# Start Development Server
npm run dev
```

#### Backend Setup
```bash
cd backend
# Create virtual environment (optional but recommended)
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
# Start Backend Server
uvicorn main:app --reload
```

### 2️⃣ Configuration (.env)

Create a `.env` file in the `backend` directory with the following keys:

```env
# AI Keys
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here

# Database
MONGODB_URI=your_mongodb_connection_string

# External Services
NEWS_API_KEY=your_news_key
OPENWEATHER_API_KEY=your_weather_key
SERPAPI_API_KEY=your_serp_key
ORS_API_KEY=your_openrouteservice_key
```

### 3️⃣ Running the App
1.  Start the Backend: `uvicorn main:app --reload` (Runs on `http://localhost:8000`)
2.  Start the Frontend: `npm run dev` (Runs on `http://localhost:5173`)
3.  Open your browser to the local frontend URL.

---

## 📱 How to Use

1.  **Sign Up/Login**: Create an account to save your trips.
2.  **Create a Trip**: Enter your destination, dates, budget, and interests.
3.  **View Itinerary**: Let the AI generate your plan. customize it as needed.
4.  **Check Safety**: Look at the safety dashboard for your destination.
5.  **Go AR**: Click the "AR Navigate" button on a location to sync to your mobile device.

---

## 🤝 Contributing
Contributions are welcome! Please fork the repo and submit a pull request.

## 📄 License
MIT License.
