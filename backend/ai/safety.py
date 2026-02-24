from fastapi import APIRouter, Query
from datetime import datetime
try:
    from backend.services.news_service import get_safety_news
    from backend.services.risk_engine import calculate_risk
    from backend.services.emergency_service import get_emergency_numbers
except ImportError:
    from services.news_service import get_safety_news
    from services.risk_engine import calculate_risk
    from services.emergency_service import get_emergency_numbers

router = APIRouter(prefix="/ai/safety", tags=["Safety"])

@router.get("/risk")
def assess_safety(location: str = Query(...)):
    city = location
    country = ""
    if "," in location:
        parts = location.split(",", 1)
        city = parts[0].strip()
        country = parts[1].strip()

    news = get_safety_news(city, country)
    risk = calculate_risk(news)

    alerts = [
        n for n in news if n["severity"] == "High"
    ]

    return {
        "location": location,
        "risk": risk,
        "news": news,              # EXACTLY 5
        "alerts": alerts,          # High severity only
        "emergency": get_emergency_numbers(location),
        "generated_at": datetime.utcnow().isoformat(),
        "ai_insight": (
            f"{risk['level']} risk detected based on "
            f"{len(alerts)} high-severity incidents in the last 48 hours."
        )
    }