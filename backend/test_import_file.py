try:
    from google import genai
    with open("test_result.txt", "w") as f:
        f.write("Import successful")
except Exception as e:
    with open("test_result.txt", "w") as f:
        f.write(f"Error: {e}")
