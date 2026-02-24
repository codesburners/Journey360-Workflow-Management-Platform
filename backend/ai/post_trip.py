import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def generate_trip_summary(trip_data):
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return {"summary": "Gemini key missing."}

    prompt = f"""
    Create a beautiful, narrative travel summary based on this trip:
    Destination: {trip_data.get('destination')}
    Interests: {trip_data.get('interests')}
    Budget: {trip_data.get('budget')}
    
    The summary should look like a professional travel blog highlight or a 'memory' caption.
    Keep it around 150 words.
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        
        if response.text:
            return {"summary": response.text.strip()}
    except Exception as e:
        print(f"Post-Trip Gemini Error: {e}")

    return {"summary": "Your journey was filled with amazing memories. Take a moment to reflect on your adventures!"}

    return {"summary": "Your journey was filled with amazing memories. Take a moment to reflect on your adventures!"}

    return {"summary": "Your journey was filled with amazing memories. Take a moment to reflect on your adventures!"}
