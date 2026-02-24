
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")

def get_destination_image(query):
    """
    Fetches a popular image for the given destination using SerpAPI (Google Images).
    Returns a URL string or None if not found.
    """
    if not SERPAPI_API_KEY:
        print("DEBUG: SERPAPI_API_KEY missing, jumping to fallback.")
        return None

    url = "https://serpapi.com/search"
    params = {
        "engine": "google_images",
        "q": f"{query} tourism",
        "api_key": SERPAPI_API_KEY,
        "num": 10,
        "safe": "active"
    }

    bad_domains = ["fbsbx", "facebook.com", "instagram.com", "lookaside"]

    try:
        response = requests.get(url, params=params, timeout=30)
        if response.status_code == 200:
            data = response.json()
            results = data.get("images_results", [])
            
            for result in results:
                image_url = result.get("original")
                if image_url:
                    # Check for bad domains
                    if any(bad in image_url.lower() for bad in bad_domains):
                        continue
                    return image_url
            
            # Fallback: if all filtered, return the first one anyways
            if results:
                return results[0].get("original")

    except Exception as e:
        print(f"DEBUG: Image fetch error for {query}: {e}")
    
    return None

