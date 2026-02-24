import os
import requests
from dotenv import load_dotenv

load_dotenv()

def get_weather(city):
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return {"weather": [{"description": "unknown"}], "main": {"temp": 25.0}}

    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"DEBUG: Weather API Error: {e}")
    
    return {
        "weather": [{"description": "clear sky"}],
        "main": {"temp": 25.0}
    }
