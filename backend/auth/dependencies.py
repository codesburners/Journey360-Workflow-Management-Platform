from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

try:
    from backend.auth.firebase import verify_token
except ImportError:
    from auth.firebase import verify_token

security = HTTPBearer()

def get_current_user(auth: HTTPAuthorizationCredentials = Depends(security)):
    token = auth.credentials
    print(f"DEBUG AUTH: Received token starting with {token[:10]}...", flush=True)

    try:
        decoded = verify_token(token)
        print(f"DEBUG AUTH: Verification success for user {decoded.get('email', 'unknown')}", flush=True)
        return decoded
    except Exception as e:
        print(f"DEBUG AUTH: Verification failed: {str(e)}", flush=True)
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

