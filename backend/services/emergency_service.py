COUNTRY_EMERGENCY = {
    # 🌍 Global / Default
    "default": {"number": "112", "label": "Emergency Services"},

    # 🇮🇳 Asia
    "India": {"number": "112", "label": "National Emergency"},
    "Japan": {"number": "110 / 119", "label": "Police / Fire & Ambulance"},
    "China": {"number": "110 / 120 / 119", "label": "Police / Ambulance / Fire"},
    "Singapore": {"number": "999", "label": "Emergency Services"},
    "UAE": {"number": "999", "label": "Police Emergency"},
    "Sri Lanka": {"number": "119", "label": "Emergency Services"},

    # 🇪🇺 Europe (mostly unified)
    "France": {"number": "112", "label": "European Emergency"},
    "Germany": {"number": "112", "label": "European Emergency"},
    "Italy": {"number": "112", "label": "European Emergency"},
    "Spain": {"number": "112", "label": "European Emergency"},
    "Netherlands": {"number": "112", "label": "European Emergency"},
    "Belgium": {"number": "112", "label": "European Emergency"},
    "Switzerland": {"number": "112", "label": "European Emergency"},
    "Sweden": {"number": "112", "label": "European Emergency"},
    "Norway": {"number": "112", "label": "European Emergency"},
    "Finland": {"number": "112", "label": "European Emergency"},
    "Ireland": {"number": "112 / 999", "label": "Emergency Services"},
    "UK": {"number": "999", "label": "Emergency Services"},

    # 🇺🇸 Americas
    "USA": {"number": "911", "label": "Emergency Services"},
    "Canada": {"number": "911", "label": "Emergency Services"},
    "Mexico": {"number": "911", "label": "Emergency Services"},
    "Brazil": {"number": "190 / 192 / 193", "label": "Police / Ambulance / Fire"},

    # 🇦🇺 Oceania
    "Australia": {"number": "000", "label": "Emergency Services"},
    "New Zealand": {"number": "111", "label": "Emergency Services"},

    # 🌍 Africa
    "South Africa": {"number": "10111", "label": "Police Emergency"},
    "Kenya": {"number": "999 / 112", "label": "Emergency Services"},
}

def get_emergency_numbers(country: str):
    # Try exact match, then case-insensitive, then default
    data = COUNTRY_EMERGENCY.get(country)
    if not data:
        # Case-insensitive search
        for k, v in COUNTRY_EMERGENCY.items():
            if k.lower() == country.lower():
                data = v
                break

    if not data:
        data = COUNTRY_EMERGENCY["default"]

    return {
        "primary": {
            "number": data["number"],
            "label": data["label"],
            "callable": True,
            "tel": f"tel:{data['number']}"
        }
    }

