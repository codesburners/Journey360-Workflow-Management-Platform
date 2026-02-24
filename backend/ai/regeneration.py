import json
import os
import requests
import uuid
from datetime import datetime
try:
    from backend.database.db import itineraries_collection
    from backend.ai.itinerary import (
        calculate_costs, get_mock_itinerary, call_llm,
        DEFAULT_CURRENCY_SYMBOL, DEFAULT_CURRENCY_CODE
    )
    from backend.trips.schema import Itinerary
except ImportError:
    from database.db import itineraries_collection
    from ai.itinerary import (
        calculate_costs, get_mock_itinerary, call_llm, 
        DEFAULT_CURRENCY_SYMBOL, DEFAULT_CURRENCY_CODE
    )
    from trips.schema import Itinerary

def build_regeneration_prompt(trip, current_itinerary, instruction, constraints, currency_symbol="₹", language="English"):
    itinerary_days_json = json.dumps(current_itinerary.get("days", []), indent=2)
    top_hotels_json = json.dumps(current_itinerary.get("topHotels", []), indent=2)
    
    return f"""
You are 'Journey360 AI', an expert travel consultant.
You are helping a user modify their existing itinerary for {trip['destination']} in {language}. 

Current Itinerary Days:
{itinerary_days_json}

Available Recommended Hotels (for selection):
{top_hotels_json}

User Instruction: {instruction}
Additional Constraints: {constraints}

Task: Modify the existing itinerary based on the user's instruction.
Rules:
1. Preserve as much of the original structure as possible.
2. ONLY update parts that need changing to satisfy the instruction.
3. Keep the JSON structure identical to the input.
4. Ensure costs are updated if activities change.
5. HOTELS: If the user wants to change the hotel, strictly use one from the 'Available Recommended Hotels' list.
6. Strictly return JSON only.

JSON Structure:
{{
  "topHotels": [
    {{
      "name": "string",
      "rating": number,
      "vibe": "string",
      "description": "string",
      "price": "string",
      "bookingUrl": "string",
      "lat": number,
      "lng": number
    }}
  ],
  "days": [
    {{
      "dayNumber": 1,
      "weatherNote": "string",
      "places": [
        {{
          "name": "string",
          "category": "attraction" | "food" | "hotel",
          "estimatedCost": number,
          "timeSlot": "breakfast" | "morning" | "lunch" | "afternoon" | "dinner" | "evening",
          "duration": "string"
        }}
      ]
    }}
  ]
}}
"""

def regenerate_itinerary(trip, existing_itinerary, instruction, constraints):
    print(f"\nSTARTING ITINERARY REGENERATION for {trip['destination']}", flush=True)
    
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
                 print(f"DEBUG: Using User Prefs for Regen -> Currency: {currency_code}, Lang: {language}", flush=True)
         except Exception as e:
             print(f"DEBUG: Failed to load user prefs for regen: {e}")

    prompt = build_regeneration_prompt(trip, existing_itinerary, instruction, constraints, currency_symbol=currency_symbol, language=language)
    
    # Debug: Save prompt and response for inspection
    try:
        with open("ai_debug.log", "a", encoding="utf-8") as f:
            f.write(f"\n--- REGEN PROMPT {datetime.now()} ---\n{prompt}\n")
    except: pass

    raw_itinerary_str = call_llm(prompt, trip, raw_json=True) # Request raw string if available
    
    try:
        with open("ai_debug.log", "a", encoding="utf-8") as f:
            f.write(f"\n--- REGEN RESPONSE ---\n{raw_itinerary_str}\n")
    except: pass

    # Parse JSON
    try:
        raw_itinerary = json.loads(raw_itinerary_str) if isinstance(raw_itinerary_str, str) else raw_itinerary_str
    except Exception as e:
        print(f"ERROR: Failed to parse Regen JSON: {e}")
        raw_itinerary = existing_itinerary
    
    if not raw_itinerary:
        print("ERROR: LLM returned None. Falling back to existing itinerary structure.")
        raw_itinerary = existing_itinerary
    
    # Recalculate costs
    cost_summary = calculate_costs(raw_itinerary.get("days", []), currency_symbol=currency_symbol)
    
    raw_days = raw_itinerary.get("days", [])
    if not raw_days:
        raw_days = existing_itinerary.get("days", [])
    
    # ---------------------------------------------------------
    # COORDINATE REPAIR: Ensure all places have valid Lat/Lng
    # ---------------------------------------------------------
    try:
        from backend.services.places import get_coordinates
    except ImportError:
        from services.places import get_coordinates
        
    print("DEBUG: Verifying coordinates for regenerated places...", flush=True)
    for day in raw_days:
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
                        dest_lat, dest_lng = get_coordinates(trip['destination'])
                        if dest_lat:
                             place["lat"] = dest_lat
                             place["lng"] = dest_lng
            except Exception as e:
                print(f"DEBUG: Coord repair failed for {place.get('name')}: {e}")

    updated_itinerary = {
        "days": raw_days,
        "topHotels": raw_itinerary.get("topHotels", existing_itinerary.get("topHotels", [])),
        "safetyAdvisory": raw_itinerary.get("safetyAdvisory", existing_itinerary.get("safetyAdvisory", "Standard precautions.")),
        "travelTips": raw_itinerary.get("travelTips", existing_itinerary.get("travelTips", [])),
        "costSummary": cost_summary,
        "currencySymbol": currency_symbol,
        "currencyCode": currency_code,
        "generatedFrom": "regenerate",
        "lastPromptUsed": prompt,
        "updatedAt": datetime.utcnow()
    }
    
    # Update in DB
    if itineraries_collection is not None:
        itineraries_collection.update_one(
            {"itineraryId": existing_itinerary["itineraryId"]},
            {"$set": updated_itinerary}
        )
    
    # Fetch full updated document
    itinerary = itineraries_collection.find_one({"itineraryId": existing_itinerary["itineraryId"]})
    if itinerary and "_id" in itinerary: del itinerary["_id"]
    
    # Convert datetimes to strings for JSON serialization
    if itinerary:
        if "createdAt" in itinerary and isinstance(itinerary["createdAt"], datetime):
            itinerary["createdAt"] = itinerary["createdAt"].isoformat()
        if "updatedAt" in itinerary and isinstance(itinerary["updatedAt"], datetime):
            itinerary["updatedAt"] = itinerary["updatedAt"].isoformat()
    
    print(f"COMPLETED ITINERARY REGENERATION\n", flush=True)
    return itinerary
