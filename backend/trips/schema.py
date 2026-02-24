from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

class Place(BaseModel):
    name: str
    category: str  # attraction / food / hotel
    lat: Optional[float] = None
    lng: Optional[float] = None
    estimated_cost: float = Field(default=0.0, alias="estimatedCost")
    duration: Optional[str] = None
    time_slot: str = Field(alias="timeSlot") # morning / afternoon / evening
    description: Optional[str] = None
    safety_rating: Optional[str] = Field(default="Safe", alias="safetyRating")

    class Config:
        populate_by_name = True

class DayPlan(BaseModel):
    day_number: int = Field(alias="dayNumber")
    date: Optional[str] = None
    places: List[Place]
    weather_note: Optional[str] = Field(None, alias="weatherNote")
    total_day_cost: float = Field(default=0.0, alias="totalDayCost")

    class Config:
        populate_by_name = True

class CostSummary(BaseModel):
    food: float = 0.0
    stay: float = 0.0
    activities: float = 0.0
    transport: float = 0.0
    total: float = 0.0

class Itinerary(BaseModel):
    itinerary_id: str = Field(alias="itineraryId")
    trip_id: str = Field(alias="tripId")
    user_id: str = Field(alias="userId")
    days: List[DayPlan]
    cost_summary: CostSummary = Field(alias="costSummary")
    safety_advisory: str = Field(default="Standard safety precautions apply.", alias="safetyAdvisory")
    travel_tips: List[str] = Field(default_factory=list, alias="travelTips")
    ai_version: str = Field(default="gpt-3.5-turbo", alias="aiVersion")
    generated_from: str = Field(default="initial", alias="generatedFrom") # initial / regenerate
    last_prompt_used: Optional[str] = Field(None, alias="lastPromptUsed")
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updatedAt")

    class Config:
        populate_by_name = True

class Trip(BaseModel):
    trip_id: str
    user_id: str
    destination: str
    start_date: date
    end_date: date
    budget: int
    budget_level: str = "Balanced" # Economy / Balanced / Luxury
    interests: List[str]
    travel_pace: str = "Balanced" # Relaxed / Balanced / Fast-Paced
    status: str = "CREATED"
