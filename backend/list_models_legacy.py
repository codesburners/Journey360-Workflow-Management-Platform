import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"Testing with key: {api_key[:10]}...")

genai.configure(api_key=api_key)

try:
    print("Listing models using google-generativeai...")
    with open("models.txt", "w") as f:
        for model in genai.list_models():
            line = f"Model: {model.name}, Methods: {model.supported_generation_methods}\n"
            print(line.strip())
            f.write(line)
except Exception as e:
    print(f"Error: {e}")
