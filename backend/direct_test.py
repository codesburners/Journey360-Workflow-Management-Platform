import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

try:
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content('Hello, test message')
    print("SUCCESS!")
    print(response.text)
except Exception as e:
    print(f"ERROR: {type(e).__name__}")
    print(f"Details: {e}")
    import traceback
    traceback.print_exc()
