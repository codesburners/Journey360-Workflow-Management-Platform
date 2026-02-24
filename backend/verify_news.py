import requests
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

def log(msg):
    with open("news_log.txt", "a", encoding="utf-8") as f:
        f.write(str(msg) + "\n")
    print(msg)

with open("news_log.txt", "w") as f: f.write("Starting News Debug\n")

api_key = os.getenv("NEWS_API_KEY")
log(f"DEBUG: Checking NewsAPI Key: {api_key[:5]}..." if api_key else "DEBUG: No API Key found")

if not api_key:
    log("CRITICAL: Missing Key")
    exit(1)

try:
    url = f"https://newsapi.org/v2/everything?q=travel&apiKey={api_key}"
    res = requests.get(url, timeout=5)
    if res.status_code == 200:
        log("SUCCESS: NewsAPI is working.")
        try:
            log(f"Sample: {res.json()['articles'][0]['title']}")
        except:
            log("SUCCESS: Working but no articles found (unlikely for broad query).")
    else:
        log(f"FAILURE: NewsAPI returned {res.status_code}: {res.text}")
except Exception as e:
    log(f"ERROR: {e}")
