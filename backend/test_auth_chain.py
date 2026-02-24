"""Quick auth chain test - outputs to file"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'), override=True)

results = []

# Step 1
try:
    from auth.firebase import verify_token
    results.append("1. auth.firebase OK")
except Exception as e:
    results.append(f"1. auth.firebase FAILED: {e}")

# Step 2
try:
    from auth.dependencies import get_current_user
    results.append("2. auth.dependencies OK")
except Exception as e:
    results.append(f"2. auth.dependencies FAILED: {e}")

# Step 3
try:
    from jose import jwt
    results.append("3. python-jose OK")
except Exception as e:
    results.append(f"3. python-jose FAILED: {e}")

# Step 4
try:
    from trips.routes import router
    results.append(f"4. trips.routes OK ({len(router.routes)} routes)")
except Exception as e:
    results.append(f"4. trips.routes FAILED: {e}")

# Step 5
try:
    from users.routes import router as ur
    results.append(f"5. users.routes OK ({len(ur.routes)} routes)")
except Exception as e:
    results.append(f"5. users.routes FAILED: {e}")

# Step 6
try:
    from main import app
    results.append(f"6. main.app OK ({len(app.routes)} total routes)")
except Exception as e:
    results.append(f"6. main.app FAILED: {e}")
    import traceback
    results.append(traceback.format_exc())

output = "\n".join(results)
with open("diag_result.txt", "w", encoding="utf-8") as f:
    f.write(output)
