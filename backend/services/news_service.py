import requests
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

SAFETY_KEYWORDS = [
    "crime", "shooting", "attack", "riot",
    "protest", "flood", "earthquake",
    "fire", "explosion", "terror", "alert"
]

SEVERITY_MAP = {
    "earthquake": "High",
    "attack": "High",
    "terror": "High",
    "riot": "High",
    "flood": "High",
    "fire": "Medium",
    "protest": "Medium",
    "crime": "Medium",
}

def detect_severity(text: str) -> str:
    text = text.lower()
    for key, level in SEVERITY_MAP.items():
        if key in text:
            return level
    return "Low"

def get_safety_news(city: str, country: str, limit=5):
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        raise RuntimeError("NEWS_API_KEY missing")

    from_date = (datetime.utcnow() - timedelta(days=3)).strftime("%Y-%m-%d")

    # 1. Try Specific Local Search
    query = f"{city} {country} AND ({' OR '.join(SAFETY_KEYWORDS)})"
    params = {
        "q": query,
        "from": from_date,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": limit,
        "apiKey": api_key
    }
    
    try:
        # Reduced timeout to 3s to prevent hanging
        res = requests.get("https://newsapi.org/v2/everything", params=params, timeout=3)
        
        if res.status_code == 429:
            print("WARNING: NewsAPI Rate Limit Exceeded (429). returning empty.")
            return []
            
        if res.status_code != 200:
             print(f"NewsAPI Error {res.status_code}: {res.text}")
             return []

        data = res.json()
        articles_raw = data.get("articles", [])
        
        # 2. Fallback: National Search if Local is empty and country is known
        region_tag = "Local"
        if not articles_raw and country:
            print(f"DEBUG: No local news for {city}, trying {country} national news")
            query = f"{country} AND ({' OR '.join(SAFETY_KEYWORDS)})"
            params["q"] = query
            # Reduced timeout to 3s
            res = requests.get("https://newsapi.org/v2/everything", params=params, timeout=3)
            
            if res.status_code == 200:
                data = res.json()
                articles_raw = data.get("articles", [])
                region_tag = "National"

        articles = []
        for a in articles_raw:
            text = f"{a.get('title','')} {a.get('description','')}"
            articles.append({
                "title": a.get("title"),
                "source": a.get("source", {}).get("name"),
                "link": a.get("url"),
                "published": a.get("publishedAt", "").split("T")[0],
                "severity": detect_severity(text),
                "summary": a.get("description"),
                "region": region_tag  # UI can use this to show "National News" badge
            })

        return articles

    except Exception as e:
        print(f"News Fetch Error: {e}")
        return []