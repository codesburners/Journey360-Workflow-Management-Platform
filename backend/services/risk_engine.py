def calculate_risk(news):
    if not news:
        return {
            "score": 10,
            "level": "Low",
            "reason": "No recent safety incidents reported."
        }

    score = 0
    reasons = []

    for n in news:
        if n["severity"] == "High":
            score += 30
            reasons.append("High severity incidents detected")
        elif n["severity"] == "Medium":
            score += 15
            reasons.append("Moderate safety concerns reported")
        else:
            score += 5

    score = min(score, 100)

    if score >= 70:
        level = "High"
    elif score >= 35:
        level = "Medium"
    else:
        level = "Low"

    return {
        "score": score,
        "level": level,
        "reason": ", ".join(set(reasons)) or "Minor incidents reported"
    }
