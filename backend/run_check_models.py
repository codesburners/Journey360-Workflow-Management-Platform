
import os
import sys
from dotenv import load_dotenv

# Redirect stdout and stderr to a file
log_file = open("check_models_log.txt", "w", encoding="utf-8")
sys.stdout = log_file
sys.stderr = log_file

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Load env vars
load_dotenv()

from google import genai

try:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    for model in client.models.list(config={'page_size': 100}):
        print(f"Model: {model.name}")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Error: {e}")

log_file.close()
