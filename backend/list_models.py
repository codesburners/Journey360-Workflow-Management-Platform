import os
from google import genai
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend folder
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("No API Key found")
    exit(1)

client = genai.Client(api_key=api_key)

print("Listing models...")
try:
    # client.models.list() returns an iterator
    pager = client.models.list()
    for model in pager:
        print(f"Model: {model.name}")
        # print(dir(model)) # Debug
        continue
except Exception as e:
    print(f"Error listing models: {e}")
