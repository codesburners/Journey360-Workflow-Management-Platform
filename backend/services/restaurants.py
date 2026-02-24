import os
import requests
from dotenv import load_dotenv

try:
    from backend.utils.cache import persistent_cache
except ImportError:
    from utils.cache import persistent_cache

load_dotenv()

@persistent_cache(duration_hours=48) # Cache restaurants longer
def search_restaurants(location):
    """
    Search for restaurants using SerpAPI's Google Local engine.
    Returns a list of restaurant dictionaries.
    """
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        print("Warning: SERPAPI_API_KEY not found in .env")
        return []

    url = "https://serpapi.com/search"
    params = {
        "engine": "google_local",
        "q": f"best restaurants in {location}",
        "api_key": api_key,
        "hl": "en",
        "gl": "in" # Default to 'in' for Indian searches, can be dynamic
    }

    try:
        response = requests.get(url, params=params, timeout=8)
        response.raise_for_status()
        data = response.json()
        
        results = data.get("local_results", [])
        restaurants = []
        
        for res in results[:10]: # Top 10 restaurants
            restaurants.append({
                "name": res.get("title"),
                "rating": res.get("rating"),
                "reviews": res.get("reviews"),
                "type": res.get("type"),
                "address": res.get("address"),
                "lat": res.get("gps_coordinates", {}).get("latitude"),
                "lng": res.get("gps_coordinates", {}).get("longitude"),
                "description": res.get("description", f"Highly rated local dining in {location}.")
            })
            
        return restaurants
    except Exception as e:
        print(f"Error searching restaurants: {e}")
        return []

if __name__ == "__main__":
    # Test call
    results = search_restaurants("Vellore")
    print(f"Found {len(results)} restaurants in Vellore:")
    for r in results:
        print(f"- {r['name']} ({r['rating']})")
