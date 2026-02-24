
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir))
load_dotenv()

from google import genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

try:
    with open("valid_models.txt", "w", encoding="utf-8") as f:
        for m in genai.list_models():
            f.write(f"{m.name}\n")
            
except Exception as e:
    with open("valid_models.txt", "w", encoding="utf-8") as f:
        f.write(f"ERROR: {e}")
