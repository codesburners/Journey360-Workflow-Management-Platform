from fastapi import APIRouter, Depends, HTTPException, Query
try:
    from backend.auth.dependencies import get_current_user
    from backend.database.db import saved_places_collection
    from backend.saved_places.models import SavedPlace
except ImportError:
    from auth.dependencies import get_current_user
    from database.db import saved_places_collection
    from saved_places.models import SavedPlace
from typing import List
import uuid
from datetime import datetime

router = APIRouter(prefix="/saved-places", tags=["Saved Places"])

@router.get("", response_model=List[SavedPlace])
async def get_saved_places(user=Depends(get_current_user)):
    if saved_places_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    cursor = saved_places_collection.find({
        "$or": [{"user_id": user["uid"]}, {"userId": user["uid"]}]
    })
    places = []
    for doc in cursor:
        doc.pop("_id", None)
        # Normalize legacy camelCase keys to snake_case for Pydantic
        if "placeId" in doc and "place_id" not in doc:
            doc["place_id"] = doc.pop("placeId")
        if "savedAt" in doc and "saved_at" not in doc:
            doc["saved_at"] = doc.pop("savedAt")
        if "userId" in doc and "user_id" not in doc:
            doc["user_id"] = doc.pop("userId")
        places.append(doc)
    
    return places

@router.post("", response_model=SavedPlace)

async def save_place(place: SavedPlace, user=Depends(get_current_user)):
    if saved_places_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # Ensure the user_id matches the authenticated user
    try:
        place_dict = place.model_dump()
    except AttributeError:
        place_dict = place.dict()
    place_dict["user_id"] = user["uid"]
    place_dict["uid"] = user["uid"] # Legacy/Redundancy check if needed, but schema uses user_id
    
    # Check if already exists to avoid duplicates (handles both old camelCase and new snake_case keys)
    existing = saved_places_collection.find_one({
        "user_id": user["uid"],
        "$or": [{"place_id": place.place_id}, {"placeId": place.place_id}]
    })
    if existing:
        existing.pop("_id", None)
        if "placeId" in existing and "place_id" not in existing:
            existing["place_id"] = existing.pop("placeId")
        return existing

    saved_places_collection.insert_one(place_dict)
    place_dict.pop("_id", None)
    return place_dict

@router.delete("/{place_id}")
async def remove_saved_place(place_id: str, user=Depends(get_current_user)):
    if saved_places_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    result = saved_places_collection.delete_one({
        "user_id": user["uid"],
        "$or": [{"place_id": place_id}, {"placeId": place_id}]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Place not found")
        
    return {"message": "Place removed successfully"}

@router.get("/check/{place_id}")
async def check_is_saved(place_id: str, user=Depends(get_current_user)):
    if saved_places_collection is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    existing = saved_places_collection.find_one({
        "user_id": user["uid"],
        "$or": [{"place_id": place_id}, {"placeId": place_id}]
    })
    return {"is_saved": bool(existing)}
