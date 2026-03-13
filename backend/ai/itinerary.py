try:
    from backend.services.places import get_places, get_coordinates
    from backend.services.weather import get_weather
    from backend.services.hotels import search_hotels
    from backend.services.restaurants import search_restaurants
    from backend.database.db import itineraries_collection, trips_collection
    from backend.trips.schema import Itinerary, CostSummary, DayPlan, Place
    from backend.ai.openrouter_client import call_openrouter
except ImportError:
    from services.places import get_places, get_coordinates
    from services.weather import get_weather
    from services.hotels import search_hotels
    from services.restaurants import search_restaurants
    from database.db import itineraries_collection, trips_collection
    from trips.schema import Itinerary, CostSummary, DayPlan, Place
    from openrouter_client import call_openrouter

import os
import json
import requests
from google import genai
from google.genai import types
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv
import uuid
import time

# Ensure .env is loaded
backend_root = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=backend_root / '.env')

# Configure Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Default Currency
DEFAULT_CURRENCY_SYMBOL = "₹"
DEFAULT_CURRENCY_CODE = "INR"

def repair_json(json_str):
    """
    Attempts to repair a truncated JSON string by closing open quotes and brackets.
    """
    if not json_str: return json_str
    
    stack = []
    is_in_string = False
    is_escaped = False
    
    clean_text = json_str.strip()
    
    for char in clean_text:
        if is_escaped:
            is_escaped = False
            continue
        if char == '\\':
            is_escaped = True
        elif char == '"':
            is_in_string = not is_in_string
        elif not is_in_string:
            if char == '{':
                stack.append('}')
            elif char == '[':
                stack.append(']')
            elif char == '}' or char == ']':
                if stack and stack[-1] == char:
                    stack.pop()
    
    repaired = clean_text
    # If we stopped mid-string, close it
    if is_in_string:
        repaired += '"'
    
    # Handle dangling structure
    repaired = repaired.strip()
    if repaired.endswith(':'):
        repaired += ' null'
    elif repaired.endswith(','):
        repaired = repaired[:-1].strip()
        
    # Close all open containers
    while stack:
        closing = stack.pop()
        # If we are about to close a dict but it ends like {"key" (no colon/value)
        # we need to be careful. However, most truncations are after : or ,
        repaired += closing
        
    return repaired

def build_itinerary_prompt(trip, places, weather, currency_symbol="₹", language="English"):
    places_str = json.dumps(places, indent=2)
    weather_str = json.dumps(weather, indent=2)
    duration = trip.get('days', 3)
    budget = trip.get('budget', 1000)
    budget_level = trip.get('budget_level', 'Balanced')
    pace = trip.get('travel_pace', 'Balanced')
    
    interests = ", ".join([str(i) for i in trip.get('interests', [])])
    return f"""
You are 'Journey360 AI', a premium, highly precise travel consultant. 
Your goal is to create a masterpiece {duration}-day itinerary in {language}. 

CRITICAL REQUIREMENT: 
You MUST generate exactly {duration} days of activities. Each day must be a separate object in the "days" array. 
If {duration} is 5, I expect 5 objects in the "days" array. NEVER combine days or shorten the trip.
Do not skip any days.

TRIP CONTEXT:
- Destination: {trip['destination']}
- Budget Level: {budget_level} ({currency_symbol}{budget} total for all {duration} days)
- Interests: {interests}
- Duration: {duration} days
- Pace: {pace}
- Local Currency: {currency_symbol} (You MUST use this symbol for ALL prices)
- PRICING GUIDANCE (VERY IMPORTANT): 
  Since the currency is INR (₹), please provide realistic local costs. 
  Example "Balanced" costs for India:
    * Hotel: ₹3,000 - ₹8,000 per night
    * Meal: ₹400 - ₹1,200 per person
    * Activity: ₹200 - ₹2,000
  DO NOT use USD-scaled numbers (like 10 or 50). Use realistic INR thousands/hundreds.
- Current Weather: {weather_str}

LOCAL KNOWLEDGE (Use these as primary suggestions where relevant, especially for Hotels and Dining):
{places_str}

STRICT JSON (Return ONLY raw JSON):
{{
  "safetyAdvisory": "...", "travelTips": [],
  "topHotels": [
    {{
      "name": "Hotel Name",
      "rating": 4.8,
      "vibe": "e.g., 8-min walk • Traditional luxury",
      "description": "Short catchy summary",
      "price": "{currency_symbol}300",
      "imageUrl": "link",
      "bookingUrl": "official booking link",
      "lat": number,
      "lng": number
    }}
  ],
  "days": [
    {{
      "dayNumber": 1,
      "weatherNote": "How weather affects today's plans.",
      "totalDayCost": number,
      "places": [
        {{
          "name": "Name",
          "category": "attraction" | "food" | "hotel",
          "estimatedCost": number,
          "rating": number,
          "userRatingCount": number,
          "timeSlot": "breakfast" | "morning" | "lunch" | "afternoon" | "dinner" | "evening",
          "duration": "e.g., 2 hours",
          "lat": number,
          "lng": number,
          "description": "Engaging detail about why this fits the user's interests.",
          "safetyRating": "High" | "Medium" | "Standard",
          "bookingUrl": "optional link"
        }}
      ]
    }}
  ]
}}

GUIDELINES:
1. STRICT DURATION: You MUST generate exactly {duration} days. No shortcuts, no skipping. If {duration} is 4, you MUST have Days 1, 2, 3, and 4.
2. DENSITY: Include 5 items per day: Breakfast, Morning Activity, Lunch, Afternoon Activity, and Dinner.
3. THREE MEALS: Every single day MUST include 'breakfast', 'lunch', and 'dinner' slots.
4. CONCISENESS: Descriptions MUST be under 100 characters. No fluff.
5. REAL PLACES: Prioritize the provided LOCAL KNOWLEDGE. If you run out of unique suggestions from the list, you MAY use your internal general knowledge for well-known attractions in {trip['destination']}.
6. BUDGET SPREADING: Distribute the ₹{trip['budget']} budget logically across the {duration} days.
7. SAFETY FIRST: Provide a comprehensive 'safetyAdvisory'.
8. HOTELS: Use a name from the 'topHotels' array for the final 'evening' slot in 'places' for EVERY day (category 'hotel'). DO NOT make up hotel names.
9. PRICING PRECISION: Use realistic, precise numbers.
10. LINKS & COORDINATES: For ALL places, you MUST include 'lat' and 'lng' values. Use coordinates from LOCAL KNOWLEDGE.
11. STRICT UNIQUENESS: EVERY suggestion must be unique. DO NOT repeat any restaurant or attraction across different days.
12. NO PLACEHOLDERS: BANNED names: "Landmark", "Generic", "Placeholder", "Public Park X", "Explore the local area at your own pace". Use full, real names of established places.
13. NO MARKDOWN: Return ONLY raw JSON.
14. RATINGS: Every place MUST include a realistic 'rating' (1.0-5.0, one decimal) and 'userRatingCount' (integer) based on your knowledge of real Google Maps/TripAdvisor data for that specific place. Use realistic numbers, e.g., rating: 4.7, userRatingCount: 2148.
"""

def calculate_costs(days, currency_symbol="₹"):
    summary = {
        "food": 0.0,
        "stay": 0.0,
        "activities": 0.0,
        "transport": 0.0,
        "total": 0.0
    }
    
    for day in days:
        day_item_sum = 0.0
        for place in day.get('places', []):
            cost_raw = place.get('estimatedCost')
            if cost_raw is None: cost_raw = 0.0
            
            # Robust currency parsing
            cost = 0.0
            if isinstance(cost_raw, (int, float)):
                cost = float(cost_raw)
            elif isinstance(cost_raw, str):
                try:
                    clean_str = cost_raw.replace(currency_symbol, "").replace("$", "").replace(",", "").strip()
                    cost = float(clean_str) if clean_str else 0.0
                except (ValueError, TypeError):
                    cost = 0.0
            
            category = place.get('category', '').lower()
            
            if category == "food":
                summary["food"] += cost
            elif category == "hotel":
                summary["stay"] += cost
            else:
                summary["activities"] += cost
            
            day_item_sum += cost
            
        # Standardize: 15% transport budget per day
        day_transport = round(day_item_sum * 0.15, 2)
        summary["transport"] += day_transport
        
        # Exact Day Total
        day["totalDayCost"] = round(day_item_sum + day_transport, 2)
    
    # Final Summary Sanity Check (Force items to sum up to total)
    summary["food"] = round(summary["food"], 2)
    summary["stay"] = round(summary["stay"], 2)
    summary["activities"] = round(summary["activities"], 2)
    summary["transport"] = round(summary["transport"], 2)
    summary["total"] = round(summary["food"] + summary["stay"] + summary["activities"] + summary["transport"], 2)
    
    return summary
    
    return summary

def get_mock_itinerary(trip, note="Mock response", real_hotels=None, real_restaurants=None, real_attractions=None):
    duration = trip.get('days', 3)
    dest = trip.get('destination', 'your destination')
    # Use neutral 0,0 if geocoding fails, but we'll try to find the real ones
    lat, lng = 0.0, 0.0
    
    # Try to get real coords for mock fallback
    try:
        from services.places import get_coordinates
        # Sanitizer: Fix common misspellings
        clean_dest = trip['destination'].replace("Kolkatta", "Kolkata").replace("Banglore", "Bengaluru").replace("kerela", "Kerala").replace("Kerela", "Kerala")
        res_lat, res_lng = get_coordinates(clean_dest)
        if res_lat is not None and res_lng is not None:
            lat, lng = res_lat, res_lng
            dest = clean_dest # Update dest name for display
    except:
        pass

    top_hotels = []
    if real_hotels:
        for h in real_hotels[:5]:
            # Ensure no double symbols (strip existing $ if any and prefix with ₹)
            price = str(h.get('rate_per_night', '3500')).replace('$', '').replace('₹', '').strip()
            clean_price = f"{DEFAULT_CURRENCY_SYMBOL}{price}"
            top_hotels.append({
                "name": h["name"],
                "price": clean_price,
                "description": h.get("description", "A great place to stay")[:100],
                "lat": h.get("lat"),
                "lng": h.get("lng"),
                "rating": h.get("rating", 4.5),
                "vibe": "Recommended"
            })
    
    if not top_hotels:
        top_hotels = [
            {"name": "Grand Riverside Hotel", "price": f"{DEFAULT_CURRENCY_SYMBOL}150", "description": "Luxury stay with a great view", "lat": lat + 0.002, "lng": lng - 0.002, "rating": 4.8, "vibe": "Luxury"},
            {"name": "City Center Lodge", "price": f"{DEFAULT_CURRENCY_SYMBOL}80", "description": "Authentic and cozy atmosphere", "lat": lat - 0.003, "lng": lng + 0.001, "rating": 4.2, "vibe": "Cozy"}
        ]

    hotel_name = top_hotels[0]["name"] if top_hotels else f"{dest} Stay"
    
    # Use real restaurants for meals if available
    real_restaurants = real_restaurants or []
    # Larger pools for more variety across many days
    breakfasts = [r["name"] for r in real_restaurants if "breakfast" in r.get("type", "").lower() or "cafe" in r.get("type", "").lower()]
    if not breakfasts: breakfasts = [r["name"] for r in real_restaurants[:5]]
    
    lunches = [r["name"] for r in real_restaurants if "lunch" in r.get("type", "").lower() or "restaurant" in r.get("type", "").lower()]
    if not lunches: lunches = [r["name"] for r in real_restaurants[5:15]]
    
    dinners = [r["name"] for r in real_restaurants if "dinner" in r.get("type", "").lower() or "fine dining" in r.get("type", "").lower()]
    if not dinners: dinners = [r["name"] for r in real_restaurants[15:25]]

    def get_meal(meal_list, default):
        import random
        if not meal_list: return default
        # Pop if list is long enough, otherwise just choice
        if len(meal_list) > 10:
             idx = random.randint(0, len(meal_list)-1)
             return meal_list.pop(idx)
        return random.choice(meal_list)

    # Use real attractions if available
    attr_pool = real_attractions if (real_attractions and len(real_attractions) > 5) else []
    
    mock_days = []
    for d_num in range(1, duration + 1):
        b_name = get_meal(breakfasts, f"{dest} Breakfast Spot")
        l_name = get_meal(lunches, f"Local {dest} Lunch")
        d_name = get_meal(dinners, f"Fine Dining in {dest}")
        
        # Pick 2 unique attractions per day
        import random
        day_attrs = random.sample(attr_pool, min(2, len(attr_pool))) if len(attr_pool) >= 4 else []
        
        # Realistic Fallback Names for Kolkata/General if pool is low
        generic_attrs = [
            "Victoria Memorial", "Howrah Bridge", "Dakshineswar Kali Temple", 
            "Indian Museum", "Eco Park", "Science City", "Princep Ghat",
            "Mothers Wax Museum", "Maidan", "St. Paul's Cathedral"
        ] if "Kolkata" in dest else [
            "City Center Plaza", "Historical Museum", "Local Botanical Garden",
            "Riverside Walk", "Culture Center", "Martyrs' Square", "Heritage Tower"
        ]
        
        def get_attr(pool, index, default_prefix):
             if index < len(pool):
                  return {"name": pool[index], "lat": lat + (0.005 * (index+1)), "lng": lng + 0.005, "description": "Famous local landmark."}
             return {"name": f"{dest} {default_prefix} {index+1}", "lat": lat + (0.005 * (index+1)), "lng": lng + 0.005, "description": "Famous local art and history."}

        attr_1 = day_attrs[0] if len(day_attrs) > 0 else get_attr(generic_attrs, (d_num-1)*2, "Landmark")
        attr_2 = day_attrs[1] if len(day_attrs) > 1 else get_attr(generic_attrs, (d_num-1)*2 + 1, "Public Park")

        mock_days.append({
            "dayNumber": d_num,
            "weatherNote": f"A wonderful day for exploration in {dest}.",
            "totalDayCost": 0.0,
            "places": [
                {"name": b_name, "category": "food", "estimatedCost": 500, "timeSlot": "breakfast", "duration": "1h", "lat": lat + 0.001, "lng": lng - 0.001, "description": f"Enjoy a local breakfast at {b_name} on Day {d_num}.", "safetyRating": "High"},
                {"name": attr_1["name"], "category": "attraction", "estimatedCost": 200, "timeSlot": "morning", "duration": "2h", "lat": attr_1.get("lat", lat), "lng": attr_1.get("lng", lng), "description": attr_1.get("description", "Famous local art and history."), "safetyRating": "High"},
                {"name": l_name, "category": "food", "estimatedCost": 800, "timeSlot": "lunch", "duration": "1h", "lat": lat - 0.005, "lng": lng + 0.008, "description": f"Authentic lunch experience at {l_name}.", "safetyRating": "High"},
                {"name": attr_2["name"], "category": "attraction", "estimatedCost": 200, "timeSlot": "afternoon", "duration": "2h", "lat": attr_2.get("lat", lat), "lng": attr_2.get("lng", lng), "description": attr_2.get("description", "A great place to explore."), "safetyRating": "High"},
                {"name": d_name, "category": "food", "estimatedCost": 1200, "timeSlot": "dinner", "duration": "2h", "lat": lat + 0.003, "lng": lng - 0.008, "description": f"Fine dining evening at {d_name}.", "safetyRating": "High"},
                {"name": f"{hotel_name}", "category": "hotel", "estimatedCost": 3500, "timeSlot": "evening", "duration": "overnight", "lat": lat, "lng": lng, "description": f"Comfortable stay at {hotel_name}.", "safetyRating": "High"}
            ]
        })
    
    return {
        "safetyAdvisory": f"NOTICE: The AI is currently at maximum capacity. This is a stabilized {dest} fallback itinerary. Please try 'Regenerate' in 60 seconds for premium AI results.",
        "travelTips": ["Carry a water bottle", "Use local transport"],
        "topHotels": top_hotels,
        "days": mock_days,
        "is_mock": True
    }

import time

def call_llm(prompt, trip, raw_json=False):
    start_time = time.time()
    def log(msg):
        timestamp = time.strftime('%H:%M:%S')
        print(f"[{timestamp}] DEBUG: {msg}", flush=True)
        try:
            with open("ai_debug.log", "a", encoding="utf-8") as f:
                f.write(f"[{timestamp}] {msg}\n")
        except:
            pass

    if os.getenv("MOCK_AI") == "true" or os.getenv("OFFLINE_MODE") == "true":
        mock = get_mock_itinerary(trip, real_hotels=trip.get("_real_hotels"), real_restaurants=trip.get("_real_restaurants"), real_attractions=trip.get("_real_attractions"))
        return json.dumps(mock) if raw_json else mock

    default_models = [
        "google/gemini-2.0-flash",             # (FREE) Primary High Performance
        "google/gemini-2.0-flash-lite",        # (FREE) Faster fallback
        "google/gemini-1.5-flash",             # (FREE) Stable Flash fallback
        "google/gemini-1.5-pro",               # (FREE) Last resort Pro
        "openrouter/google/gemini-2.0-flash-lite:free", # OpenRouter Free fallback
        "openrouter/google/gemini-2.0-flash:free",      # OpenRouter Free fallback
        "openrouter/meta-llama/llama-3.3-70b-instruct:free", # Llama fallback
        "openrouter/deepseek/deepseek-r1:free"          # DeepSeek fallback
    ]

    duration = trip.get('days', 3)
    models = default_models
    
    max_retries = 3
    retry_delay = 2 # Faster retries

    for attempt in range(max_retries):
        for model_name in models:
            try:
                log(f"Sending request to {model_name} - Attempt {attempt + 1}...")
                
                # Use Google Gen AI SDK ONLY for direct google/ IDs
                if model_name.startswith("google/") and "openrouter" not in model_name:
                    # Use Google Gen AI SDK directly
                    # clean model name: "google/gemini-1.5-flash" -> "gemini-1.5-flash"
                    google_model_id = model_name.replace("google/", "")
                    
                    response = client.models.generate_content(
                        model=google_model_id,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=0.7,
                            safety_settings=[
                                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"}
                            ]
                        )
                    )
                    res_text = response.text if response.text else None
                else:
                    # Use OpenRouter for everything else
                    # clean model name: "openrouter/google/gemini-2.0-flash:free" -> "google/gemini-2.0-flash:free"
                    or_model_id = model_name.replace("openrouter/", "")
                    res_text = call_openrouter(prompt, model=or_model_id)
                
                if not res_text:
                    log(f"Model {model_name} returned empty. Trying next model...")
                    continue

                text = res_text.strip()
                # Clean up potential markdown
                if "```" in text:
                    if "```json" in text:
                        text = text.split("```json")[1].split("```")[0]
                    else:
                        text = text.split("```")[1].split("```")[0]
                
                text = text.strip()
                # Use robust repair
                try:
                    parsed = json.loads(text)
                except json.JSONDecodeError:
                    log("WARNING: JSON parsing failed. Attempting robust repair...")
                    text = repair_json(text)
                    parsed = json.loads(text)
                
                if not isinstance(parsed, dict):
                    raise Exception("AI returned invalid data format (not a dictionary).")
                    
                log(f"JSON parsed successfully from {model_name}.")
                
                if raw_json:
                    return text
                
                parsed["_used_model"] = model_name
                return parsed

            except Exception as e:
                err_str = str(e)
                log(f"Model {model_name} failed: {err_str}")
                
                if "data policy" in err_str:
                    log("CRITICAL: OpenRouter requires 'Free model publication' to be enabled.")
                
                if any(x in err_str.lower() for x in ["429", "quota", "resource_exhausted", "capacity", "limit"]):
                    log(f"Quota/Limit issue with {model_name}. Jumping to next immediately...")
                    continue # Try the next model immediately
                
                if any(x in err_str.lower() for x in ["connection", "timeout", "503", "502"]):
                    log(f"Network issue with {model_name}. Jumping to next immediately...")
                    continue

                # For other errors, we might want to try the next model too
                continue

        # If we get here, all models in the list failed for this attempt
        if attempt < max_retries - 1:
            log(f"All models failed on attempt {attempt + 1}. Waiting {retry_delay}s...")
            time.sleep(retry_delay)
            retry_delay *= 2
        else:
            log("Final attempt failed for all models.")
            raise Exception("AI orchestration failed: All providers returned errors.")

            raise Exception("AI orchestration failed: All providers returned errors.")

def find_cached_itinerary(destination, days, budget_level=None):
    if itineraries_collection is None:
        return None
        
    print(f"DEBUG: Checking cache for {destination} ({days} days)...", flush=True)
    
    # query for case-insensitive destination and array size match
    query = {
        "destination": {"$regex": f"^{destination}$", "$options": "i"},
        "days": {"$size": days},
        "generatedFrom": "initial" # Only reuse initial generations, not regenerations which might be very specific
    }
    
    # If we saved budget_level in the past, use it. But for now, let's be lenient.
    # We prioritize the most recent one.
    cached = itineraries_collection.find_one(query, sort=[("createdAt", -1)])
    
    if cached:
        print(f"DEBUG: Cache HIT! Found itinerary {cached.get('itineraryId')}", flush=True)
    else:
        print("DEBUG: Cache MISS.", flush=True)
        
    return cached

def generate_itinerary(trip):
    # Sanitizer: Fix common misspellings early
    trip["destination"] = trip["destination"].replace("Kolkatta", "Kolkata").replace("Banglore", "Bengaluru").replace("kerela", "Kerala").replace("Kerela", "Kerala")
    dest = trip["destination"]
    duration = trip.get("days", 3)
    
    # 1. OPTIMIZATION: Check Cache First
    # Skip cache if we are in a special mode or User explicitly requested a fresh one (handled via API usually, but here we default to cache)
    cached_itinerary = find_cached_itinerary(dest, duration)
    
    if cached_itinerary:
        # Clone and return
        new_id = str(uuid.uuid4())
        print(f"DEBUG: Reusing cached itinerary. New ID: {new_id}", flush=True)
        
        # We must clone it thoroughly
        cached_itinerary["_id"] = new_id # valid for python dict to act as mongo insert
        cached_itinerary["itineraryId"] = new_id
        cached_itinerary["tripId"] = trip["trip_id"]
        cached_itinerary["userId"] = trip["user_id"]
        cached_itinerary["createdAt"] = datetime.now(timezone.utc).isoformat()
        cached_itinerary["updatedAt"] = datetime.now(timezone.utc).isoformat()
        cached_itinerary["isCachedResult"] = True
        
        # Save this "new" instance to DB so the user owns it
        if itineraries_collection is not None:
            # We need to ensure we don't carry over the old _id from mongo find
            save_data = cached_itinerary.copy()
            if "_id" in save_data: del save_data["_id"]
            itineraries_collection.insert_one(save_data)
            
        if "_id" in cached_itinerary: del cached_itinerary["_id"]
        return cached_itinerary

    print(f"\n>>> ITINERARY GENERATION ENGINE V2.2 <<<", flush=True)
    print(f"STARTING ITINERARY GENERATION for {trip['destination']} ({trip.get('days', '?')} days)", flush=True)
    
    all_places = []
    interests = trip.get("interests", [])
    
    # Always add Food and Hotels to interests to ensure we have real data
    search_interests = interests.copy()
    if not any(x in search_interests for x in ["Food", "Dining", "Restaurants"]):
        search_interests.append("Restaurants")
    if not any(x in search_interests for x in ["Hotels", "Accommodation", "Stay"]):
        search_interests.append("Hotels")
    
    # Speed Boost: Search top 3 interests
    real_attractions = []
    search_interests = search_interests[:3]
    if not any(x in search_interests for x in ["Attractions", "Sightseeing"]):
        search_interests.append("Top Attractions") # Fallback safety
    
    for interest in search_interests:
        found = get_places(trip["destination"], interest)
        real_attractions.extend(found)
        all_places.extend(found)
    
    # Increased for 7+ day trips (needs ~35 items total)
    prompt_places = all_places[:50]
    
    # Fetch real hotels
    duration = trip.get("days", 3)
    check_in = trip.get("start_date")
    check_out = trip.get("end_date")
    
    now_utc = datetime.now(timezone.utc)
    
    # ... date normalization logic ...
    if hasattr(check_in, 'strftime'):
        check_in = check_in.strftime("%Y-%m-%d")
    elif isinstance(check_in, str) and ' ' in check_in:
        check_in = check_in.split(' ')[0]
    elif isinstance(check_in, str) and 'T' in check_in:
        check_in = check_in.split('T')[0]
        
    if hasattr(check_out, 'strftime'):
        check_out = check_out.strftime("%Y-%m-%d")
    elif isinstance(check_out, str) and ' ' in check_out:
        check_out = check_out.split(' ')[0]
    elif isinstance(check_out, str) and 'T' in check_out:
        check_out = check_out.split('T')[0]
    
    if not check_in: check_in = (now_utc + timedelta(days=7)).strftime("%Y-%m-%d")
    if not check_out: check_out = (now_utc + timedelta(days=7+duration)).strftime("%Y-%m-%d")
    
    real_hotels = search_hotels(trip["destination"], check_in, check_out)
    real_restaurants = search_restaurants(trip["destination"])
    
    # NEW: Filter real data for uniqueness by name before injecting
    def filter_unique_by_name(data_list):
        seen = set()
        unique = []
        for item in data_list:
            name = item.get("name", "").strip().lower()
            if name and name not in seen:
                seen.add(name)
                unique.append(item)
        return unique

    if real_hotels:
        real_hotels = filter_unique_by_name(real_hotels)
        # Limit to top 10 hotels
        for hotel in real_hotels[:10]:
            # Convert USD to INR for prompt context if necessary
            price_raw = str(hotel.get("rate_per_night", "3500")).strip()
            if price_raw.startswith('$'):
                try:
                    usd_val = float(price_raw.replace('$', '').replace(',', '').strip())
                    inr_val = int(usd_val * 83)
                    est_cost = str(inr_val)
                except:
                    est_cost = "3500"
            else:
                est_cost = price_raw.replace('$', '').replace(DEFAULT_CURRENCY_SYMBOL, '').replace(',', '').strip()

            prompt_places.append({
                "name": hotel["name"],
                "category": "hotel",
                "description": hotel["description"][:100], # Trucate description
                "estimatedCost": est_cost,
                "bookingUrl": hotel.get("link"),
                "lat": hotel.get("lat"),
                "lng": hotel.get("lng")
            })

    if real_restaurants:
        real_restaurants = filter_unique_by_name(real_restaurants)
        # Limit to top 15 restaurants
        for res in real_restaurants[:15]:
            prompt_places.append({
                "name": res["name"],
                "category": "food",
                "description": res.get("type", "Restaurant") + " - " + res.get("description", "")[:100],
                "lat": res.get("lat"),
                "lng": res.get("lng")
            })
    
    # Fetch User Preferences
    currency_symbol = DEFAULT_CURRENCY_SYMBOL
    currency_code = DEFAULT_CURRENCY_CODE
    language = "English"

    if itineraries_collection is not None:
         # Try to find user preferences
         try:
             from backend.database.db import users_collection
             user = users_collection.find_one({"uid": trip.get("user_id")})
             if user and user.get("preferences"):
                 prefs = user.get("preferences")
                 
                 # Currency
                 curr_pref = prefs.get("currency", "INR")
                 if curr_pref == "USD":
                     currency_symbol = "$"
                     currency_code = "USD"
                 elif curr_pref == "EUR":
                     currency_symbol = "€"
                     currency_code = "EUR"
                 
                 # Language
                 language = prefs.get("language", "English")
                 print(f"DEBUG: Using User Prefs -> Currency: {currency_code}, Lang: {language}", flush=True)
         except Exception as e:
             print(f"DEBUG: Failed to load user prefs: {e}")

    weather = get_weather(trip["destination"])
    prompt = build_itinerary_prompt(trip, prompt_places, weather, currency_symbol=currency_symbol, language=language)
    
    # Attach real data to trip object temporarily for mock fallback access
    trip["_real_hotels"] = real_hotels
    trip["_real_restaurants"] = real_restaurants
    trip["_real_attractions"] = real_attractions
    
    try:
        raw_itinerary = call_llm(prompt, trip)
    except Exception as e:
        print(f"CRITICAL: AI Generation failed ({e}). Falling back to Mock Engine.", flush=True)
        raw_itinerary = get_mock_itinerary(trip, note="Fallback due to AI Error", real_hotels=real_hotels, real_restaurants=real_restaurants, real_attractions=real_attractions)
    
    # ---------------------------------------------------------
    # MASTER UNIQUENESS FILTER: Remove duplicate places by name
    # ---------------------------------------------------------
    seen_names = set()
    filtered_days = []
    
    for day in raw_itinerary.get("days", []):
        new_places = []
        # Reset seen_names per day for Meals? No, user wants absolute unique trip.
        # But we must allow Hotels to stay the same.
        for place in day.get("places", []):
            name = place.get("name", "").strip().lower()
            is_hotel = (place.get("category") == "hotel")
            
            is_duplicate = False
            if not is_hotel:
                if name in seen_names:
                    is_duplicate = True
                else:
                    # Fuzzy collision check
                    for seen in seen_names:
                        if (len(name) > 12 and name in seen) or (len(seen) > 12 and seen in name):
                            is_duplicate = True
                            break
            
            if not is_duplicate:
                new_places.append(place)
                if not is_hotel and name:
                    seen_names.add(name)
            else:
                 print(f"DEBUG: Filtering out duplicate: {place.get('name')}")
        
        # ENSURE AT LEAST 3 ITEMS SURVIVE (Safety fallback)
        if len(new_places) < 3 and day.get("places"):
             new_places = day.get("places") # Fallback to original if filter was too aggressive
             
        day["places"] = new_places
        filtered_days.append(day)
    
    raw_itinerary["days"] = filtered_days

    # ---------------------------------------------------------
    # COORDINATE REPAIR: Ensure all places have valid Lat/Lng
    # ---------------------------------------------------------
    print("DEBUG: Verifying coordinates for all places...", flush=True)
    for day in raw_itinerary.get("days", []):
        for place in day.get("places", []):
            try:
                # If lat/lng are 0, missing, or look like defaults, try to repair
                p_lat = place.get("lat")
                p_lng = place.get("lng")
                name = place.get("name")
                
                needs_repair = False
                if not p_lat or not p_lng: needs_repair = True
                if p_lat == 0 and p_lng == 0: needs_repair = True
                
                # If repair needed and we have a name
                if needs_repair and name and "Explore" not in name:
                    # Construct search query: "Place Name, Destination"
                    query = f"{name}, {trip['destination']}"
                    print(f"DEBUG: Repairing coords for '{query}'...", flush=True)
                    new_lat, new_lng = get_coordinates(query)
                    
                    if new_lat and new_lng:
                        place["lat"] = new_lat
                        place["lng"] = new_lng
                        print(f"DEBUG: Repaired -> {new_lat}, {new_lng}")
                    else:
                        # Fallback to destination center if specific place fails
                        # This prevents 0,0 ocean view
                        dest_lat, dest_lng = get_coordinates(trip['destination'])
                        if dest_lat:
                             place["lat"] = dest_lat
                             place["lng"] = dest_lng
                             print(f"DEBUG: Fallback to City Center -> {dest_lat}, {dest_lng}")

            except Exception as e:
                print(f"DEBUG: Coord repair failed for {place.get('name')}: {e}")

    
    # Verification: Ensure AI didn't skip days
    generated_days = raw_itinerary.get("days", [])
    if len(generated_days) < duration:
        print(f"WARNING: AI generated only {len(generated_days)} days out of {duration}. Appending placeholders.")
        # Fill missing days if LLM was lazy
        for d_num in range(len(generated_days) + 1, duration + 1):
            # Try to get center from first hotel or first found place
            ref_lat, ref_lng = 0.0, 0.0
            if prompt_places:
                ref_lat = prompt_places[0].get('lat', ref_lat if ref_lat is not None else 0)
                ref_lng = prompt_places[0].get('lng', ref_lng if ref_lng is not None else 0)

            generated_days.append({
                "dayNumber": d_num,
                "weatherNote": "Explore the local area at your own pace.",
                "totalDayCost": 0,
                "places": [
                    {
                        "name": f"Area Exploration (Day {d_num})",
                        "category": "attraction",
                        "estimatedCost": 0,
                        "timeSlot": "morning",
                        "duration": "flexible",
                        "lng": ref_lng,
                        "description": "A placeholder to help you navigate the city center."
                    }
                ]
            })
    
    # Enrich with cost summary and metadata
    cost_summary = calculate_costs(raw_itinerary.get("days", []), currency_symbol=currency_symbol)
    
    # FORCE REAL HOTELS: Always prioritize SerpApi results over AI or Mock data
    if real_hotels:
        print(f"DEBUG: Injecting {len(real_hotels)} real hotels from SerpApi.", flush=True)
        final_hotels = []
        for h in real_hotels[:5]:
            # Ensure no double symbols (strip both and prefix)
            price_raw = str(h.get('rate_per_night', '3500')).strip()
            
            # Convert USD to INR if necessary
            if price_raw.startswith('$'):
                try:
                    usd_val = float(price_raw.replace('$', '').replace(',', '').strip())
                    inr_val = int(usd_val * 83) # Standard conversion rate
                    clean_price = f"{DEFAULT_CURRENCY_SYMBOL}{inr_val}"
                except:
                    clean_price = f"{DEFAULT_CURRENCY_SYMBOL}3500"
            else:
                p_clean = price_raw.replace('$', '').replace(DEFAULT_CURRENCY_SYMBOL, '').replace(',', '').strip()
                clean_price = f"{DEFAULT_CURRENCY_SYMBOL}{p_clean}"
            final_hotels.append({
                "name": h["name"],
                "rating": h.get("rating", 4.5),
                "vibe": "Recommended",
                "description": h.get("description", "A great place to stay")[:100],
                "price": clean_price,
                "bookingUrl": h.get("link"),
                "lat": h.get("lat"),
                "lng": h.get("lng")
            })
    else:
        # Fallback to AI results only if real search failed
        final_hotels = raw_itinerary.get("topHotels", [])
        if not final_hotels:
            final_hotels = [
                {"name": "Local Recommended Stay", "price": f"{DEFAULT_CURRENCY_SYMBOL}3500", "description": "Highly rated local accommodation.", "lat": 0, "lng": 0, "rating": 4.5, "vibe": "Comfort"}
            ]

    itinerary_data = {
        "itineraryId": str(uuid.uuid4()),
        "tripId": trip["trip_id"],
        "userId": trip["user_id"],
        "destination": trip["destination"],
        "safetyAdvisory": raw_itinerary.get("safetyAdvisory", "Standard safety precautions apply."),
        "travelTips": raw_itinerary.get("travelTips", []),
        "topHotels": final_hotels,
        "days": generated_days,
        "costSummary": cost_summary,
        "currencySymbol": currency_symbol,
        "currencyCode": currency_code,
        "aiVersion": raw_itinerary.get("_used_model", "openai/gpt-oss-120b:free"),
        "generatedFrom": "initial",
        "lastPromptUsed": prompt,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
        # Metadata for caching
        "budgetLevel": trip.get("budget_level"),
        "interests": trip.get("interests", [])
    }
    
    # Save to dedicated collection
    if itineraries_collection is not None:
        itineraries_collection.insert_one(itinerary_data.copy())
        # Clean for response
        if "_id" in itinerary_data: del itinerary_data["_id"]
    
    # Convert datetimes to strings for JSON serialization
    itinerary_data["createdAt"] = itinerary_data["createdAt"].isoformat()
    itinerary_data["updatedAt"] = itinerary_data["updatedAt"].isoformat()
    
    print(f"COMPLETED ITINERARY GENERATION\n", flush=True)
    return itinerary_data

if __name__ == "__main__":
    test_trip = {
        "trip_id": "test-diag-" + str(uuid.uuid4())[:8],
        "user_id": "diag_user",
        "destination": "Paris",
        "budget": 2000,
        "interests": ["Museums", "Parks"],
        "days": 3,
        "travel_pace": "Balanced"
    }
    res = generate_itinerary(test_trip)
    print(f"Test Result: {json.dumps(res, indent=2)}")
