from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
try:
    from backend.auth.dependencies import get_current_user
    from backend.database.db import users_collection, trips_collection
    from backend.users.schema import User as UserSchema
except ImportError:
    from auth.dependencies import get_current_user
    from database.db import users_collection, trips_collection
    from users.schema import User as UserSchema
from firebase_admin import auth

router = APIRouter(prefix="/users", tags=["Users"])

class UserUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    bio: str | None = None
    dob: str | None = None
    photo_url: str | None = None
    preferences: dict | None = None

@router.get("/me", response_model=UserSchema)
async def get_my_profile(user=Depends(get_current_user)):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        db_user = users_collection.find_one({"uid": user["uid"]})
        
        # Start with required fields from the token
        result = {
            "uid": user["uid"],
            "email": user["email"],
            "created_at": datetime.utcnow().isoformat(),
            "two_factor_enabled": False
        }
        
        if db_user:
            db_user.pop("_id", None)
            # Ensure MongoDB datetime objects are not causing issues, 
            # though Pydantic usually handles them fine.
            result.update(db_user)
            
        print(f"DEBUG: Returning profile for {result.get('email')}")
        return result
    except Exception as e:
        print(f"ERROR fetching profile: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/me", response_model=UserSchema)
async def update_my_profile(update_data: UserUpdate, user=Depends(get_current_user)):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        # Use model_dump for Pydantic v2, fallback to .dict() for v1
        try:
            update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        except AttributeError:
            update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        
        # Always include email/uid in the document set if upserting
        update_dict["email"] = user["email"]
        update_dict["uid"] = user["uid"]

        users_collection.update_one(
            {"uid": user["uid"]},
            {"$set": update_dict},
            upsert=True
        )
        
        updated_user = users_collection.find_one({"uid": user["uid"]})
        if updated_user:
            updated_user.pop("_id", None)
        
        # Ensure even the fresh returned object has all required schema fields
        final_user = {
            "uid": user["uid"],
            "email": user["email"],
            "created_at": datetime.utcnow().isoformat(),
            "two_factor_enabled": False
        }
        if updated_user:
            final_user.update(updated_user)
            
        return final_user
    except Exception as e:
        print(f"ERROR updating profile: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/me")
async def delete_my_account(user=Depends(get_current_user)):
    uid = user["uid"]
    
    # 1. Delete from MongoDB Users
    if users_collection is not None:
        users_collection.delete_one({"uid": uid})
    
    # 2. Delete from MongoDB Trips
    if trips_collection is not None:
        trips_collection.delete_many({"user_id": uid})
        
    # 3. Delete from Firebase Auth
    try:
        auth.delete_user(uid)
    except Exception as e:
        print(f"Error deleting firebase user: {e}")
        # Log error but proceed as data is wiped locally
        
    return {"message": "Account deleted successfully"}

@router.post("/test-notify")
async def test_notification(user=Depends(get_current_user)):
    try:
        from backend.services.notification import notification_service
    except ImportError:
        from services.notification import notification_service
    
    await notification_service.send_email(
        to_email=user["email"],
        subject="Test Notification from Journey360",
        content=f"Hello {user.get('name', 'Traveler')}, this is a test notification verifying your settings are active."
    )
    
    return {"message": "Test notification sent (check server logs)"}

import pyotp

@router.post("/2fa/setup")
async def setup_2fa(user=Depends(get_current_user)):
    # Generate a random secret
    secret = pyotp.random_base32()
    
    # Generate the otpauth URL for QR codes
    # format: otpauth://totp/Issuer:AccountName?secret=SECRET&issuer=Issuer
    uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user["email"], 
        issuer_name="Journey360"
    )
    
    # Store secret temporarily (or permanently but marked disabled)
    # We update the user record with the secret but keep enabled=False until verified
    if users_collection is not None:
        users_collection.update_one(
            {"uid": user["uid"]},
            {"$set": {"two_factor_secret": secret, "two_factor_enabled": False}},
            upsert=True
        )
        
    return {"secret": secret, "otpauth_url": uri}

class Verify2FARequest(BaseModel):
    code: str

@router.post("/2fa/verify")
async def verify_2fa(data: Verify2FARequest, user=Depends(get_current_user)):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    db_user = users_collection.find_one({"uid": user["uid"]})
    if not db_user or not db_user.get("two_factor_secret"):
        raise HTTPException(status_code=400, detail="2FA not set up. Call /setup first.")
    
    secret = db_user["two_factor_secret"]
    totp = pyotp.TOTP(secret)
    
    if totp.verify(data.code):
        # Verification successful, enable 2FA
        users_collection.update_one(
            {"uid": user["uid"]},
            {"$set": {"two_factor_enabled": True}}
        )
        return {"message": "2FA Enabled Successfully", "enabled": True}
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code")

@router.post("/2fa/disable")
async def disable_2fa(user=Depends(get_current_user)):
    if users_collection is not None:
        users_collection.update_one(
            {"uid": user["uid"]},
            {"$set": {"two_factor_enabled": False, "two_factor_secret": None}}
        )
    return {"message": "2FA Disabled", "enabled": False}
