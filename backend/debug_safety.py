import os
import sys

# Add current directory to path so we can import modules
sys.path.append(os.getcwd())

from dotenv import load_dotenv
load_dotenv()

print(f"News API Key Present: {bool(os.getenv('NEWS_API_KEY'))}")
print(f"Gemini API Key Present: {bool(os.getenv('GEMINI_API_KEY'))}")

try:
    from ai.safety import assess_safety
    print("Import successful. Running assessment for 'Bangalore'...")
    result = assess_safety("Bangalore")
    print("Result:")
    import json
    print(json.dumps(result, indent=2))
except Exception as e:
    with open("error_log.txt", "w") as f:
        f.write(f"CRITICAL ERROR: {str(e)}\n")
        import traceback
        traceback.print_exc(file=f)
    print("Error written to error_log.txt")
