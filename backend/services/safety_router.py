from fastapi import APIRouter
from services.news_service import get_safety_news
from services.emergency_service import get_emergency_numbers

router = APIRouter()

@router.get("/safety")
def assess_safety(city: str, country: str):
    news = get_safety_news(city, country)
    emergency = get_emergency_numbers(country)

    return {
        "risk": {
            "level": "Low" if len(news) == 0 else "Medium",
            "score": 30
        },
        "news": news,
        "alerts": news,
        "emergency": emergency,
        "ai_insight": f"Monitoring live safety conditions in {city}."
    }