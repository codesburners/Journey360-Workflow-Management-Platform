"""
Reviews Service — Dual API: SerpAPI (Primary) + Foursquare (Fallback)
Fetches real place ratings and review counts.
24-hour in-memory cache to minimize API calls.
"""

import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_API_KEY")
FOURSQUARE_KEY = os.getenv("FOURSQUARE_API_KEY")

# In-memory cache: key = (place_name, destination) -> {data, timestamp}
_reviews_cache = {}
CACHE_TTL = 86400  # 24 hours


def _fetch_serpapi(place_name: str, destination: str) -> dict:
    """Primary: SerpAPI Google Maps (100 free searches/month)."""
    if not SERPAPI_KEY:
        return None

    try:
        query = f"{place_name}, {destination}"
        resp = requests.get("https://serpapi.com/search", params={
            "engine": "google_maps",
            "q": query,
            "api_key": SERPAPI_KEY,
            "type": "search",
            "hl": "en"
        }, timeout=10)

        if resp.status_code != 200:
            print(f"REVIEWS [SerpAPI]: HTTP {resp.status_code} for '{query}'", flush=True)
            return None

        results = resp.json().get("local_results", [])
        if not results:
            return None

        first = results[0]
        return {
            "rating": first.get("rating", 0),
            "totalReviews": first.get("reviews", 0),
            "source": "google"
        }
    except Exception as e:
        print(f"REVIEWS [SerpAPI]: Error for '{place_name}': {e}", flush=True)
        return None


def _fetch_foursquare(place_name: str, destination: str) -> dict:
    """Fallback: Foursquare Places API v3 (free tier, no credit card)."""
    if not FOURSQUARE_KEY:
        return None

    try:
        # Step 1: Search for the place
        headers = {
            "Authorization": FOURSQUARE_KEY,
            "Accept": "application/json"
        }
        search_resp = requests.get("https://api.foursquare.com/v3/places/search", params={
            "query": place_name,
            "near": destination,
            "limit": 1
        }, headers=headers, timeout=10)

        if search_resp.status_code != 200:
            print(f"REVIEWS [Foursquare]: Search HTTP {search_resp.status_code} for '{place_name}'", flush=True)
            return None

        results = search_resp.json().get("results", [])
        if not results:
            return None

        fsq_id = results[0].get("fsq_id")
        if not fsq_id:
            return None

        # Step 2: Get details with rating
        detail_resp = requests.get(
            f"https://api.foursquare.com/v3/places/{fsq_id}",
            params={"fields": "rating,stats"},
            headers=headers,
            timeout=10
        )

        if detail_resp.status_code != 200:
            return None

        detail = detail_resp.json()
        raw_rating = detail.get("rating")  # Foursquare uses 0-10 scale
        stats = detail.get("stats", {})

        if raw_rating is None:
            return None

        return {
            "rating": round(raw_rating / 2, 1),  # Convert 10-scale to 5-scale
            "totalReviews": stats.get("total_ratings", 0),
            "source": "foursquare"
        }
    except Exception as e:
        print(f"REVIEWS [Foursquare]: Error for '{place_name}': {e}", flush=True)
        return None


def get_place_reviews(place_name: str, destination: str) -> dict:
    """
    Fetch rating + review count. Tries SerpAPI first, then Foursquare.
    Returns: {"rating": float, "totalReviews": int, "source": str, "cached": bool}
    """
    cache_key = (place_name.lower().strip(), destination.lower().strip())

    # Check cache
    if cache_key in _reviews_cache:
        entry = _reviews_cache[cache_key]
        if time.time() - entry["timestamp"] < CACHE_TTL:
            return {**entry["data"], "cached": True}

    # Try SerpAPI first
    result = _fetch_serpapi(place_name, destination)

    # Fallback to Foursquare
    if result is None:
        result = _fetch_foursquare(place_name, destination)

    if result is None:
        return None

    # Cache it
    _reviews_cache[cache_key] = {
        "data": result,
        "timestamp": time.time()
    }

    print(f"REVIEWS: {result['rating']}★ ({result['totalReviews']} reviews) for '{place_name}' via {result['source']}", flush=True)
    return {**result, "cached": False}
