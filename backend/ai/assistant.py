import os
import google.generativeai as genai
from dotenv import load_dotenv
import datetime

load_dotenv()

def chat_with_assistant(user_message, trip_context=None):
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return {"reply": "I'm sorry, but my travel brain isn't configured yet! Please check the API settings."}

    try:
        # Configure the stable SDK
        genai.configure(api_key=gemini_key)
        
        system_prompt = "You are Journey360 AI, a helpful and knowledgeable travel assistant. "
        if trip_context:
            system_prompt += f"Context: The user is planning a trip to {trip_context.get('destination', 'their destination')} "
            system_prompt += f"with a budget of {trip_context.get('budget', 'unknown')} and interests in {trip_context.get('interests', 'various things')}. "
        
        system_prompt += "Provide concise, helpful, and friendly advice."

        # Combine system prompt and user message
        full_prompt = f"{system_prompt}\n\nUser: {user_message}"
        
        # Use the stable SDK with proven model names
        import time
        models_to_try = [
            'gemini-2.5-flash',
            'gemini-2.5-pro',
            'gemini-pro'
        ]
        
        retry_delay = 5
        max_retries = 5
        
        for model_name in models_to_try:
            for attempt in range(max_retries):
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(full_prompt)
                    
                    if response.text:
                        return {"reply": response.text.strip()}
                except Exception as e:
                    err_str = str(e)

                    # Handle Permission Denied (403) - Key Leaked/Invalid
                    if "403" in err_str or "PERMISSION_DENIED" in err_str:
                         print("CRITICAL: API Key Invalid or Leaked.")
                         return {"reply": "⚠️ System Alert: The AI API Key is invalid or has been revoked. Please update the API key in settings."}
                    
                    # If 404 (Not Found) or 400 (Invalid), fail immediately to next model
                    if "404" in err_str or "NOT_FOUND" in err_str or "400" in err_str:
                        break

                    # Handle Rate Limit (429)
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        if attempt < max_retries - 1:
                            time.sleep(retry_delay)
                            retry_delay *= 2
                            continue
                    
                    # For other unexpected errors, try next model
                    break
        
        # If we exit loops without returning
        raise Exception("All models failed.")
    except Exception as e:
        print(f"Assistant Gemini Error: {type(e).__name__}: {e}")

        try:
            with open("gemini_error.log", "a") as f:
                f.write(f"{datetime.datetime.now()}: {type(e).__name__}: {e}\n")
        except:
            pass

    return {"reply": "I'm having trouble connecting to my travel brain right now. It might be a model configuration issue or API quota. Please try again."}
