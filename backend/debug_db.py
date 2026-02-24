try:
    from backend.database.db import trips_collection, itineraries_collection
except ImportError:
    from database.db import trips_collection, itineraries_collection
import json
from bson import json_util

def debug_print():
    with open("output.txt", "w", encoding="utf-8") as f:
        f.write("--- TRIPS ---\n")
        trips = list(trips_collection.find())
        for t in trips:
            f.write(f"Trip ID: {t.get('trip_id')}, Dest: {t.get('destination')}, User: {t.get('user_id')}\n")

        f.write("\n--- ITINERARIES ---\n")
        itineraries = list(itineraries_collection.find())
        for i in itineraries:
            f.write(f"Itinerary ID: {i.get('itineraryId')}, Trip ID: {i.get('tripId')}, Dest: {i.get('destination')}\n")
            if i.get('tripId'):
                match = any(t.get('trip_id') == i.get('tripId') for t in trips)
                f.write(f"  -> Matching Trip Found? {match}\n")

if __name__ == "__main__":
    debug_print()
