import os
import requests
import json
import time

def call_openrouter(prompt, system_prompt=None, model="openai/gpt-oss-120b:free"):
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("DEBUG: OPENROUTER_API_KEY not found.")
        return None

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Journey360"
    }

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    data = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "top_p": 0.95,
        "max_tokens": 1700  # Adjusted for remaining user credits
    }

    try:
        print(f"DEBUG: Calling OpenRouter ({model})...")
        response = requests.post(url, headers=headers, json=data, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            choices = result.get('choices', [])
            if not choices:
                print(f"DEBUG: OpenRouter success but NO CHOICES returned. Full response: {result}")
                return None
                
            content = choices[0].get('message', {}).get('content')
            if not content:
                print(f"DEBUG: OpenRouter success but EMPTY CONTENT. Full response: {result}")
                return ""
                
            print(f"DEBUG: OpenRouter call successful ({len(content)} chars).")
            return content
        else:
            print(f"DEBUG: OpenRouter error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"DEBUG: OpenRouter exception: {e}")
        return None
