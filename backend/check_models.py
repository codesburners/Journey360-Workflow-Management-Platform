import os
import pathlib
import sys
from dotenv import load_dotenv

# Add project root to path
backend_dir = pathlib.Path(os.getcwd())
if backend_dir.name != 'backend':
    # If running from root
    sys.path.append(str(backend_dir))
else:
    # If running from backend
    sys.path.append(str(backend_dir.parent))

load_dotenv()

try:
    from google import genai
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found in .env")
        sys.exit(1)
        
    client = genai.Client(api_key=api_key)
    
    print("Listing available models...")
    # The SDK listing method might vary, trying standard approach
    try:
        # Some SDK versions use list_models() on the client or models module
        if hasattr(client, 'models') and hasattr(client.models, 'list'):
            for m in client.models.list():
                print(f"- {m.name}")
        elif hasattr(genai, 'list_models'):
             for m in genai.list_models():
                print(f"- {m.name}") 
        else:
             print("Could not find list methods. Trying generic 'gemini-1.5-flash' generation...")
             response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents="Hello"
             )
             print("Success: gemini-1.5-flash works!")
             
    except Exception as e:
         print(f"Error listing models: {e}")
         
except ImportError:
    print("Error: google-genai package not installed or import error.")
except Exception as e:
    print(f"Unexpected error: {e}")
