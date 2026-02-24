import sys
import os
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir))

from backend.ai.assistant import chat_with_assistant

print("Testing chatbot...")
response = chat_with_assistant("Hello! Can you help me plan a trip to Paris?")
print(f"\nResponse: {response}")
