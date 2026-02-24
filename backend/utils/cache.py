import json
import os
import hashlib
from functools import wraps
from datetime import datetime, timedelta

CACHE_DIR = "backend/cache_data"

def ensure_cache_dir():
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR)

def get_cache_key(func_name, args, kwargs):
    # Create a unique key based on function name and arguments
    key_str = f"{func_name}:{str(args)}:{str(kwargs)}"
    return hashlib.md5(key_str.encode()).hexdigest()

def persistent_cache(duration_hours=24):
    """
    Decorator to cache function results to a JSON file.
    Default duration is 24 hours.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            ensure_cache_dir()
            
            # Generate key
            key = get_cache_key(func.__name__, args, kwargs)
            cache_file = os.path.join(CACHE_DIR, f"{key}.json")
            
            # Check if cache exists and is valid
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r') as f:
                        data = json.load(f)
                    
                    cached_time = datetime.fromisoformat(data['timestamp'])
                    if datetime.now() - cached_time < timedelta(hours=duration_hours):
                        print(f"DEBUG: Cache hit for {func.__name__}")
                        return data['result']
                except Exception as e:
                    print(f"Cache read error: {e}")
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Save to cache
            if result: # Only cache non-empty results
                try:
                    with open(cache_file, 'w') as f:
                        json.dump({
                            'timestamp': datetime.now().isoformat(),
                            'result': result
                        }, f)
                except Exception as e:
                    print(f"Cache write error: {e}")
            
            return result
        return wrapper
    return decorator
