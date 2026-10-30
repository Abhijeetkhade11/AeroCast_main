"""
Real US airport metadata sourced from OurAirports (ourairports.com — public domain).
Filtered to major US domestic airports with IATA codes.
"""
from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

# ── Major US Domestic Airports ──────────────────────────────────────────────
# Source: OurAirports (ourairports.com) — public domain dataset
# Fields: iata, name, city, state, lat, lon, timezone
US_AIRPORTS: List[Dict[str, Any]] = [
    {"iata": "ATL", "name": "Hartsfield-Jackson Atlanta International", "city": "Atlanta", "state": "GA", "lat": 33.6407, "lon": -84.4277, "tz": "America/New_York"},
    {"iata": "LAX", "name": "Los Angeles International", "city": "Los Angeles", "state": "CA", "lat": 33.9425, "lon": -118.4081, "tz": "America/Los_Angeles"},
    {"iata": "ORD", "name": "O'Hare International", "city": "Chicago", "state": "IL", "lat": 41.9742, "lon": -87.9073, "tz": "America/Chicago"},
    {"iata": "DFW", "name": "Dallas/Fort Worth International", "city": "Dallas-Fort Worth", "state": "TX", "lat": 32.8998, "lon": -97.0403, "tz": "America/Chicago"},
    {"iata": "DEN", "name": "Denver International", "city": "Denver", "state": "CO", "lat": 39.8561, "lon": -104.6737, "tz": "America/Denver"},
    {"iata": "JFK", "name": "John F. Kennedy International", "city": "New York", "state": "NY", "lat": 40.6413, "lon": -73.7781, "tz": "America/New_York"},
    {"iata": "SFO", "name": "San Francisco International", "city": "San Francisco", "state": "CA", "lat": 37.6213, "lon": -122.379, "tz": "America/Los_Angeles"},
    {"iata": "SEA", "name": "Seattle-Tacoma International", "city": "Seattle", "state": "WA", "lat": 47.4502, "lon": -122.3088, "tz": "America/Los_Angeles"},
    {"iata": "LAS", "name": "Harry Reid International", "city": "Las Vegas", "state": "NV", "lat": 36.0840, "lon": -115.1537, "tz": "America/Los_Angeles"},
    {"iata": "MCO", "name": "Orlando International", "city": "Orlando", "state": "FL", "lat": 28.4294, "lon": -81.3089, "tz": "America/New_York"},
    {"iata": "EWR", "name": "Newark Liberty International", "city": "Newark", "state": "NJ", "lat": 40.6895, "lon": -74.1745, "tz": "America/New_York"},
    {"iata": "CLT", "name": "Charlotte Douglas International", "city": "Charlotte", "state": "NC", "lat": 35.2140, "lon": -80.9431, "tz": "America/New_York"},
    {"iata": "PHX", "name": "Phoenix Sky Harbor International", "city": "Phoenix", "state": "AZ", "lat": 33.4373, "lon": -112.0078, "tz": "America/Phoenix"},
    {"iata": "IAH", "name": "George Bush Intercontinental", "city": "Houston", "state": "TX", "lat": 29.9902, "lon": -95.3368, "tz": "America/Chicago"},
    {"iata": "MIA", "name": "Miami International", "city": "Miami", "state": "FL", "lat": 25.7959, "lon": -80.2870, "tz": "America/New_York"},
    {"iata": "BOS", "name": "Boston Logan International", "city": "Boston", "state": "MA", "lat": 42.3656, "lon": -71.0096, "tz": "America/New_York"},
    {"iata": "MSP", "name": "Minneapolis–Saint Paul International", "city": "Minneapolis", "state": "MN", "lat": 44.8848, "lon": -93.2223, "tz": "America/Chicago"},
    {"iata": "FLL", "name": "Fort Lauderdale-Hollywood International", "city": "Fort Lauderdale", "state": "FL", "lat": 26.0726, "lon": -80.1527, "tz": "America/New_York"},
    {"iata": "LGA", "name": "LaGuardia Airport", "city": "New York", "state": "NY", "lat": 40.7772, "lon": -73.8726, "tz": "America/New_York"},
    {"iata": "DTW", "name": "Detroit Metropolitan Wayne County", "city": "Detroit", "state": "MI", "lat": 42.2162, "lon": -83.3554, "tz": "America/Detroit"},
    {"iata": "BWI", "name": "Baltimore/Washington International", "city": "Baltimore", "state": "MD", "lat": 39.1754, "lon": -76.6683, "tz": "America/New_York"},
    {"iata": "DCA", "name": "Ronald Reagan Washington National", "city": "Washington", "state": "DC", "lat": 38.8521, "lon": -77.0377, "tz": "America/New_York"},
    {"iata": "IAD", "name": "Washington Dulles International", "city": "Dulles", "state": "VA", "lat": 38.9531, "lon": -77.4565, "tz": "America/New_York"},
    {"iata": "MDW", "name": "Chicago Midway International", "city": "Chicago", "state": "IL", "lat": 41.7868, "lon": -87.7522, "tz": "America/Chicago"},
    {"iata": "SLC", "name": "Salt Lake City International", "city": "Salt Lake City", "state": "UT", "lat": 40.7884, "lon": -111.9778, "tz": "America/Denver"},
    {"iata": "SAN", "name": "San Diego International", "city": "San Diego", "state": "CA", "lat": 32.7338, "lon": -117.1933, "tz": "America/Los_Angeles"},
    {"iata": "TPA", "name": "Tampa International", "city": "Tampa", "state": "FL", "lat": 27.9755, "lon": -82.5332, "tz": "America/New_York"},
    {"iata": "HNL", "name": "Daniel K. Inouye International", "city": "Honolulu", "state": "HI", "lat": 21.3245, "lon": -157.9251, "tz": "Pacific/Honolulu"},
    {"iata": "ANC", "name": "Ted Stevens Anchorage International", "city": "Anchorage", "state": "AK", "lat": 61.1744, "lon": -149.9982, "tz": "America/Anchorage"},
    {"iata": "PDX", "name": "Portland International", "city": "Portland", "state": "OR", "lat": 45.5898, "lon": -122.5951, "tz": "America/Los_Angeles"},
    {"iata": "STL", "name": "St. Louis Lambert International", "city": "St. Louis", "state": "MO", "lat": 38.7487, "lon": -90.3700, "tz": "America/Chicago"},
    {"iata": "MCI", "name": "Kansas City International", "city": "Kansas City", "state": "MO", "lat": 39.2976, "lon": -94.7139, "tz": "America/Chicago"},
    {"iata": "RDU", "name": "Raleigh-Durham International", "city": "Raleigh-Durham", "state": "NC", "lat": 35.8776, "lon": -78.7875, "tz": "America/New_York"},
    {"iata": "HOU", "name": "William P. Hobby Airport", "city": "Houston", "state": "TX", "lat": 29.6454, "lon": -95.2789, "tz": "America/Chicago"},
    {"iata": "OAK", "name": "Oakland Metropolitan International", "city": "Oakland", "state": "CA", "lat": 37.7213, "lon": -122.2208, "tz": "America/Los_Angeles"},
    {"iata": "MKE", "name": "Milwaukee Mitchell International", "city": "Milwaukee", "state": "WI", "lat": 42.9472, "lon": -87.8966, "tz": "America/Chicago"},
    {"iata": "PHL", "name": "Philadelphia International", "city": "Philadelphia", "state": "PA", "lat": 39.8719, "lon": -75.2411, "tz": "America/New_York"},
    {"iata": "BNA", "name": "Nashville International", "city": "Nashville", "state": "TN", "lat": 36.1245, "lon": -86.6782, "tz": "America/Chicago"},
    {"iata": "MEM", "name": "Memphis International", "city": "Memphis", "state": "TN", "lat": 35.0424, "lon": -89.9767, "tz": "America/Chicago"},
    {"iata": "CLE", "name": "Cleveland Hopkins International", "city": "Cleveland", "state": "OH", "lat": 41.4117, "lon": -81.8498, "tz": "America/New_York"},
    {"iata": "PIT", "name": "Pittsburgh International", "city": "Pittsburgh", "state": "PA", "lat": 40.4915, "lon": -80.2329, "tz": "America/New_York"},
    {"iata": "CMH", "name": "John Glenn Columbus International", "city": "Columbus", "state": "OH", "lat": 39.9980, "lon": -82.8919, "tz": "America/New_York"},
    {"iata": "MSY", "name": "Louis Armstrong New Orleans International", "city": "New Orleans", "state": "LA", "lat": 29.9934, "lon": -90.2580, "tz": "America/Chicago"},
    {"iata": "SNA", "name": "John Wayne Airport", "city": "Santa Ana", "state": "CA", "lat": 33.6757, "lon": -117.8682, "tz": "America/Los_Angeles"},
    {"iata": "SMF", "name": "Sacramento International", "city": "Sacramento", "state": "CA", "lat": 38.6954, "lon": -121.5908, "tz": "America/Los_Angeles"},
    {"iata": "AUS", "name": "Austin-Bergstrom International", "city": "Austin", "state": "TX", "lat": 30.1975, "lon": -97.6664, "tz": "America/Chicago"},
    {"iata": "SAT", "name": "San Antonio International", "city": "San Antonio", "state": "TX", "lat": 29.5337, "lon": -98.4698, "tz": "America/Chicago"},
    {"iata": "IND", "name": "Indianapolis International", "city": "Indianapolis", "state": "IN", "lat": 39.7173, "lon": -86.2944, "tz": "America/Indiana/Indianapolis"},
    {"iata": "JAX", "name": "Jacksonville International", "city": "Jacksonville", "state": "FL", "lat": 30.4941, "lon": -81.6879, "tz": "America/New_York"},
    {"iata": "OMA", "name": "Eppley Airfield", "city": "Omaha", "state": "NE", "lat": 41.3032, "lon": -95.8941, "tz": "America/Chicago"},
]

# ── US Airlines ─────────────────────────────────────────────────────────────
# Source: BTS carrier code list
US_AIRLINES: List[Dict[str, str]] = [
    {"code": "AA", "name": "American Airlines", "iata": "AA"},
    {"code": "UA", "name": "United Airlines", "iata": "UA"},
    {"code": "DL", "name": "Delta Air Lines", "iata": "DL"},
    {"code": "WN", "name": "Southwest Airlines", "iata": "WN"},
    {"code": "B6", "name": "JetBlue Airways", "iata": "B6"},
    {"code": "AS", "name": "Alaska Airlines", "iata": "AS"},
    {"code": "NK", "name": "Spirit Airlines", "iata": "NK"},
    {"code": "F9", "name": "Frontier Airlines", "iata": "F9"},
    {"code": "G4", "name": "Allegiant Air", "iata": "G4"},
    {"code": "SY", "name": "Sun Country Airlines", "iata": "SY"},
    {"code": "HA", "name": "Hawaiian Airlines", "iata": "HA"},
    {"code": "MX", "name": "Breeze Airways", "iata": "MX"},
]

AIRPORT_MAP = {a["iata"]: a for a in US_AIRPORTS}


@router.get("/airports")
async def get_airports():
    """Return list of supported US domestic airports."""
    return {"airports": US_AIRPORTS, "count": len(US_AIRPORTS)}


@router.get("/airports/{iata}")
async def get_airport(iata: str):
    """Return metadata for a single airport by IATA code."""
    code = iata.upper()
    if code not in AIRPORT_MAP:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Airport '{code}' not found.")
    return AIRPORT_MAP[code]


@router.get("/airlines")
async def get_airlines():
    """Return list of supported US domestic carriers."""
    return {"airlines": US_AIRLINES, "count": len(US_AIRLINES)}
