import os
import requests
from dotenv import load_dotenv
try:
    from backend.services.places import get_coordinates
except ImportError:
    from services.places import get_coordinates

try:
    from backend.utils.cache import persistent_cache
except ImportError:
    from utils.cache import persistent_cache

load_dotenv()

@persistent_cache(duration_hours=24)
def search_hotels(location, check_in_date=None, check_out_date=None):
    """
    Search for hotels using SerpAPI's Google Hotels engine.
    Returns a list of hotel dictionaries.
    """
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        print("Warning: SERPAPI_API_KEY not found in .env")
        return []

    url = "https://serpapi.com/search"
    from datetime import datetime, timedelta
    
    # SerpAPI's google_hotels engine MANDATES check_in_date and check_out_date
    if not check_in_date or not check_out_date:
        now = datetime.now()
        # Default to 7 days from now for a 2-day stay
        if not check_in_date:
            check_in_date = (now + timedelta(days=7)).strftime("%Y-%m-%d")
        if not check_out_date:
            check_out_date = (now + timedelta(days=9)).strftime("%Y-%m-%d")

    params = {
        "engine": "google_hotels",
        "q": f"Hotels in {location}",
        "api_key": api_key,
        "hl": "en",
        "gl": "in",
        "currency": "INR", # Explicitly request INR
        "check_in_date": check_in_date,
        "check_out_date": check_out_date
    }

    try:
        print(f"DEBUG: Searching hotels in {location} ({check_in_date} to {check_out_date})...", flush=True)
        response = requests.get(url, params=params, timeout=8)
        response.raise_for_status()
        data = response.json()
        
        hotels = []
        # SerpAPI returns results under 'properties' for google_hotels
        properties = data.get("properties", [])
        
        for prop in properties[:5]:
            lat = prop.get("gps_coordinates", {}).get("latitude")
            lng = prop.get("gps_coordinates", {}).get("longitude")
            
            if not lat or not lng:
                # Fallback to geocoding the hotel name
                lat, lng = get_coordinates(f"{prop.get('name')} {location}")

            hotels.append({
                "name": prop.get("name"),
                "description": prop.get("description", "Premium accommodation found via Google Hotels."),
                "rate_per_night": prop.get("rate_per_night", {}).get("lowest"),
                "total_rate": prop.get("total_rate", {}).get("lowest"),
                "rating": prop.get("overall_rating"),
                "reviews": prop.get("reviews"),
                "amenities": prop.get("amenities", [])[:3], # Top 3 amenities
                "link": prop.get("link"),
                "lat": lat,
                "lng": lng
            })
            
        return hotels
    except Exception as e:
        print(f"Error searching hotels: {e}")
        return []

if __name__ == "__main__":
    # Test call
    results = search_hotels("Paris", "2026-05-10", "2026-05-12")
    print(f"Found {len(results)} hotels in Paris:")
    for h in results:
        print(f"- {h['name']} ({h['rate_per_night']})")
