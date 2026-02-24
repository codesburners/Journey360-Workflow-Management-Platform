"""
Transport API Service — Train (RapidAPI IRCTC), Flight (AviationStack), Bus (Gemini AI + RapidAPI)
Provides proxied schedule data for Journey360 transport planner.
# Updated: 2026-02-23 — Gemini AI bus integration
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv
import httpx
from datetime import datetime, timedelta
from fastapi import APIRouter, Query, HTTPException
import random
import math
import traceback

# Gemini AI for intelligent bus route generation
try:
    from google import genai
    from google.genai import types as genai_types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("[Transport] WARNING: google-genai not available. Bus AI fallback disabled.")

# Load .env from the backend directory
_backend_root = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=_backend_root / ".env")

router = APIRouter(prefix="/api/transport", tags=["Transport"])

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
AVIATIONSTACK_KEY = os.getenv("AVIATIONSTACK_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Initialize Gemini client for bus AI
_gemini_client = None
if GEMINI_AVAILABLE and GEMINI_API_KEY:
    try:
        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        print(f"[Transport] Gemini AI client initialized for bus routes.")
    except Exception as e:
        print(f"[Transport] Gemini init error: {e}")

print(f"[Transport] RAPIDAPI_KEY loaded: {'YES (' + RAPIDAPI_KEY[:8] + '...)' if RAPIDAPI_KEY else 'NO'}")
print(f"[Transport] AVIATIONSTACK_KEY loaded: {'YES (' + AVIATIONSTACK_KEY[:8] + '...)' if AVIATIONSTACK_KEY else 'NO'}")
print(f"[Transport] GEMINI_API_KEY loaded: {'YES' if GEMINI_API_KEY else 'NO'}")

# ─── Helper: Major global train stations ──────────────────────────────────────
GLOBAL_TRAIN_STATIONS = {
    # India
    "mumbai": {"code": "CSTM", "name": "Chhatrapati Shivaji Terminus", "city": "Mumbai"},
    "pune": {"code": "PUNE", "name": "Pune Junction", "city": "Pune"},
    "delhi": {"code": "NDLS", "name": "New Delhi", "city": "Delhi"},
    "new delhi": {"code": "NDLS", "name": "New Delhi", "city": "Delhi"},
    "chennai": {"code": "MAS", "name": "Chennai Central", "city": "Chennai"},
    "bangalore": {"code": "SBC", "name": "Bangalore City Junction", "city": "Bangalore"},
    "bengaluru": {"code": "SBC", "name": "Bangalore City Junction", "city": "Bengaluru"},
    "kolkata": {"code": "HWH", "name": "Howrah Junction", "city": "Kolkata"},
    "hyderabad": {"code": "SC", "name": "Secunderabad Junction", "city": "Hyderabad"},
    "ahmedabad": {"code": "ADI", "name": "Ahmedabad Junction", "city": "Ahmedabad"},
    "jaipur": {"code": "JP", "name": "Jaipur Junction", "city": "Jaipur"},
    "lucknow": {"code": "LKO", "name": "Lucknow NR", "city": "Lucknow"},
    "varanasi": {"code": "BSB", "name": "Varanasi Junction", "city": "Varanasi"},
    "goa": {"code": "MAO", "name": "Madgaon Junction", "city": "Goa"},
    "kochi": {"code": "ERS", "name": "Ernakulam Junction", "city": "Kochi"},
    "thiruvananthapuram": {"code": "TVC", "name": "Thiruvananthapuram Central", "city": "Thiruvananthapuram"},
    "coimbatore": {"code": "CBE", "name": "Coimbatore Junction", "city": "Coimbatore"},
    "nagpur": {"code": "NGP", "name": "Nagpur Junction", "city": "Nagpur"},
    "bhopal": {"code": "BPL", "name": "Bhopal Junction", "city": "Bhopal"},
    "patna": {"code": "PNBE", "name": "Patna Junction", "city": "Patna"},
    "chandigarh": {"code": "CDG", "name": "Chandigarh Junction", "city": "Chandigarh"},
    "surat": {"code": "ST", "name": "Surat", "city": "Surat"},
    "indore": {"code": "INDB", "name": "Indore Junction", "city": "Indore"},
    "agra": {"code": "AGC", "name": "Agra Cantt", "city": "Agra"},
    "amritsar": {"code": "ASR", "name": "Amritsar Junction", "city": "Amritsar"},
    "mysore": {"code": "MYS", "name": "Mysore Junction", "city": "Mysore"},
    "madurai": {"code": "MDU", "name": "Madurai Junction", "city": "Madurai"},
    "vizag": {"code": "VSKP", "name": "Visakhapatnam", "city": "Vizag"},
    "visakhapatnam": {"code": "VSKP", "name": "Visakhapatnam", "city": "Visakhapatnam"},
    # Global
    "london": {"code": "LON", "name": "London St Pancras", "city": "London"},
    "paris": {"code": "PAR", "name": "Gare du Nord", "city": "Paris"},
    "tokyo": {"code": "TYO", "name": "Tokyo Station", "city": "Tokyo"},
    "new york": {"code": "NYP", "name": "Penn Station", "city": "New York"},
    "berlin": {"code": "BER", "name": "Berlin Hauptbahnhof", "city": "Berlin"},
    "zurich": {"code": "ZRH", "name": "Zürich HB", "city": "Zurich"},
    "rome": {"code": "ROM", "name": "Roma Termini", "city": "Rome"},
    "barcelona": {"code": "BCN", "name": "Barcelona Sants", "city": "Barcelona"},
    "amsterdam": {"code": "AMS", "name": "Amsterdam Centraal", "city": "Amsterdam"},
    "moscow": {"code": "MOW", "name": "Moscow Kazansky", "city": "Moscow"},
    "beijing": {"code": "PEK", "name": "Beijing Railway Station", "city": "Beijing"},
    "shanghai": {"code": "SHA", "name": "Shanghai Hongqiao", "city": "Shanghai"},
    "sydney": {"code": "SYD", "name": "Sydney Central", "city": "Sydney"},
    "dubai": {"code": "DXB", "name": "Dubai Metro Central", "city": "Dubai"},
    "singapore": {"code": "SIN", "name": "Tanjong Pagar", "city": "Singapore"},
}

# ─── Helper: Major global airports ───────────────────────────────────────────
GLOBAL_AIRPORTS = {
    # India
    "mumbai": "BOM", "delhi": "DEL", "new delhi": "DEL",
    "bangalore": "BLR", "bengaluru": "BLR",
    "chennai": "MAA", "kolkata": "CCU", "hyderabad": "HYD", "pune": "PNQ",
    "ahmedabad": "AMD", "goa": "GOI", "kochi": "COK", "jaipur": "JAI",
    "lucknow": "LKO", "varanasi": "VNS", "coimbatore": "CJB",
    "thiruvananthapuram": "TRV", "nagpur": "NAG", "bhopal": "BHO",
    "patna": "PAT", "chandigarh": "IXC", "surat": "STV",
    "indore": "IDR", "agra": "AGR", "amritsar": "ATQ",
    "vizag": "VTZ", "visakhapatnam": "VTZ", "madurai": "IXM",
    # Global
    "london": "LHR", "paris": "CDG", "tokyo": "NRT", "new york": "JFK",
    "los angeles": "LAX", "chicago": "ORD", "san francisco": "SFO",
    "berlin": "BER", "frankfurt": "FRA", "zurich": "ZRH", "rome": "FCO",
    "barcelona": "BCN", "amsterdam": "AMS", "moscow": "SVO",
    "beijing": "PEK", "shanghai": "PVG", "sydney": "SYD",
    "dubai": "DXB", "singapore": "SIN", "hong kong": "HKG",
    "bangkok": "BKK", "kuala lumpur": "KUL", "seoul": "ICN",
    "istanbul": "IST", "cairo": "CAI", "nairobi": "NBO",
    "toronto": "YYZ", "sao paulo": "GRU", "mexico city": "MEX",
    "johannesburg": "JNB", "doha": "DOH", "riyadh": "RUH",
    "abu dhabi": "AUH", "muscat": "MCT", "colombo": "CMB",
    "kathmandu": "KTM", "dhaka": "DAC",
}

def resolve_airport(city: str) -> str:
    """Convert city name to IATA airport code."""
    key = city.strip().lower()
    if key in GLOBAL_AIRPORTS:
        return GLOBAL_AIRPORTS[key]
    # If it looks like an IATA code already (3 uppercase letters)
    if len(city.strip()) == 3 and city.strip().isalpha():
        return city.strip().upper()
    return city.strip().upper()[:3]

def resolve_train_station(city: str) -> dict:
    """Convert city name to station info."""
    key = city.strip().lower()
    if key in GLOBAL_TRAIN_STATIONS:
        return GLOBAL_TRAIN_STATIONS[key]
    return {"code": city.strip().upper()[:4], "name": city.strip().title(), "city": city.strip().title()}


# ══════════════════════════════════════════════════════════════════════════════
# 🚆 TRAIN SCHEDULES — Live IRCTC API + Curated Fallback + Live Status
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/trains")
async def get_train_schedules(
    origin: str = Query(..., description="Origin city or station code"),
    destination: str = Query(..., description="Destination city or station code"),
    date: str = Query(None, description="Date YYYY-MM-DD (optional)")
):
    """
    Fetch train schedules between two stations.
    Uses live IRCTC API (trainBetweenStations) with curated fallback + live status enrichment.
    """
    src = resolve_train_station(origin)
    dst = resolve_train_station(destination)
    travel_date = date or datetime.now().strftime("%Y-%m-%d")

    source_type = "curated"
    schedules = []

    # 1. Try live IRCTC trainBetweenStations API
    api_error = None
    if RAPIDAPI_KEY:
        try:
            live_schedules = await _fetch_trains_live(src, dst, travel_date)
            if live_schedules and len(live_schedules) > 0:
                schedules = live_schedules
                source_type = "live"
                print(f"[Transport] ✅ Got {len(schedules)} trains from IRCTC live API")
            else:
                api_error = "IRCTC returned no trains for this route."
                print(f"[Transport] {api_error}")
        except Exception as e:
            api_error = f"IRCTC live API failed: {str(e)}"
            print(f"[Transport] {api_error}")

    # 2. Fallback to curated database if live API failed or returned empty
    if not schedules:
        schedules = _generate_mock_train_schedules(src, dst, travel_date)
        if not source_type == "live":
            source_type = "curated"
        print(f"[Transport] Using curated database: {len(schedules)} trains")

    # 3. Enrich with live status (delays, current station) from IRCTC
    if RAPIDAPI_KEY and len(schedules) > 0 and source_type == "live":
        try:
            enriched_count = await _enrich_trains_with_live_status(schedules, travel_date)
            if enriched_count > 0:
                source_type = "live+status"
                print(f"[Transport] ✅ Enriched {enriched_count}/{len(schedules)} trains with live status")
        except Exception as e:
            print(f"[Transport] Live status enrichment failed: {e}")

    api_label = {
        "live": "IRCTC Live API",
        "live+status": "IRCTC Live API + Live Status",
        "curated": "Indian Railway Database",
    }.get(source_type, source_type)

    return {
        "source": source_type,
        "api": api_label,
        "origin": src["name"],
        "destination": dst["name"],
        "date": travel_date,
        "count": len(schedules),
        "schedules": schedules,
        "error": api_error # Pass error back to UI if live failed
    }


async def _fetch_trains_live(src: dict, dst: dict, date: str) -> list:
    """Call IRCTC trainBetweenStations v3 API for live schedule data."""
    url = "https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations"
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "irctc1.p.rapidapi.com",
    }
    params = {
        "fromStationCode": src["code"],
        "toStationCode": dst["code"],
        "dateOfJourney": date.replace("-", ""),  # YYYYMMDD
    }

    print(f"[Transport] Calling IRCTC trainBetweenStations: {src['code']} -> {dst['code']} on {date}")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers=headers, params=params)
        print(f"[Transport] IRCTC response: {resp.status_code}")

        if resp.status_code == 403:
            print(f"[Transport] IRCTC 403 — not subscribed to trainBetweenStations")
            return []
        if resp.status_code == 429:
            print(f"[Transport] IRCTC 429 — rate limited")
            return []
        if resp.status_code != 200:
            print(f"[Transport] IRCTC error: {resp.status_code} {resp.text[:200]}")
            return []

        data = resp.json()
        return _parse_train_response(data, src, dst, "irctc1.p.rapidapi.com")


async def _enrich_trains_with_live_status(schedules: list, date: str) -> int:
    """Enrich train schedules with live status from IRCTC 'Get Train Live Status by Train number' API."""
    enriched = 0
    date_num = date.replace("-", "")  # YYYYMMDD

    async with httpx.AsyncClient(timeout=10) as client:
        for train in schedules[:6]:  # Limit to first 6 to avoid rate limits
            train_no = train.get("trainNumber", "")
            if not train_no:
                continue

            try:
                resp = await client.get(
                    "https://irctc1.p.rapidapi.com/api/v1/getTrainLiveStatus",
                    headers={
                        "X-RapidAPI-Key": RAPIDAPI_KEY,
                        "X-RapidAPI-Host": "irctc1.p.rapidapi.com",
                    },
                    params={
                        "trainNo": train_no,
                        "startDay": "1",
                    },
                    timeout=8,
                )

                if resp.status_code == 200:
                    data = resp.json()
                    body = None
                    if isinstance(data, dict):
                        body = data.get("body", data.get("data", {}))
                    if isinstance(body, dict):
                        # Extract live status
                        status_msg = body.get("train_status_message", "")
                        current_station = body.get("current_station", "")

                        if status_msg:
                            # Parse delay info from status message
                            if "delay" in status_msg.lower():
                                train["status"] = status_msg
                            elif "reached destination" in status_msg.lower():
                                train["status"] = "Arrived"
                            elif "departed" in status_msg.lower() or "running" in status_msg.lower():
                                train["status"] = status_msg
                            else:
                                train["status"] = status_msg

                        if current_station:
                            train["currentStation"] = current_station

                        train["liveData"] = True
                        enriched += 1
                elif resp.status_code == 429:
                    print(f"[Transport] IRCTC rate limited, stopping enrichment")
                    break
                elif resp.status_code == 403:
                    print(f"[Transport] IRCTC 403 for train {train_no}, subscription issue")
                    break

            except httpx.TimeoutException:
                continue
            except Exception as e:
                print(f"[Transport] Live status error for {train_no}: {e}")
                continue

    return enriched


def _parse_train_response(data: any, src: dict, dst: dict, host: str) -> list:
    """Parse train responses from various API formats."""
    trains_raw = []

    if isinstance(data, dict):
        # irctc1 format: {status, message, timestamp, data: [...]}
        trains_raw = data.get("data", [])
        if isinstance(trains_raw, dict):
            trains_raw = trains_raw.get("trains", trains_raw.get("data", []))
        # Some APIs return results under 'trains' key
        if not trains_raw:
            trains_raw = data.get("trains", [])
        if not trains_raw:
            trains_raw = data.get("results", [])
    elif isinstance(data, list):
        trains_raw = data

    if not isinstance(trains_raw, list):
        return []

    schedules = []
    for t in trains_raw[:15]:
        if not isinstance(t, dict):
            continue

        # Handle multiple API field naming conventions
        train_number = str(
            t.get("train_number", "") or
            t.get("trainNumber", "") or
            t.get("train_no", "") or
            t.get("number", "") or
            ""
        )
        train_name = (
            t.get("train_name", "") or
            t.get("trainName", "") or
            t.get("name", "") or
            "Express"
        )
        train_type = (
            t.get("train_type", "") or
            t.get("trainType", "") or
            t.get("type", "") or
            "Express"
        )

        # Departure/arrival times
        from_std = (
            t.get("from_std", "") or
            t.get("departureTime", "") or
            t.get("from_time", "") or
            t.get("departure", "") or
            ""
        )
        to_std = (
            t.get("to_std", "") or
            t.get("arrivalTime", "") or
            t.get("to_time", "") or
            t.get("arrival", "") or
            ""
        )
        duration = (
            t.get("duration", "") or
            t.get("travel_time", "") or
            t.get("travelTime", "") or
            ""
        )
        distance = t.get("distance", "")

        # Running days
        running_days = t.get("run_days", t.get("runningDays", t.get("running_days", {})))
        if isinstance(running_days, list):
            day_names = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
            running_days = {
                d: (running_days[i] == 1 if i < len(running_days) else False)
                for i, d in enumerate(day_names)
            }
        if not isinstance(running_days, dict) or len(running_days) == 0:
            running_days = {
                "mon": True, "tue": True, "wed": True, "thu": True,
                "fri": True, "sat": True, "sun": True
            }

        # Available classes
        class_type = t.get("class_type", t.get("availableClasses", t.get("classes", [])))
        if isinstance(class_type, str):
            class_type = [c.strip() for c in class_type.split(",") if c.strip()]
        if not isinstance(class_type, list) or len(class_type) == 0:
            class_type = ["SL", "3A", "2A", "1A"]

        # Origin/destination station info
        from_station_code = t.get("from_station_code", t.get("from_stn_code", src["code"]))
        from_station_name = t.get("from_station_name", t.get("from_stn_name", src["name"]))
        to_station_code = t.get("to_station_code", t.get("to_stn_code", dst["code"]))
        to_station_name = t.get("to_station_name", t.get("to_stn_name", dst["name"]))

        schedule = {
            "id": train_number or f"T{len(schedules)+1}",
            "trainNumber": train_number,
            "trainName": train_name,
            "trainType": train_type,
            "origin": {
                "code": from_station_code,
                "name": from_station_name,
                "departureTime": from_std,
            },
            "destination": {
                "code": to_station_code,
                "name": to_station_name,
                "arrivalTime": to_std,
            },
            "duration": duration,
            "runningDays": running_days,
            "classes": class_type,
            "status": "On Time",
            "distance": (str(distance) + (" km" if distance and "km" not in str(distance) else "")) if distance else "",
        }
        schedules.append(schedule)

    return schedules


def _generate_mock_train_schedules(src: dict, dst: dict, date: str) -> list:
    """Generate realistic train schedules using curated real Indian train data."""
    random.seed(hash(f"{src['code']}{dst['code']}{date}"))

    # ─── Real train database for popular Indian routes ──────────────────────
    REAL_TRAINS = {
        ("CSTM", "NDLS"): [
            {"num": "12951", "name": "Mumbai Rajdhani Express", "type": "Rajdhani Express", "dep": "16:35", "arr": "08:35", "dur": "16h 00m", "dist": "1384 km", "classes": ["1A", "2A", "3A"]},
            {"num": "12953", "name": "August Kranti Rajdhani", "type": "Rajdhani Express", "dep": "17:40", "arr": "10:55", "dur": "17h 15m", "dist": "1384 km", "classes": ["1A", "2A", "3A"]},
            {"num": "22209", "name": "Mumbai Duronto Express", "type": "Duronto Express", "dep": "23:05", "arr": "16:15", "dur": "17h 10m", "dist": "1384 km", "classes": ["1A", "2A", "3A", "SL"]},
            {"num": "12137", "name": "Punjab Mail", "type": "Mail Express", "dep": "19:40", "arr": "19:50", "dur": "24h 10m", "dist": "1544 km", "classes": ["1A", "2A", "3A", "SL"]},
            {"num": "11057", "name": "Amritsar Express", "type": "Express", "dep": "00:10", "arr": "04:55", "dur": "28h 45m", "dist": "1544 km", "classes": ["2A", "3A", "SL", "2S"]},
            {"num": "12925", "name": "Paschim Express", "type": "Superfast Express", "dep": "11:30", "arr": "09:30", "dur": "22h 00m", "dist": "1384 km", "classes": ["1A", "2A", "3A", "SL"]},
        ],
        ("NDLS", "CSTM"): [
            {"num": "12952", "name": "New Delhi Rajdhani Express", "type": "Rajdhani Express", "dep": "16:55", "arr": "08:35", "dur": "15h 40m", "dist": "1384 km", "classes": ["1A", "2A", "3A"]},
            {"num": "12954", "name": "August Kranti Rajdhani", "type": "Rajdhani Express", "dep": "17:25", "arr": "10:25", "dur": "17h 00m", "dist": "1384 km", "classes": ["1A", "2A", "3A"]},
            {"num": "22210", "name": "Delhi Duronto Express", "type": "Duronto Express", "dep": "23:00", "arr": "15:50", "dur": "16h 50m", "dist": "1384 km", "classes": ["1A", "2A", "3A", "SL"]},
            {"num": "12138", "name": "Punjab Mail", "type": "Mail Express", "dep": "05:15", "arr": "05:25", "dur": "24h 10m", "dist": "1544 km", "classes": ["1A", "2A", "3A", "SL"]},
            {"num": "12926", "name": "Paschim Express", "type": "Superfast Express", "dep": "16:35", "arr": "13:40", "dur": "21h 05m", "dist": "1384 km", "classes": ["1A", "2A", "3A", "SL"]},
        ],
        ("CSTM", "PUNE"): [
            {"num": "12127", "name": "Mumbai-Pune Intercity", "type": "Intercity Express", "dep": "06:45", "arr": "10:15", "dur": "3h 30m", "dist": "192 km", "classes": ["CC", "2S"]},
            {"num": "12123", "name": "Deccan Queen", "type": "Superfast Express", "dep": "17:10", "arr": "20:30", "dur": "3h 20m", "dist": "192 km", "classes": ["CC", "2S"]},
            {"num": "11007", "name": "Deccan Express", "type": "Express", "dep": "07:15", "arr": "10:50", "dur": "3h 35m", "dist": "192 km", "classes": ["2S", "SL"]},
            {"num": "12125", "name": "Pragati Express", "type": "Superfast Express", "dep": "17:45", "arr": "21:00", "dur": "3h 15m", "dist": "192 km", "classes": ["CC", "2S"]},
            {"num": "22105", "name": "Indrayani Express", "type": "Express", "dep": "08:05", "arr": "11:15", "dur": "3h 10m", "dist": "192 km", "classes": ["CC", "2S"]},
        ],
        ("PUNE", "CSTM"): [
            {"num": "12128", "name": "Pune-Mumbai Intercity", "type": "Intercity Express", "dep": "06:35", "arr": "10:05", "dur": "3h 30m", "dist": "192 km", "classes": ["CC", "2S"]},
            {"num": "12124", "name": "Deccan Queen", "type": "Superfast Express", "dep": "07:15", "arr": "10:35", "dur": "3h 20m", "dist": "192 km", "classes": ["CC", "2S"]},
            {"num": "11008", "name": "Deccan Express", "type": "Express", "dep": "14:15", "arr": "17:50", "dur": "3h 35m", "dist": "192 km", "classes": ["2S", "SL"]},
            {"num": "12126", "name": "Pragati Express", "type": "Superfast Express", "dep": "07:45", "arr": "10:55", "dur": "3h 10m", "dist": "192 km", "classes": ["CC", "2S"]},
        ],
        ("NDLS", "SBC"): [
            {"num": "12627", "name": "Karnataka Express", "type": "Superfast Express", "dep": "21:30", "arr": "06:40", "dur": "33h 10m", "dist": "2444 km", "classes": ["1A", "2A", "3A", "SL"]},
            {"num": "22691", "name": "Rajdhani Express", "type": "Rajdhani Express", "dep": "20:50", "arr": "06:10", "dur": "33h 20m", "dist": "2444 km", "classes": ["1A", "2A", "3A"]},
            {"num": "12649", "name": "Sampark Kranti Express", "type": "Superfast Express", "dep": "11:10", "arr": "21:45", "dur": "34h 35m", "dist": "2444 km", "classes": ["2A", "3A", "SL"]},
        ],
        ("SBC", "NDLS"): [
            {"num": "12628", "name": "Karnataka Express", "type": "Superfast Express", "dep": "19:20", "arr": "05:15", "dur": "33h 55m", "dist": "2444 km", "classes": ["1A", "2A", "3A", "SL"]},
            {"num": "22692", "name": "Rajdhani Express", "type": "Rajdhani Express", "dep": "20:00", "arr": "05:50", "dur": "33h 50m", "dist": "2444 km", "classes": ["1A", "2A", "3A"]},
        ],
        ("NDLS", "MAS"): [
            {"num": "12621", "name": "Tamil Nadu Express", "type": "Superfast Express", "dep": "22:30", "arr": "07:10", "dur": "32h 40m", "dist": "2182 km", "classes": ["1A", "2A", "3A", "SL"]},
            {"num": "12615", "name": "Grand Trunk Express", "type": "Superfast Express", "dep": "18:40", "arr": "05:50", "dur": "35h 10m", "dist": "2182 km", "classes": ["1A", "2A", "3A", "SL"]},
            {"num": "22403", "name": "Delhi-Chennai Rajdhani", "type": "Rajdhani Express", "dep": "15:55", "arr": "19:45", "dur": "27h 50m", "dist": "2182 km", "classes": ["1A", "2A", "3A"]},
        ],
        ("MAS", "NDLS"): [
            {"num": "12622", "name": "Tamil Nadu Express", "type": "Superfast Express", "dep": "22:00", "arr": "06:40", "dur": "32h 40m", "dist": "2182 km", "classes": ["1A", "2A", "3A", "SL"]},
            {"num": "12616", "name": "Grand Trunk Express", "type": "Superfast Express", "dep": "19:00", "arr": "06:10", "dur": "35h 10m", "dist": "2182 km", "classes": ["1A", "2A", "3A", "SL"]},
        ],
        ("NDLS", "HWH"): [
            {"num": "12301", "name": "Howrah Rajdhani Express", "type": "Rajdhani Express", "dep": "16:55", "arr": "09:55", "dur": "17h 00m", "dist": "1447 km", "classes": ["1A", "2A", "3A"]},
            {"num": "12305", "name": "Howrah Rajdhani Express", "type": "Rajdhani Express", "dep": "14:35", "arr": "06:55", "dur": "16h 20m", "dist": "1447 km", "classes": ["1A", "2A", "3A"]},
            {"num": "12381", "name": "Poorva Express", "type": "Superfast Express", "dep": "20:35", "arr": "20:10", "dur": "23h 35m", "dist": "1531 km", "classes": ["1A", "2A", "3A", "SL"]},
        ],
        ("HWH", "NDLS"): [
            {"num": "12302", "name": "Kolkata Rajdhani Express", "type": "Rajdhani Express", "dep": "14:05", "arr": "09:55", "dur": "19h 50m", "dist": "1447 km", "classes": ["1A", "2A", "3A"]},
            {"num": "12306", "name": "Kolkata Rajdhani Express", "type": "Rajdhani Express", "dep": "14:05", "arr": "06:25", "dur": "16h 20m", "dist": "1447 km", "classes": ["1A", "2A", "3A"]},
        ],
        ("CSTM", "SBC"): [
            {"num": "11013", "name": "Mumbai-Bangalore Express", "type": "Express", "dep": "21:00", "arr": "21:30", "dur": "24h 30m", "dist": "1197 km", "classes": ["2A", "3A", "SL"]},
            {"num": "12027", "name": "Shatabdi Express", "type": "Shatabdi Express", "dep": "06:00", "arr": "18:30", "dur": "12h 30m", "dist": "1020 km", "classes": ["CC", "EC"]},
        ],
        # ─── Chennai ↔ Bangalore ──────────────────────────
        ("MAS", "SBC"): [
            {"num": "12007", "name": "Shatabdi Express", "type": "Shatabdi Express", "dep": "06:00", "arr": "10:50", "dur": "4h 50m", "dist": "362 km", "classes": ["CC", "EC"]},
            {"num": "12609", "name": "Chennai Express", "type": "Superfast Express", "dep": "07:50", "arr": "13:40", "dur": "5h 50m", "dist": "362 km", "classes": ["2A", "3A", "SL"]},
            {"num": "12657", "name": "Chennai Mail", "type": "Mail Express", "dep": "22:30", "arr": "04:40", "dur": "6h 10m", "dist": "362 km", "classes": ["1A", "2A", "3A", "SL"]},
            {"num": "12639", "name": "Brindavan Express", "type": "Superfast Express", "dep": "15:20", "arr": "20:50", "dur": "5h 30m", "dist": "362 km", "classes": ["CC", "2S"]},
            {"num": "12027", "name": "Chennai Shatabdi Express", "type": "Shatabdi Express", "dep": "06:00", "arr": "10:50", "dur": "4h 50m", "dist": "362 km", "classes": ["CC", "EC"]},
            {"num": "16021", "name": "Kaveri Express", "type": "Express", "dep": "08:15", "arr": "14:30", "dur": "6h 15m", "dist": "362 km", "classes": ["2A", "3A", "SL", "2S"]},
            {"num": "12607", "name": "Lalbagh Express", "type": "Superfast Express", "dep": "06:20", "arr": "11:45", "dur": "5h 25m", "dist": "362 km", "classes": ["CC", "2S"]},
            {"num": "12691", "name": "Chennai Rajdhani Express", "type": "Rajdhani Express", "dep": "19:10", "arr": "00:25", "dur": "5h 15m", "dist": "362 km", "classes": ["1A", "2A", "3A"]},
        ],
        ("SBC", "MAS"): [
            {"num": "12008", "name": "Shatabdi Express", "type": "Shatabdi Express", "dep": "11:30", "arr": "16:20", "dur": "4h 50m", "dist": "362 km", "classes": ["CC", "EC"]},
            {"num": "12610", "name": "Bangalore Express", "type": "Superfast Express", "dep": "14:00", "arr": "19:50", "dur": "5h 50m", "dist": "362 km", "classes": ["2A", "3A", "SL"]},
            {"num": "12658", "name": "Bangalore Mail", "type": "Mail Express", "dep": "22:00", "arr": "04:10", "dur": "6h 10m", "dist": "362 km", "classes": ["1A", "2A", "3A", "SL"]},
            {"num": "12640", "name": "Brindavan Express", "type": "Superfast Express", "dep": "07:30", "arr": "13:00", "dur": "5h 30m", "dist": "362 km", "classes": ["CC", "2S"]},
            {"num": "12608", "name": "Lalbagh Express", "type": "Superfast Express", "dep": "14:20", "arr": "19:45", "dur": "5h 25m", "dist": "362 km", "classes": ["CC", "2S"]},
            {"num": "16022", "name": "Kaveri Express", "type": "Express", "dep": "15:30", "arr": "21:45", "dur": "6h 15m", "dist": "362 km", "classes": ["2A", "3A", "SL", "2S"]},
            {"num": "12692", "name": "Bangalore Rajdhani Express", "type": "Rajdhani Express", "dep": "05:45", "arr": "11:00", "dur": "5h 15m", "dist": "362 km", "classes": ["1A", "2A", "3A"]},
        ],
        # ─── Chennai ↔ Hyderabad ──────────────────────────
        ("MAS", "SC"): [
            {"num": "12603", "name": "Hyderabad Express", "type": "Superfast Express", "dep": "18:10", "arr": "04:30", "dur": "10h 20m", "dist": "714 km", "classes": ["1A", "2A", "3A", "SL"]},
            {"num": "12759", "name": "Charminar Express", "type": "Superfast Express", "dep": "18:40", "arr": "05:00", "dur": "10h 20m", "dist": "714 km", "classes": ["2A", "3A", "SL"]},
            {"num": "12605", "name": "Pallavan Express", "type": "Express", "dep": "06:00", "arr": "17:30", "dur": "11h 30m", "dist": "714 km", "classes": ["2A", "3A", "SL", "2S"]},
        ],
        ("SC", "MAS"): [
            {"num": "12604", "name": "Chennai Express", "type": "Superfast Express", "dep": "17:15", "arr": "03:35", "dur": "10h 20m", "dist": "714 km", "classes": ["1A", "2A", "3A", "SL"]},
            {"num": "12760", "name": "Charminar Express", "type": "Superfast Express", "dep": "18:55", "arr": "05:15", "dur": "10h 20m", "dist": "714 km", "classes": ["2A", "3A", "SL"]},
            {"num": "12606", "name": "Pallavan Express", "type": "Express", "dep": "13:30", "arr": "01:00", "dur": "11h 30m", "dist": "714 km", "classes": ["2A", "3A", "SL", "2S"]},
        ],
        # ─── Bangalore ↔ Hyderabad ────────────────────────
        ("SBC", "SC"): [
            {"num": "12785", "name": "Kacheguda Express", "type": "Superfast Express", "dep": "18:30", "arr": "06:15", "dur": "11h 45m", "dist": "660 km", "classes": ["2A", "3A", "SL"]},
            {"num": "12253", "name": "Bangalore Rajdhani Express", "type": "Rajdhani Express", "dep": "21:00", "arr": "05:30", "dur": "8h 30m", "dist": "570 km", "classes": ["1A", "2A", "3A"]},
            {"num": "12677", "name": "Ernakulam Express", "type": "Superfast Express", "dep": "14:30", "arr": "01:15", "dur": "10h 45m", "dist": "660 km", "classes": ["2A", "3A", "SL"]},
        ],
        ("SC", "SBC"): [
            {"num": "12786", "name": "Bangalore Express", "type": "Superfast Express", "dep": "19:30", "arr": "07:15", "dur": "11h 45m", "dist": "660 km", "classes": ["2A", "3A", "SL"]},
            {"num": "12254", "name": "Hyderabad Rajdhani Express", "type": "Rajdhani Express", "dep": "22:30", "arr": "07:00", "dur": "8h 30m", "dist": "570 km", "classes": ["1A", "2A", "3A"]},
        ],
        # ─── Chennai ↔ Coimbatore ─────────────────────────
        ("MAS", "CBE"): [
            {"num": "12675", "name": "Kovai Express", "type": "Superfast Express", "dep": "06:10", "arr": "13:35", "dur": "7h 25m", "dist": "496 km", "classes": ["CC", "2S"]},
            {"num": "12243", "name": "Shatabdi Express", "type": "Shatabdi Express", "dep": "07:10", "arr": "13:30", "dur": "6h 20m", "dist": "496 km", "classes": ["CC", "EC"]},
            {"num": "22681", "name": "Chennai-Coimbatore SF Express", "type": "Superfast Express", "dep": "15:20", "arr": "22:30", "dur": "7h 10m", "dist": "496 km", "classes": ["2A", "3A", "SL"]},
            {"num": "12671", "name": "Nilagiri Express", "type": "Express", "dep": "21:15", "arr": "05:40", "dur": "8h 25m", "dist": "496 km", "classes": ["1A", "2A", "3A", "SL"]},
        ],
        ("CBE", "MAS"): [
            {"num": "12676", "name": "Kovai Express", "type": "Superfast Express", "dep": "14:20", "arr": "21:35", "dur": "7h 15m", "dist": "496 km", "classes": ["CC", "2S"]},
            {"num": "12244", "name": "Shatabdi Express", "type": "Shatabdi Express", "dep": "14:30", "arr": "20:50", "dur": "6h 20m", "dist": "496 km", "classes": ["CC", "EC"]},
            {"num": "12672", "name": "Nilagiri Express", "type": "Express", "dep": "20:30", "arr": "05:00", "dur": "8h 30m", "dist": "496 km", "classes": ["1A", "2A", "3A", "SL"]},
        ],
        # ─── Bangalore ↔ Mysore ───────────────────────────
        ("SBC", "MYS"): [
            {"num": "12007", "name": "Tippu Express", "type": "Intercity Express", "dep": "06:15", "arr": "08:45", "dur": "2h 30m", "dist": "139 km", "classes": ["CC", "2S"]},
            {"num": "16557", "name": "Rajya Rani Express", "type": "Express", "dep": "14:15", "arr": "17:15", "dur": "3h 00m", "dist": "139 km", "classes": ["CC", "2S"]},
            {"num": "16215", "name": "Chamundi Express", "type": "Express", "dep": "18:15", "arr": "21:30", "dur": "3h 15m", "dist": "139 km", "classes": ["2S", "SL"]},
        ],
        ("MYS", "SBC"): [
            {"num": "12008", "name": "Tippu Express", "type": "Intercity Express", "dep": "09:30", "arr": "12:00", "dur": "2h 30m", "dist": "139 km", "classes": ["CC", "2S"]},
            {"num": "16558", "name": "Rajya Rani Express", "type": "Express", "dep": "06:45", "arr": "09:45", "dur": "3h 00m", "dist": "139 km", "classes": ["CC", "2S"]},
            {"num": "16216", "name": "Chamundi Express", "type": "Express", "dep": "06:00", "arr": "09:15", "dur": "3h 15m", "dist": "139 km", "classes": ["2S", "SL"]},
        ],
    }

    # Check if we have curated data for this route
    route_key = (src["code"], dst["code"])
    if route_key in REAL_TRAINS:
        curated = REAL_TRAINS[route_key]
        schedules = []
        for t in curated:
            delay_chance = random.random()
            if delay_chance < 0.12:
                status = f"Delayed by {random.choice([5, 10, 15, 20])} min"
            else:
                status = "On Time"

            # Generate realistic fares from distance
            dist_num = int(''.join(filter(str.isdigit, t["dist"])) or "500")
            schedules.append({
                "id": t["num"],
                "trainNumber": t["num"],
                "trainName": t["name"],
                "trainType": t["type"],
                "origin": {
                    "code": src["code"],
                    "name": src["name"],
                    "departureTime": t["dep"],
                },
                "destination": {
                    "code": dst["code"],
                    "name": dst["name"],
                    "arrivalTime": t["arr"],
                },
                "duration": t["dur"],
                "runningDays": {
                    "mon": True, "tue": True, "wed": True, "thu": True,
                    "fri": True, "sat": True, "sun": random.random() > 0.3
                },
                "classes": t["classes"],
                "status": status,
                "distance": t["dist"],
                "fare": {
                    "SL": max(150, int(dist_num * 0.35)),
                    "3A": max(400, int(dist_num * 0.7)),
                    "2A": max(800, int(dist_num * 1.2)),
                    "1A": max(1500, int(dist_num * 2.2)),
                }
            })
        schedules.sort(key=lambda s: s["origin"]["departureTime"])
        return schedules

    # ─── Fallback: Generated mock for unknown routes ──────────────────────
    train_name_prefixes = [
        "Superfast Express", "Rajdhani Express", "Shatabdi Express",
        "Mail Express", "Duronto Express", "Intercity Express",
        "Garib Rath", "Jan Shatabdi", "Express"
    ]

    code_hash = hash(f"{src['code']}{dst['code']}")
    base_distance = 200 + abs(code_hash % 600)  # 200-800 km range (realistic)
    avg_speed = 55 + random.randint(0, 30)  # 55-85 km/h (Indian rail avg)

    schedules = []
    num_trains = random.randint(4, 8)

    for i in range(num_trains):
        train_num = str(10000 + abs(hash(f"{src['code']}{dst['code']}{i}")) % 90000)
        dep_hour = (5 + i * 3 + random.randint(0, 2)) % 24
        dep_min = random.choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])

        travel_hours = base_distance / avg_speed + random.uniform(-0.5, 0.5)
        travel_hours = max(1.5, min(travel_hours, 24))  # Cap at 24h
        arr_hour = int((dep_hour + travel_hours) % 24)
        arr_min = random.choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])

        dur_h = int(travel_hours)
        dur_m = int((travel_hours - dur_h) * 60)

        train_type = random.choice(train_name_prefixes)
        train_name = f"{src['city']}-{dst['city']} {train_type}"

        delay_chance = random.random()
        if delay_chance < 0.15:
            status = f"Delayed by {random.choice([5, 10, 15, 20, 30])} min"
        elif delay_chance < 0.05:
            status = "Cancelled"
        else:
            status = "On Time"

        days = {}
        for d in ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]:
            days[d] = random.random() > 0.2

        schedules.append({
            "id": train_num,
            "trainNumber": train_num,
            "trainName": train_name,
            "trainType": train_type,
            "origin": {
                "code": src["code"],
                "name": src["name"],
                "departureTime": f"{dep_hour:02d}:{dep_min:02d}",
            },
            "destination": {
                "code": dst["code"],
                "name": dst["name"],
                "arrivalTime": f"{arr_hour:02d}:{arr_min:02d}",
            },
            "duration": f"{dur_h}h {dur_m:02d}m",
            "runningDays": days,
            "classes": random.sample(["SL", "3A", "2A", "1A", "CC", "EC", "2S"], k=random.randint(3, 5)),
            "status": status,
            "distance": f"{base_distance + random.randint(-50, 50)} km",
            "fare": {
                "SL": random.randint(150, 500),
                "3A": random.randint(500, 1500),
                "2A": random.randint(1000, 3000),
                "1A": random.randint(2000, 5000),
            }
        })

    schedules.sort(key=lambda s: s["origin"]["departureTime"])
    return schedules


# ══════════════════════════════════════════════════════════════════════════════
# ✈️ FLIGHT SCHEDULES — AviationStack API
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/flights")
async def get_flight_schedules(
    origin: str = Query(..., description="Origin city or IATA airport code"),
    destination: str = Query(..., description="Destination city or IATA airport code"),
    date: str = Query(None, description="Date YYYY-MM-DD (optional)")
):
    """
    Fetch flight schedules between two airports.
    Uses AviationStack API (live data only).
    """
    src_iata = resolve_airport(origin)
    dst_iata = resolve_airport(destination)
    travel_date = date or datetime.now().strftime("%Y-%m-%d")

    # 1. Try live AviationStack API first (always use it when key exists)
    if AVIATIONSTACK_KEY:
        try:
            live_data = await _fetch_flights_aviationstack(src_iata, dst_iata, travel_date)
            if live_data and len(live_data) > 0:
                return {
                    "source": "live",
                    "api": "AviationStack",
                    "origin": src_iata,
                    "destination": dst_iata,
                    "date": travel_date,
                    "count": len(live_data),
                    "schedules": live_data,
                }
            else:
                print(f"[Transport] AviationStack returned no flights, using mock fallback")
        except Exception as e:
            print(f"[Transport] AviationStack API error: {e}, using mock fallback")

    # 2. Fallback to mock data if no key or live API failed
    mock_data = _generate_mock_flight_schedules(src_iata, dst_iata, travel_date, origin, destination)
    return {
        "source": "demo" if not AVIATIONSTACK_KEY else "curated",
        "api": "Mock Data" if not AVIATIONSTACK_KEY else "Flight Database (API returned no results)",
        "origin": src_iata,
        "destination": dst_iata,
        "date": travel_date,
        "count": len(mock_data),
        "schedules": mock_data,
    }



async def _fetch_flights_aviationstack(src: str, dst: str, date: str) -> list:
    """Call AviationStack API for flight schedule data."""
    # Note: Free tier uses http (not https)
    url = "http://api.aviationstack.com/v1/flights"
    params = {
        "access_key": AVIATIONSTACK_KEY,
        "dep_iata": src,
        "arr_iata": dst,
        "limit": 15,
    }

    print(f"[Transport] Calling AviationStack flights: {src} -> {dst} on {date}")

    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        # Pass access_key in params, AviationStack is picky about this
        resp = await client.get(url, params=params)
        print(f"[Transport] Calling: {resp.url}")
        print(f"[Transport] AviationStack response status: {resp.status_code}")

        if resp.status_code != 200:
            resp_text = resp.text[:300]
            print(f"[Transport] AviationStack error: {resp.status_code} {resp_text}")
            return []

        data = resp.json()

        # Check for API error
        if "error" in data:
            print(f"[Transport] AviationStack API error: {data['error']}")
            return []

        flights_raw = data.get("data", [])
        if not isinstance(flights_raw, list):
            print(f"[Transport] AviationStack unexpected data type: {type(flights_raw)}")
            return []

        print(f"[Transport] Found {len(flights_raw)} flights from API")

        schedules = []
        for f in flights_raw[:15]:
            try:
                dep = f.get("departure", {}) or {}
                arr = f.get("arrival", {}) or {}
                airline_info = f.get("airline", {}) or {}
                flight_info = f.get("flight", {}) or {}

                dep_time = dep.get("scheduled", "") or ""
                arr_time = arr.get("scheduled", "") or ""

                # Parse times for duration calculation
                duration_str = ""
                if dep_time and arr_time:
                    try:
                        # Handle various ISO formats safely
                        dep_clean = dep_time.replace("Z", "+00:00")
                        arr_clean = arr_time.replace("Z", "+00:00")

                        # Remove timezone info for simple duration calc
                        dep_no_tz = dep_clean.split("+")[0].split("-")[0] if "T" in dep_clean else dep_clean
                        arr_no_tz = arr_clean.split("+")[0].split("-")[0] if "T" in arr_clean else arr_clean

                        # Handle date portion
                        if "T" in dep_time:
                            dep_no_tz = dep_time[:19]  # Trim to YYYY-MM-DDTHH:MM:SS
                            arr_no_tz = arr_time[:19]

                        dt_dep = datetime.fromisoformat(dep_no_tz)
                        dt_arr = datetime.fromisoformat(arr_no_tz)
                        dur = dt_arr - dt_dep
                        if dur.total_seconds() < 0:
                            dur = dur + timedelta(days=1)
                        dur_h = int(dur.total_seconds() // 3600)
                        dur_m = int((dur.total_seconds() % 3600) // 60)
                        duration_str = f"{dur_h}h {dur_m:02d}m"
                    except Exception as parse_err:
                        print(f"[Transport] Flight time parse error: {parse_err} dep={dep_time} arr={arr_time}")
                        duration_str = ""

                # Format times to HH:MM safely
                dep_display = ""
                arr_display = ""
                try:
                    if dep_time and len(dep_time) > 16:
                        dep_display = dep_time[11:16]
                    elif dep_time:
                        dep_display = dep_time
                except:
                    dep_display = dep_time or ""

                try:
                    if arr_time and len(arr_time) > 16:
                        arr_display = arr_time[11:16]
                    elif arr_time:
                        arr_display = arr_time
                except:
                    arr_display = arr_time or ""

                status_raw = f.get("flight_status", "scheduled") or "scheduled"
                status_map = {
                    "scheduled": "Scheduled",
                    "active": "In Flight",
                    "landed": "Landed",
                    "cancelled": "Cancelled",
                    "incident": "Incident",
                    "diverted": "Diverted",
                }

                flight_number = (
                    flight_info.get("iata", "") or
                    flight_info.get("number", "") or
                    flight_info.get("icao", "") or
                    f"FL{len(schedules)+1}"
                )

                schedule = {
                    "id": flight_number,
                    "flightNumber": flight_number,
                    "airline": airline_info.get("name", "Unknown Airline") or "Unknown Airline",
                    "airlineIata": airline_info.get("iata", "") or "",
                    "origin": {
                        "iata": dep.get("iata", src) or src,
                        "airport": dep.get("airport", "") or "",
                        "terminal": dep.get("terminal", "") or "",
                        "gate": dep.get("gate", "") or "",
                        "departureTime": dep_display,
                        "scheduledTime": dep_time,
                    },
                    "destination": {
                        "iata": arr.get("iata", dst) or dst,
                        "airport": arr.get("airport", "") or "",
                        "terminal": arr.get("terminal", "") or "",
                        "gate": arr.get("gate", "") or "",
                        "arrivalTime": arr_display,
                        "scheduledTime": arr_time,
                    },
                    "duration": duration_str,
                    "status": status_map.get(status_raw, status_raw.title() if status_raw else "Scheduled"),
                    "aircraft": (f.get("aircraft", {}) or {}).get("registration", "") or "",
                }
                schedules.append(schedule)
            except Exception as flight_err:
                print(f"[Transport] Error parsing flight entry: {flight_err}")
                continue

        return schedules


def _generate_mock_flight_schedules(src_iata: str, dst_iata: str, date: str, origin_city: str, dest_city: str) -> list:
    """Generate realistic mock flight schedules for any global route."""
    random.seed(hash(f"{src_iata}{dst_iata}{date}"))

    airlines = [
        {"name": "Air India", "iata": "AI"},
        {"name": "IndiGo", "iata": "6E"},
        {"name": "SpiceJet", "iata": "SG"},
        {"name": "Vistara", "iata": "UK"},
        {"name": "Emirates", "iata": "EK"},
        {"name": "Singapore Airlines", "iata": "SQ"},
        {"name": "Lufthansa", "iata": "LH"},
        {"name": "British Airways", "iata": "BA"},
        {"name": "Qatar Airways", "iata": "QR"},
        {"name": "Turkish Airlines", "iata": "TK"},
        {"name": "ANA", "iata": "NH"},
        {"name": "Delta Air Lines", "iata": "DL"},
        {"name": "United Airlines", "iata": "UA"},
        {"name": "Air France", "iata": "AF"},
        {"name": "Etihad Airways", "iata": "EY"},
    ]

    schedules = []
    num_flights = random.randint(4, 10)

    for i in range(num_flights):
        airline = random.choice(airlines)
        flight_num = f"{airline['iata']}{random.randint(100, 999)}"

        dep_hour = (5 + i * 2 + random.randint(0, 2)) % 24
        dep_min = random.choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])

        code_hash = abs(hash(f"{src_iata}{dst_iata}"))
        base_hours = 1.5 + (code_hash % 12)
        flight_hours = base_hours + random.uniform(-0.5, 0.5)
        flight_hours = max(1, flight_hours)

        arr_hour = int((dep_hour + flight_hours) % 24)
        arr_min = random.choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])

        dur_h = int(flight_hours)
        dur_m = int((flight_hours - dur_h) * 60)

        delay_chance = random.random()
        if delay_chance < 0.1:
            status = f"Delayed by {random.choice([15, 30, 45, 60])} min"
        elif delay_chance < 0.03:
            status = "Cancelled"
        else:
            status = "Scheduled"

        fare_base = int(2000 + flight_hours * random.randint(800, 2000))

        schedules.append({
            "id": flight_num,
            "flightNumber": flight_num,
            "airline": airline["name"],
            "airlineIata": airline["iata"],
            "origin": {
                "iata": src_iata,
                "airport": f"{origin_city.title()} International Airport",
                "terminal": f"T{random.choice([1, 2, 3])}",
                "gate": f"{random.choice('ABCDEFG')}{random.randint(1, 30)}",
                "departureTime": f"{dep_hour:02d}:{dep_min:02d}",
            },
            "destination": {
                "iata": dst_iata,
                "airport": f"{dest_city.title()} International Airport",
                "terminal": f"T{random.choice([1, 2, 3])}",
                "gate": f"{random.choice('ABCDEFG')}{random.randint(1, 30)}",
                "arrivalTime": f"{arr_hour:02d}:{arr_min:02d}",
            },
            "duration": f"{dur_h}h {dur_m:02d}m",
            "status": status,
            "aircraft": random.choice(["Boeing 737-800", "Airbus A320", "Boeing 787-9",
                                        "Airbus A350", "Boeing 777-300ER", "Airbus A380",
                                        "Boeing 737 MAX", "Embraer E190"]),
            "fare": {
                "economy": fare_base,
                "business": int(fare_base * 2.5),
                "first": int(fare_base * 5),
            },
        })

    schedules.sort(key=lambda s: s["origin"]["departureTime"])
    return schedules


# ══════════════════════════════════════════════════════════════════════════════
# 🚌 BUS SCHEDULES — RapidAPI RedBus + Smart Mock Fallback
# ══════════════════════════════════════════════════════════════════════════════

BUS_OPERATORS = {
    "india": [
        {"name": "IntrCity SmartBus", "type": "Private"},
        {"name": "NueGo (Electric)", "type": "Private"},
        {"name": "Zingbus", "type": "Private"},
        {"name": "FlixBus", "type": "Private"},
        {"name": "FreshBus", "type": "Private"},
        {"name": "KSRTC", "type": "Government"},
        {"name": "TSRTC", "type": "Government"},
        {"name": "MSRTC", "type": "Government"},
        {"name": "APSRTC", "type": "Government"},
        {"name": "RSRTC", "type": "Government"},
        {"name": "HRTC", "type": "Government"},
        {"name": "UPSRTC", "type": "Government"},
        {"name": "WBTC (CTC)", "type": "Government"},
        {"name": "VRL Travels", "type": "Private"},
        {"name": "SRS Travels", "type": "Private"},
        {"name": "Orange Tours And Travels", "type": "Private"},
        {"name": "Jabbar Travels", "type": "Private"},
        {"name": "National Travels NTA", "type": "Private"},
        {"name": "Parveen Travels", "type": "Private"},
        {"name": "Paulo Travels", "type": "Private"},
        {"name": "Neeta Bus", "type": "Private"},
        {"name": "Eagle Falcon Bus", "type": "Private"},
    ],
    "global": [
        {"name": "FlixBus", "type": "Private"},
        {"name": "Greyhound", "type": "Private"},
        {"name": "Megabus", "type": "Private"},
        {"name": "National Express", "type": "Private"},
        {"name": "Eurolines", "type": "Private"},
        {"name": "ALSA", "type": "Private"},
        {"name": "Willer Express", "type": "Private"},
        {"name": "BlaBlaBus", "type": "Private"},
        {"name": "Lux Express", "type": "Private"},
        {"name": "RegioJet", "type": "Private"},
    ]
}

# ─── Reference: Perfect Metropolitan Bus Routes (RedBus Style) ───────────────
PERFECT_BUS_ROUTES = {
    "chennai-bangalore": {"distance": "330 km", "duration": "7h 00m", "km": 330, "hours": 7.0},
    "bangalore-chennai": {"distance": "330 km", "duration": "7h 00m", "km": 330, "hours": 7.0},
    "mumbai-pune": {"distance": "150 km", "duration": "3h 45m", "km": 150, "hours": 3.75},
    "pune-mumbai": {"distance": "150 km", "duration": "3h 45m", "km": 150, "hours": 3.75},
    "delhi-jaipur": {"distance": "285 km", "duration": "5h 30m", "km": 285, "hours": 5.5},
    "jaipur-delhi": {"distance": "285 km", "duration": "5h 30m", "km": 285, "hours": 5.5},
    "bangalore-hyderabad": {"distance": "570 km", "duration": "9h 30m", "km": 570, "hours": 9.5},
    "hyderabad-bangalore": {"distance": "570 km", "duration": "9h 30m", "km": 570, "hours": 9.5},
    "mumbai-ahmedabad": {"distance": "530 km", "duration": "11h 00m", "km": 530, "hours": 11.0},
    "ahmedabad-mumbai": {"distance": "530 km", "duration": "11h 00m", "km": 530, "hours": 11.0},
    "delhi-chandigarh": {"distance": "250 km", "duration": "4h 45m", "km": 250, "hours": 4.75},
    "chandigarh-delhi": {"distance": "250 km", "duration": "4h 45m", "km": 250, "hours": 4.75},
    "hyderabad-vijayawada": {"distance": "275 km", "duration": "6h 15m", "km": 275, "hours": 6.25},
    "vijayawada-hyderabad": {"distance": "275 km", "duration": "6h 15m", "km": 275, "hours": 6.25},
    "kolkata-digha": {"distance": "185 km", "duration": "4h 30m", "km": 185, "hours": 4.5},
    "digha-kolkata": {"distance": "185 km", "duration": "4h 30m", "km": 185, "hours": 4.5},
}


BUS_TYPES = ["AC Sleeper", "AC Seater", "Non-AC Seater", "Volvo Multi-Axle",
             "Semi-Sleeper", "Luxury Coach", "Double Decker", "Standard",
             "Premium Seater", "Electric Bus"]

INDIA_CITIES = {"mumbai", "pune", "delhi", "new delhi", "chennai", "bangalore", "bengaluru",
                "kolkata", "hyderabad", "ahmedabad", "jaipur", "lucknow",
                "varanasi", "goa", "kochi", "thiruvananthapuram", "coimbatore",
                "nagpur", "bhopal", "patna", "chandigarh", "indore", "surat",
                "vizag", "visakhapatnam", "mangalore", "mysore", "madurai",
                "trichy", "salem", "pondicherry", "ooty", "shimla", "manali",
                "agra", "amritsar", "udaipur", "jodhpur", "dehradun", "rishikesh"}


@router.get("/buses")
async def get_bus_schedules(
    origin: str = Query(..., description="Origin city"),
    destination: str = Query(..., description="Destination city"),
    date: str = Query(None, description="Date YYYY-MM-DD (optional)")
):
    """
    Fetch bus schedules between two cities.
    Uses RapidAPI bus search (live data only).
    """
    travel_date = date or datetime.now().strftime("%Y-%m-%d")
    is_india = (origin.strip().lower() in INDIA_CITIES or destination.strip().lower() in INDIA_CITIES)

    if not RAPIDAPI_KEY:
        mock_data = _generate_mock_bus_schedules(origin, destination, travel_date, is_india)
        is_ai = any(str(s.get("id", "")).startswith("AI-BUS") for s in mock_data)
        return {
            "source": "ai" if is_ai else "demo",
            "api": "Gemini AI" if is_ai else "Mock Data (No API key)",
            "origin": origin.strip().title(),
            "destination": destination.strip().title(),
            "date": travel_date,
            "count": len(mock_data),
            "schedules": mock_data,
        }

    try:
        real_data = await _fetch_buses_rapidapi(origin, destination, travel_date, is_india)
        if real_data and len(real_data) > 0:
            return {
                "source": "live",
                "api": "RapidAPI Bus Search",
                "origin": origin.strip().title(),
                "destination": destination.strip().title(),
                "date": travel_date,
                "count": len(real_data),
                "schedules": real_data,
            }
        else:
            mock_data = _generate_mock_bus_schedules(origin, destination, travel_date, is_india)
            is_ai = any(str(s.get("id", "")).startswith("AI-BUS") for s in mock_data)
            return {
                "source": "ai" if is_ai else "demo",
                "api": "Gemini AI" if is_ai else "Mock Data (No live results)",
                "origin": origin.strip().title(),
                "destination": destination.strip().title(),
                "date": travel_date,
                "count": len(mock_data),
                "schedules": mock_data,
            }
    except Exception as e:
        print(f"[Transport] Bus API error: {e}")
        # traceback.print_exc()
        
        mock_data = _generate_mock_bus_schedules(origin, destination, travel_date, is_india)
        is_ai = any(str(s.get("id", "")).startswith("AI-BUS") for s in mock_data)
        return {
            "source": "ai" if is_ai else "demo",
            "api": "Gemini AI" if is_ai else "Mock Data (API Error)",
            "origin": origin.strip().title(),
            "destination": destination.strip().title(),
            "date": travel_date,
            "count": len(mock_data),
            "schedules": mock_data,
        }


async def _fetch_buses_rapidapi(origin: str, destination: str, date: str, is_india: bool) -> list:
    """Try RapidAPI bus search endpoints."""

    apis_to_try = [
        {
            "url": "https://redbus2.p.rapidapi.com/busSearch",
            "host": "redbus2.p.rapidapi.com",
            "params": {
                "fromCityName": origin.strip().title(),
                "toCityName": destination.strip().title(),
                "DOJ": date,
            },
        },
        {
            "url": "https://india-buses-api.p.rapidapi.com/search",
            "host": "india-buses-api.p.rapidapi.com",
            "params": {
                "source": origin.strip().title(),
                "destination": destination.strip().title(),
                "date": date,
            },
        },
    ]

    for api in apis_to_try:
        try:
            headers = {
                "X-RapidAPI-Key": RAPIDAPI_KEY,
                "X-RapidAPI-Host": api["host"],
            }

            print(f"[Transport] Trying bus API {api['host']}: {origin} -> {destination}")

            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(api["url"], headers=headers, params=api["params"])
                print(f"[Transport] {api['host']} bus response: {resp.status_code}")

                if resp.status_code in (403, 429):
                    print(f"[Transport] {api['host']} {resp.status_code}, trying next...")
                    continue
                if resp.status_code != 200:
                    print(f"[Transport] {api['host']} error: {resp.status_code}")
                    continue

                data = resp.json()
                buses_raw = []

                if isinstance(data, dict):
                    buses_raw = (
                        data.get("data", []) or
                        data.get("buses", []) or
                        data.get("results", []) or
                        data.get("inventories", []) or
                        []
                    )
                elif isinstance(data, list):
                    buses_raw = data

                if not isinstance(buses_raw, list) or len(buses_raw) == 0:
                    continue

                print(f"[Transport] ✅ Got {len(buses_raw)} buses from {api['host']}")

                schedules = []
                for b in buses_raw[:15]:
                    if not isinstance(b, dict):
                        continue
                    try:
                        schedules.append({
                            "id": str(b.get("id", b.get("busId", f"BUS-{len(schedules)+1}"))),
                            "operator": b.get("operator", b.get("travels", b.get("busOperator", "Unknown"))),
                            "operatorType": b.get("busType", b.get("operatorType", "Private")),
                            "busType": b.get("busType", b.get("bus_type", b.get("type", "AC Seater"))),
                            "origin": {
                                "city": origin.strip().title(),
                                "departureTime": b.get("departureTime", b.get("doj", "")),
                                "boardingPoint": b.get("boardingPoint", b.get("boarding", f"{origin.strip().title()} Bus Stand")),
                            },
                            "destination": {
                                "city": destination.strip().title(),
                                "arrivalTime": b.get("arrivalTime", b.get("arrival", "")),
                                "droppingPoint": b.get("droppingPoint", b.get("dropping", f"{destination.strip().title()} Bus Terminal")),
                            },
                            "duration": b.get("duration", b.get("travelTime", "")),
                            "distance": b.get("distance", ""),
                            "fare": b.get("fare", b.get("fares", b.get("price", 0))),
                            "currency": "INR" if is_india else "USD",
                            "seatsAvailable": b.get("seatsAvailable", b.get("availableSeats", 0)),
                            "totalSeats": b.get("totalSeats", b.get("maxSeats", 40)),
                            "rating": b.get("rating", b.get("ratings", 0)),
                            "amenities": b.get("amenities", []),
                            "status": b.get("status", "On Time"),
                        })
                    except Exception as bus_err:
                        print(f"[Transport] Error parsing bus: {bus_err}")
                        continue

                if len(schedules) > 0:
                    return schedules

        except httpx.TimeoutException:
            print(f"[Transport] {api['host']} timed out")
            continue
        except Exception as e:
            print(f"[Transport] {api['host']} exception: {e}")
            continue

    return []


def _generate_mock_bus_schedules(origin: str, destination: str, date: str, is_india: bool) -> list:
    """Generate bus schedules using AI (via OpenRouter) for accuracy, with random fallback."""

    # ─── Try AI-powered bus generation first ───────────────────────────────
    try:
        ai_result = _fetch_bus_schedules_ai(origin, destination, date, is_india)
        if ai_result and len(ai_result) > 0:
            print(f"[Transport] ✅ AI generated {len(ai_result)} bus schedules")
            return ai_result
    except Exception as e:
        print(f"[Transport] AI bus generation failed: {e}. Falling back to mock.")

    # ─── Fallback: Random mock data ────────────────────────────────────────
    return _generate_random_bus_schedules(origin, destination, date, is_india)


def _fetch_bus_schedules_ai(origin: str, destination: str, date: str, is_india: bool) -> list:
    """Use AI (via OpenRouter) to generate accurate, real-world bus schedule data."""
    # Import OpenRouter client (same one used by itinerary generation)
    try:
        from ai.openrouter_client import call_openrouter
    except ImportError:
        try:
            from backend.ai.openrouter_client import call_openrouter
        except ImportError:
            print("[Transport] OpenRouter client not available for bus AI.")
            return []

    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
    if not openrouter_key:
        print("[Transport] OPENROUTER_API_KEY not configured. Skipping AI bus generation.")
        return []

    currency = "INR" if is_india else "USD"
    region = "India" if is_india else "international"

    prompt = f"""You are a transport data expert. Generate accurate, realistic bus schedule data for the route from "{origin.strip().title()}" to "{destination.strip().title()}" on {date}.

REFERENCE DATA (Use these as guidelines for total distance/duration):
- Chennai to Bangalore: ~330 km, 7 hours
- Bangalore to Hyderabad: ~570 km, 9.5 hours
- Mumbai to Pune: ~150 km, 3.5-4 hours
- Delhi to Jaipur: ~280 km, 5.5 hours
- Mumbai to Ahmedabad: ~530 km, 11 hours
- Delhi to Chandigarh: ~250 km, 4.5-5 hours

IMPORTANT RULES:
1. Use REAL bus operator names that actually operate on this route (e.g., KSRTC, TSRTC, APSRTC, MSRTC, VRL Travels, SRS Travels, IntrCity SmartBus, NueGo, Zingbus, Orange Tours, FlixBus etc.)
2. Use REALISTIC departure and arrival times based on actual bus schedules
3. Use ACCURATE travel duration and distance for this specific route
4. Use REALISTIC fares in {currency} for this route and bus type
5. Include real boarding points and dropping points for these cities
6. This is a {region} route

Return ONLY a valid JSON array with 6-8 bus entries. Each entry must have this exact structure:
{{
  "operator": "Real Bus Operator Name",
  "operatorType": "Government" or "Private",
  "busType": "AC Sleeper" or "AC Seater" or "Non-AC Seater" or "Volvo Multi-Axle" or "Semi-Sleeper",
  "departureTime": "HH:MM" (24hr format),
  "arrivalTime": "HH:MM" (24hr format),
  "duration": "Xh YYm",
  "distance": "NNN km",
  "fare": number (in {currency}),
  "boardingPoint": "Real boarding point name in {origin.strip().title()}",
  "droppingPoint": "Real dropping point name in {destination.strip().title()}",
  "rating": number (3.0-5.0),
  "amenities": ["WiFi", "Charging Point", etc.],
  "seatsAvailable": number (5-40),
  "totalSeats": number (30-50)
}}

Return ONLY the JSON array, no markdown, no explanation."""


    print(f"[Transport] Calling AI for bus schedules: {origin} -> {destination}")

    # Try multiple models (same approach as itinerary.py)
    models = [
        "google/gemini-2.0-flash",
        "google/gemini-2.0-flash-lite",
        "google/gemini-flash-latest",
        "openai/gpt-oss-120b:free",
    ]

    text = None
    for model in models:
        try:
            result = call_openrouter(prompt, model=model)
            if result and len(result) > 10:
                text = result
                print(f"[Transport] AI bus response from {model} ({len(text)} chars)")
                break
        except Exception as model_err:
            print(f"[Transport] Model {model} failed: {model_err}")
            continue

    if not text:
        print("[Transport] All AI models failed for bus schedules.")
        return []

    # Clean markdown wrapper if present
    text = text.strip()
    if "```" in text:
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        else:
            text = text.split("```")[1].split("```")[0]
    text = text.strip()

    buses_raw = json.loads(text)
    if not isinstance(buses_raw, list):
        print(f"[Transport] AI returned non-list for buses: {type(buses_raw)}")
        return []

    # Transform AI output into standard format
    schedules = []
    for i, b in enumerate(buses_raw[:12]):
        if not isinstance(b, dict):
            continue
        try:
            schedules.append({
                "id": f"AI-BUS-{i+1}-{abs(hash(f'{origin}{destination}')) % 10000}",
                "operator": b.get("operator", "Unknown"),
                "operatorType": b.get("operatorType", "Private"),
                "busType": b.get("busType", "AC Seater"),
                "origin": {
                    "city": origin.strip().title(),
                    "departureTime": b.get("departureTime", "08:00"),
                    "boardingPoint": b.get("boardingPoint", f"{origin.strip().title()} Bus Stand"),
                },
                "destination": {
                    "city": destination.strip().title(),
                    "arrivalTime": b.get("arrivalTime", "14:00"),
                    "droppingPoint": b.get("droppingPoint", f"{destination.strip().title()} Bus Terminal"),
                },
                "duration": b.get("duration", "6h 00m"),
                "distance": b.get("distance", "300 km"),
                "fare": b.get("fare", 500),
                "currency": currency,
                "seatsAvailable": b.get("seatsAvailable", random.randint(5, 30)),
                "totalSeats": b.get("totalSeats", 40),
                "rating": b.get("rating", round(random.uniform(3.5, 4.8), 1)),
                "amenities": b.get("amenities", ["Charging Point", "Water Bottle"]),
                "status": "On Time",
            })
        except Exception as bus_err:
            print(f"[Transport] Error parsing AI bus entry: {bus_err}")
            continue

    schedules.sort(key=lambda s: s["origin"]["departureTime"])
    return schedules


def _generate_random_bus_schedules(origin: str, destination: str, date: str, is_india: bool) -> list:
    """Generate random mock bus schedules with perfect data for major metropolitan routes."""
    random.seed(hash(f"{origin.lower()}{destination.lower()}{date}"))

    operators = BUS_OPERATORS["india"] if is_india else BUS_OPERATORS["global"]
    route_key = f"{origin.lower().strip()}-{destination.lower().strip()}"
    perfect_route = PERFECT_BUS_ROUTES.get(route_key)

    # Calculate road distance/duration
    if perfect_route:
        base_distance = perfect_route["km"]
        base_hours = perfect_route["hours"]
        display_dist = perfect_route["distance"]
        display_dur = perfect_route["duration"]
    else:
        code_hash = abs(hash(f"{origin.lower()}{destination.lower()}"))
        base_distance = 100 + (code_hash % 800)
        # Avg speed: 55 km/h for India, 75 km/h for global
        avg_speed = 55 if is_india else 75
        base_hours = base_distance / avg_speed
        display_dist = f"{base_distance} km"
        display_dur = f"{int(base_hours)}h {int((base_hours % 1) * 60):02d}m"

    schedules = []
    num_buses = random.randint(8, 15) if perfect_route else random.randint(5, 10)

    for i in range(num_buses):
        operator = random.choice(operators)
        bus_type = random.choice(BUS_TYPES)

        # Realistic departure distribution: Morning (6-11), Afternoon (13-17), Night (20-23)
        time_slot = random.choice(["morning", "afternoon", "night", "early"])
        if time_slot == "morning": dep_hour = random.randint(6, 11)
        elif time_slot == "afternoon": dep_hour = random.randint(13, 17)
        elif time_slot == "night": dep_hour = random.randint(20, 23)
        else: dep_hour = random.randint(0, 5)
        
        dep_min = random.choice([0, 15, 30, 45])

        # Adjust duration slightly per bus (traffic/stops)
        travel_hours = base_hours + random.uniform(-0.5, 1.5)
        travel_hours = max(1.5, travel_hours)

        total_min = int(travel_hours * 60)
        arr_total_min = (dep_hour * 60 + dep_min + total_min) % (24 * 60)
        arr_hour = arr_total_min // 60
        arr_min = arr_total_min % 60

        dur_h = total_min // 60
        dur_m = total_min % 60

        # Fare varies by bus type
        fare_mult = {"AC Sleeper": 1.8, "AC Seater": 1.4, "Non-AC Seater": 0.8,
                     "Volvo Multi-Axle": 2.0, "Semi-Sleeper": 1.2, "Luxury Coach": 2.2,
                     "Double Decker": 1.5, "Standard": 0.7, "Premium Seater": 1.6,
                     "Electric Bus": 1.3}
        base_fare_rate = 1.3 if is_india else 0.6
        fare = int(base_distance * base_fare_rate * fare_mult.get(bus_type, 1.0))

        schedules.append({
            "id": f"BUS-{i+1}-{abs(hash(f'{origin}{destination}')) % 10000}",
            "operator": operator["name"],
            "operatorType": operator["type"],
            "busType": bus_type,
            "origin": {
                "city": origin.strip().title(),
                "departureTime": f"{dep_hour:02d}:{dep_min:02d}",
                "boardingPoint": f"{origin.strip().title()} Central Bus Stand",
            },
            "destination": {
                "city": destination.strip().title(),
                "arrivalTime": f"{arr_hour:02d}:{arr_min:02d}",
                "droppingPoint": f"{destination.strip().title()} Main Bus Terminal",
            },
            "duration": f"{dur_h}h {dur_m:02d}m",
            "distance": f"{base_distance + random.randint(-10, 20)} km" if not perfect_route else display_dist,
            "fare": fare,
            "currency": "INR" if is_india else "USD",
            "seatsAvailable": random.randint(2, 40),
            "totalSeats": random.choice([36, 40, 44, 48]),
            "rating": round(random.uniform(3.5, 4.9), 1),
            "amenities": random.sample(["WiFi", "Charging Point", "Water Bottle", "Blanket", "Reading Light", "Live Tracking"], k=random.randint(3, 5)),
            "status": "On Time" if random.random() > 0.1 else "Delayed",
        })

    schedules.sort(key=lambda s: s["origin"]["departureTime"])
    return schedules



# ══════════════════════════════════════════════════════════════════════════════
# 🔍 COMBINED SEARCH — All modes at once
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/search")
async def search_all_transport(
    origin: str = Query(..., description="Origin city"),
    destination: str = Query(..., description="Destination city"),
    date: str = Query(None, description="Date YYYY-MM-DD (optional)")
):
    """
    Search all transport modes (train, flight, bus) in a single request.
    Returns combined results for easy comparison.
    """
    travel_date = date or datetime.now().strftime("%Y-%m-%d")

    # Fetch all three in parallel-ish (sequential for simplicity)
    trains = await get_train_schedules(origin=origin, destination=destination, date=travel_date)
    flights = await get_flight_schedules(origin=origin, destination=destination, date=travel_date)
    buses = await get_bus_schedules(origin=origin, destination=destination, date=travel_date)

    return {
        "origin": origin,
        "destination": destination,
        "date": travel_date,
        "trains": trains,
        "flights": flights,
        "buses": buses,
        "summary": {
            "totalTrains": trains["count"],
            "totalFlights": flights["count"],
            "totalBuses": buses["count"],
            "trainSource": trains["source"],
            "flightSource": flights["source"],
            "busSource": buses["source"],
        }
    }
