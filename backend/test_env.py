print("Hello world")
try:
    import dotenv
    print("dotenv imported")
except ImportError as e:
    print(f"dotenv import failed: {e}")
