import sys
import os
from pathlib import Path

# Add backend to path to simulate being inside the app
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))

# Mock .env loading for this script if needed, but assistant.py does it too.
from dotenv import load_dotenv
load_dotenv(current_dir / '.env')

print("DEBUG: Starting Chatbot Logic Test...")
try:
    from ai.assistant import chat_with_assistant
    print("DEBUG: Module imported successfully.")
    
    print("DEBUG: Sending test message...")
    response = chat_with_assistant("Hello, are you working?")
    print(f"DEBUG: Response received: {response}")
    
except Exception as e:
    print(f"CRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()
