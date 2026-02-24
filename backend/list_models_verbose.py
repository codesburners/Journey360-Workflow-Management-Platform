import os
import sys
from google import genai
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend folder
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")
print(f"DEBUG: API Key loaded: {api_key[:5]}...{api_key[-3:] if api_key else 'None'}")

if not api_key:
    print("CRITICAL: No API Key found")
    sys.exit(1)

try:
    client = genai.Client(api_key=api_key)
    print("DEBUG: Client initialized. Listing models...")
    
    # Try generic list
    pager = client.models.list()
    count = 0
    for model in pager:
        count += 1
        methods = model.supported_generation_methods
        print(f"FOUND: {model.name} (Methods: {methods})")
        
    print(f"DEBUG: Total models found: {count}")

except Exception as e:
    print(f"CRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()
