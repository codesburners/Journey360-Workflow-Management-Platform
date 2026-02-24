/**
 * Transport Services — OpenRouteService API Integration
 * Real geocoding, routing, and directions via ORS API.
 * Falls back to mock data if API key is missing or API fails.
 * Keeps: crowd density sim, traffic sim, delays, QR tickets, itinerary download.
 */

const ORS_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ORS_API_KEY) || '';
const ORS_BASE = 'https://api.openrouteservice.org';
const BACKEND_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) || 'http://localhost:8001';

// ─── Transport Config ────────────────────────────────────────────────────────

const TRANSPORT_CONFIG = {
    'driving-car': { farePerKm: 3.5, basefare: 50, speedKmh: 45, color: '#F97316', icon: 'Car', label: 'Drive' },
    'foot-walking': { farePerKm: 0, basefare: 0, speedKmh: 4.5, color: '#10B981', icon: 'Footprints', label: 'Walk' },
    'cycling-regular': { farePerKm: 0, basefare: 0, speedKmh: 12, color: '#3B82F6', icon: 'Bike', label: 'Cycle' },
    // Legacy keys for UI compatibility
    train: { farePerKm: 1.2, basefare: 40, speedKmh: 65, color: '#3B82F6', icon: 'Train', label: 'Train' },
    bus: { farePerKm: 2.2, basefare: 50, speedKmh: 28, color: '#F97316', icon: 'Bus', label: 'Bus' },
    airport: { farePerKm: 6.5, basefare: 2500, speedKmh: 550, color: '#8B5CF6', icon: 'Plane', label: 'Airport' },
    walk: { farePerKm: 0, basefare: 0, speedKmh: 4.5, color: '#10B981', icon: 'Footprints', label: 'Walk' },
};

// ─── ORS Profile Mapping ─────────────────────────────────────────────────────
// Maps the UI mode toggles to ORS routing profiles

const MODE_TO_PROFILES = {
    train: ['driving-car'],         // Best ground route proxy
    bus: ['driving-car'],           // Same road network
    airport: ['driving-car'],       // Driving to airport
};

// ─── Mock Station Database (Fallback) ────────────────────────────────────────

const STATIONS = {
    trains: [
        { id: 'CST', name: 'Chhatrapati Shivaji Terminus', city: 'Mumbai', lat: 18.9398, lng: 72.8355, type: 'train', lines: ['Central', 'Harbour'] },
        { id: 'DR', name: 'Dadar', city: 'Mumbai', lat: 19.0178, lng: 72.8437, type: 'train', lines: ['Central', 'Western'] },
        { id: 'AN', name: 'Andheri', city: 'Mumbai', lat: 19.1197, lng: 72.8464, type: 'train', lines: ['Western', 'Harbour'] },
        { id: 'BV', name: 'Borivali', city: 'Mumbai', lat: 19.2283, lng: 72.8567, type: 'train', lines: ['Western'] },
        { id: 'TH', name: 'Thane', city: 'Mumbai', lat: 19.1854, lng: 72.9752, type: 'train', lines: ['Central', 'Trans-Harbour'] },
        { id: 'KR', name: 'Kurla', city: 'Mumbai', lat: 19.0653, lng: 72.8793, type: 'train', lines: ['Central', 'Harbour'] },
        { id: 'VL', name: 'Vile Parle', city: 'Mumbai', lat: 19.0989, lng: 72.8437, type: 'train', lines: ['Western'] },
        { id: 'GR', name: 'Goregaon', city: 'Mumbai', lat: 19.1641, lng: 72.8493, type: 'train', lines: ['Western'] },
        { id: 'CC', name: 'Churchgate', city: 'Mumbai', lat: 18.9350, lng: 72.8274, type: 'train', lines: ['Western'] },
        { id: 'PL', name: 'Panvel', city: 'Mumbai', lat: 18.9933, lng: 73.1170, type: 'train', lines: ['Harbour', 'Trans-Harbour'] },
    ],
    buses: [
        { id: 'B1', name: 'CSMT Bus Depot', city: 'Mumbai', lat: 18.9405, lng: 72.8358, type: 'bus', routes: ['1', '3', '6', '21'] },
        { id: 'B2', name: 'Dadar Bus Stand (E)', city: 'Mumbai', lat: 19.0180, lng: 72.8450, type: 'bus', routes: ['6', '22', '83'] },
        { id: 'B3', name: 'Andheri Bus Stand', city: 'Mumbai', lat: 19.1190, lng: 72.8480, type: 'bus', routes: ['203', '211', '305'] },
        { id: 'B4', name: 'BKC Bus Stop', city: 'Mumbai', lat: 19.0655, lng: 72.8680, type: 'bus', routes: ['332', '354'] },
        { id: 'B5', name: 'Borivali Bus Depot', city: 'Mumbai', lat: 19.2290, lng: 72.8575, type: 'bus', routes: ['294', '460'] },
        { id: 'B6', name: 'Haji Ali', city: 'Mumbai', lat: 18.9827, lng: 72.8121, type: 'bus', routes: ['83', '132', '161'] },
        { id: 'B7', name: 'Bandra Station', city: 'Mumbai', lat: 19.0544, lng: 72.8402, type: 'bus', routes: ['211', '215', '354'] },
        { id: 'B8', name: 'Juhu Beach', city: 'Mumbai', lat: 19.0896, lng: 72.8267, type: 'bus', routes: ['211', '231'] },
    ],
    airports: [
        { id: 'BOM1', name: 'Mumbai Airport T1 (Domestic)', city: 'Mumbai', lat: 19.0937, lng: 72.8568, type: 'airport' },
        { id: 'BOM2', name: 'Mumbai Airport T2 (International)', city: 'Mumbai', lat: 19.0896, lng: 72.8656, type: 'airport' },
    ]
};

const ALL_STOPS = [...STATIONS.trains, ...STATIONS.buses, ...STATIONS.airports];

// ─── Utility Functions ───────────────────────────────────────────────────────

function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function decodePolyline(encoded) {
    // ORS returns encoded polyline; decode to [lat, lng] pairs
    const coords = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lat += (result & 1) ? ~(result >> 1) : (result >> 1);

        shift = 0; result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lng += (result & 1) ? ~(result >> 1) : (result >> 1);

        coords.push([lat / 1e5, lng / 1e5]);
    }
    return coords;
}

// ─── Crowd Density Simulation ────────────────────────────────────────────────

function getCrowdDensity(stopId, transportType) {
    const hour = new Date().getHours();
    const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    const hash = (stopId || 'x').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    if (isPeak) return hash % 3 === 0 ? 'High' : 'Medium';
    return hash % 4 === 0 ? 'Medium' : 'Low';
}

// ─── Traffic Simulation ──────────────────────────────────────────────────────

function getTrafficMultiplier() {
    const hour = new Date().getHours();
    if (hour >= 8 && hour <= 10) return 1.5;
    if (hour >= 17 && hour <= 20) return 1.6;
    if (hour >= 12 && hour <= 14) return 1.2;
    return 1.0;
}

function getTrafficLevel() {
    const m = getTrafficMultiplier();
    if (m >= 1.5) return { level: 'Heavy', color: '#EF4444', delay: '+15-20 min' };
    if (m >= 1.2) return { level: 'Moderate', color: '#F59E0B', delay: '+5-10 min' };
    return { level: 'Light', color: '#10B981', delay: 'On time' };
}

// ─── Delay / Alert Simulation ────────────────────────────────────────────────

function getTrainDelay(stationId) {
    const hash = (stationId || 'x').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const delayChance = hash % 5;
    if (delayChance === 0) return { delayed: true, minutes: 10 + (hash % 15), reason: 'Signal failure reported' };
    if (delayChance === 1) return { delayed: true, minutes: 5 + (hash % 8), reason: 'Overcrowding at platform' };
    return { delayed: false, minutes: 0, reason: null };
}

function getAirportReminder(flightTime) {
    const now = new Date();
    const diff = (flightTime - now) / (1000 * 60);
    if (diff <= 120 && diff > 90) return { priority: 'warning', message: 'Leave now! Your flight is in 2 hours.' };
    if (diff <= 90 && diff > 60) return { priority: 'critical', message: '⚠️ Urgent: Less than 90 min to departure!' };
    if (diff <= 60) return { priority: 'critical', message: '🚨 You may miss your flight! Depart immediately!' };
    return { priority: 'info', message: `Flight in ${Math.round(diff)} min. Plan your departure.` };
}

// ─── ORS API: Place Search (Geocode Autocomplete) ────────────────────────────

async function searchPlaces(query) {
    if (!query || query.length < 2) return [];

    let results = [];

    // 1. Try Frontend ORS API if key exists
    if (ORS_API_KEY) {
        try {
            const params = new URLSearchParams({
                api_key: ORS_API_KEY,
                text: query,
                size: 8,
                'boundary.country': 'IN', // Bias to India
            });

            const res = await fetch(`${ORS_BASE}/geocode/autocomplete?${params}`);
            if (res.ok) {
                const data = await res.json();
                results = (data.features || []).map((f, i) => ({
                    id: f.properties.id || `ors-${i}`,
                    name: f.properties.label || f.properties.name || 'Unknown',
                    lat: f.geometry.coordinates[1],
                    lng: f.geometry.coordinates[0],
                    type: mapOrsType(f.properties.layer),
                    region: f.properties.region || '',
                    country: f.properties.country || '',
                }));
            }
        } catch (err) {
            console.warn('ORS geocode failed:', err.message);
        }
    }

    // 2. If no results or frontend failed, try Backend Geocode API (Robust Fallback)
    if (results.length === 0) {
        try {
            const res = await fetch(`${BACKEND_URL}/api/transport/geocode?query=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                results = [{
                    id: `backend-${Date.now()}`,
                    name: data.name,
                    lat: data.lat,
                    lng: data.lng,
                    type: 'place',
                    region: 'Resolved via Backend',
                    country: 'IN'
                }];
            }
        } catch (err) {
            console.warn('Backend geocode fallback failed:', err.message);
        }
    }

    // 3. Last resort: internal static fallback
    if (results.length === 0) {
        return searchStopsFallback(query);
    }

    return results;
}

function mapOrsType(layer) {
    if (!layer) return 'place';
    if (layer.includes('station') || layer.includes('stop')) return 'train';
    if (layer.includes('airport') || layer.includes('aerodrome')) return 'airport';
    return 'place';
}

function searchStopsFallback(query) {
    const q = query.toLowerCase();
    return ALL_STOPS
        .filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
        .slice(0, 8);
}

// ─── ORS API: Route Generation ───────────────────────────────────────────────

async function generateRoute(sourceLat, sourceLng, destLat, destLng, modes = ['train', 'bus', 'airport'], sourceName = null, destName = null) {

    // 1. Generate base routes (ORS or Fallback)
    let routes = [];
    if (!ORS_API_KEY) {
        routes = generateRouteFallback(sourceLat, sourceLng, destLat, destLng, modes);
    } else {
        const profilesToQuery = new Set();
        profilesToQuery.add('foot-walking');
        for (const mode of modes) {
            const profiles = MODE_TO_PROFILES[mode] || ['driving-car'];
            profiles.forEach(p => profilesToQuery.add(p));
        }

        const profileArray = [...profilesToQuery];
        const results = await Promise.allSettled(
            profileArray.map(profile => fetchOrsRoute(sourceLat, sourceLng, destLat, destLng, profile))
        );

        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
                routes.push(result.value);
            }
        });

        if (routes.length === 0) {
            routes = generateRouteFallback(sourceLat, sourceLng, destLat, destLng, modes);
        }
    }

    // 2. FETCH REAL LIVE DATA and inject into legs
    // We attempt to find real schedules for the main origin and destination cities
    try {
        // Use passed names or extract from legs
        const originName = sourceName || routes[0]?.legs[0]?.from?.name || 'Origin';
        const destName = destName || routes[0]?.legs[routes[0].legs.length - 1]?.to?.name || 'Destination';

        // Check if we have at least one valid-looking name (not the default placeholders)
        const isDefault = (n) => !n || n === 'Origin' || n === 'Destination' || n === 'Your Location';

        if (!isDefault(originName) && !isDefault(destName)) {
            const liveData = await fetchAllSchedules(originName, destName);

            // Inject live data into relevant legs for each route
            routes = routes.map(route => {
                const updatedLegs = route.legs.map(leg => {
                    if (leg.mode === 'train' && liveData.trains?.schedules?.length > 0) {
                        const real = liveData.trains.schedules[0]; // Take best match
                        return {
                            ...leg,
                            routeNumber: real.trainNumber,
                            label: real.trainName,
                            fare: Object.values(real.fare || {})[0] || leg.fare,
                            isLive: true,
                            realDetails: real
                        };
                    }
                    if (leg.mode === 'airport' && liveData.flights?.schedules?.length > 0) {
                        const real = liveData.flights.schedules[0];
                        return {
                            ...leg,
                            routeNumber: real.flightNumber,
                            label: real.airline,
                            fare: Object.values(real.fare || {})[0] || leg.fare,
                            isLive: true,
                            realDetails: real
                        };
                    }
                    if (leg.mode === 'bus' && liveData.buses?.schedules?.length > 0) {
                        const real = liveData.buses.schedules[0];
                        return {
                            ...leg,
                            routeNumber: real.operator,
                            label: real.busType,
                            isLive: true,
                            realDetails: real
                        };
                    }
                    return leg;
                });

                // Re-calculate totals if we injected live fares
                const totalFare = updatedLegs.reduce((sum, l) => sum + (l.fare || 0), 0);
                return { ...route, legs: updatedLegs, totalFare };
            });
        }
    } catch (liveErr) {
        console.warn('Failed to inject live data into routes:', liveErr);
    }

    // 3. Tag routes with recommendations
    if (routes.length > 0) {
        const fastest = routes.reduce((a, b) => a.totalDuration < b.totalDuration ? a : b);
        const cheapest = routes.reduce((a, b) => a.totalFare < b.totalFare ? a : b);

        if (!fastest.tags.includes('⚡ Fastest')) fastest.tags.push('⚡ Fastest');
        if (!cheapest.tags.includes('💰 Cheapest')) cheapest.tags.push('💰 Cheapest');

        const healthy = routes.find(r => r.modesPrimary.includes('foot-walking') || r.modesPrimary.includes('cycling-regular'));
        if (healthy && !healthy.tags.includes('💪 Healthiest')) healthy.tags.push('💪 Healthiest');
    }

    return routes;
}


async function fetchOrsRoute(srcLat, srcLng, dstLat, dstLng, profile) {
    try {
        const res = await fetch(`${ORS_BASE}/v2/directions/${profile}?api_key=${ORS_API_KEY}&start=${srcLng},${srcLat}&end=${dstLng},${dstLat}`);

        if (!res.ok) throw new Error(`ORS Directions ${res.status}`);

        const data = await res.json();
        const feature = data.features?.[0];
        if (!feature) return null;

        const summary = feature.properties.summary;
        const distKm = Math.round((summary.distance / 1000) * 10) / 10;
        const durationMin = Math.round(summary.duration / 60);

        // Get route geometry as waypoints
        const coords = feature.geometry.coordinates.map(c => [c[1], c[0]]); // [lng, lat] → [lat, lng]

        // Compute fare
        const cfg = TRANSPORT_CONFIG[profile] || TRANSPORT_CONFIG['driving-car'];
        const fare = Math.round(cfg.basefare + cfg.farePerKm * distKm);

        // Build a single-leg route
        const leg = {
            id: `leg-${profile}`,
            mode: profile === 'foot-walking' ? 'walk' : profile === 'cycling-regular' ? 'cycle' : 'drive',
            from: { id: 'src', name: 'Origin', lat: srcLat, lng: srcLng },
            to: { id: 'dst', name: 'Destination', lat: dstLat, lng: dstLng },
            distanceKm: distKm,
            distanceM: Math.round(summary.distance),
            durationMin,
            fare,
            routeNumber: cfg.label,
            departures: generateDepartures(2, profile === 'foot-walking' ? 0 : 10),
            frequency: profile === 'foot-walking' ? 0 : 10,
            crowdDensity: getCrowdDensity('route', profile),
            delay: null,
            color: cfg.color,
            icon: cfg.icon,
            label: cfg.label,
            platform: null,
            waypoints: coords, // Real route geometry from ORS!
        };

        // Extract step-by-step instructions if available
        const steps = feature.properties.segments?.[0]?.steps || [];
        leg.steps = steps.map(s => ({
            instruction: s.instruction,
            distance: s.distance,
            duration: s.duration,
            name: s.name || '',
        }));

        return {
            id: `route-${profile}`,
            name: cfg.label,
            legs: [leg],
            totalDuration: durationMin,
            totalFare: fare,
            totalWalkM: profile === 'foot-walking' ? Math.round(summary.distance) : 0,
            modesPrimary: [profile],
            tags: [],
        };
    } catch (err) {
        console.warn(`ORS route ${profile} failed:`, err.message);
        return null;
    }
}

// ─── Departures Generator ────────────────────────────────────────────────────

function generateDepartures(baseMinute, frequency, count = 5) {
    if (frequency === 0) return [];
    const now = new Date();
    const departures = [];
    for (let i = 0; i < count; i++) {
        const dep = new Date(now);
        dep.setMinutes(now.getMinutes() + baseMinute + i * frequency);
        dep.setSeconds(0);
        departures.push(dep);
    }
    return departures;
}

// ─── Mock Fallback (Original Logic) ──────────────────────────────────────────

function findNearestStop(lat, lng, type = null) {
    const pool = type ? ALL_STOPS.filter(s => s.type === type) : ALL_STOPS;
    let nearest = pool[0], minDist = Infinity;
    for (const stop of pool) {
        const d = haversine(lat, lng, stop.lat, stop.lng);
        if (d < minDist) { minDist = d; nearest = stop; }
    }
    return { stop: nearest, distance: minDist };
}

function computeDuration(distKm, mode) {
    const speed = TRANSPORT_CONFIG[mode]?.speedKmh || 20;
    return Math.round((distKm / speed) * 60);
}

function computeFare(distKm, mode) {
    const cfg = TRANSPORT_CONFIG[mode];
    if (!cfg) return 0;
    return Math.round(cfg.basefare + cfg.farePerKm * distKm);
}

function buildLeg(from, to, mode, legIndex) {
    const dist = haversine(from.lat, from.lng, to.lat, to.lng);
    const trafficMult = mode === 'bus' ? getTrafficMultiplier() : 1.0;
    const duration = Math.round(computeDuration(dist, mode) * trafficMult);
    const fare = computeFare(dist, mode);
    const frequency = mode === 'train' ? 8 : mode === 'bus' ? 12 : 30;
    const departures = generateDepartures(legIndex * 3 + 2, frequency);
    const crowdDensity = mode === 'bus' ? getCrowdDensity(to.id, mode) : null;
    const delay = mode === 'train' ? getTrainDelay(from.id) : null;
    const routeNumber = mode === 'bus' ? (from.routes?.[0] || '101') : mode === 'train' ? (from.lines?.[0] || 'Central') : 'Shuttle';

    return {
        id: `leg-${legIndex}`,
        mode,
        from: { id: from.id, name: from.name, lat: from.lat, lng: from.lng },
        to: { id: to.id, name: to.name, lat: to.lat, lng: to.lng },
        distanceKm: Math.round(dist * 10) / 10,
        distanceM: Math.round(dist * 1000),
        durationMin: duration,
        fare,
        routeNumber,
        departures,
        frequency,
        crowdDensity,
        delay,
        color: TRANSPORT_CONFIG[mode]?.color || '#6B7280',
        icon: TRANSPORT_CONFIG[mode]?.icon || 'Circle',
        label: TRANSPORT_CONFIG[mode]?.label || mode,
        platform: mode === 'train' ? (legIndex % 2 === 0 ? '1' : '2') : null,
        waypoints: [
            [from.lat, from.lng],
            [(from.lat + to.lat) / 2 + (Math.random() - 0.5) * 0.005, (from.lng + to.lng) / 2 + (Math.random() - 0.5) * 0.005],
            [to.lat, to.lng]
        ]
    };
}

async function generateRouteFallback(sourceLat, sourceLng, destLat, destLng, modes = ['train', 'bus', 'airport'], sourceName = null, destName = null) {
    const routes = [];
    const sLabel = sourceName || 'Your Location';
    const dLabel = destName || 'Destination';

    for (const mode of modes.filter(m => m !== 'walk')) {
        const pickupType = mode === 'airport' ? 'airport' : mode;
        const srcStop = findNearestStop(sourceLat, sourceLng, pickupType);
        const dstStop = findNearestStop(destLat, destLng, pickupType);

        const legs = [];

        // Proximity Rule: Only use hardcoded stations if they are actually NEAR the search (within 50km)
        // Otherwise, assume we are in a new city and create virtual legs from current location
        if (srcStop.distance > 50 || srcStop.stop.id === dstStop.stop.id) {
            // Direct Virtual Leg + Simulated Walk Buffer (to avoid 0m walk look)
            const walkBuffer = 0.8; // 800m simulated walk to station/bus stand
            legs.push(buildLeg(
                { id: 'src', name: sLabel, lat: sourceLat, lng: sourceLng },
                { id: 'walk-buffer', name: `${pickupType.charAt(0).toUpperCase() + pickupType.slice(1)} Stand`, lat: sourceLat + 0.005, lng: sourceLng + 0.005 },
                'walk',
                0
            ));
            legs.push(buildLeg(
                { id: 'walk-buffer', name: `${pickupType.charAt(0).toUpperCase() + pickupType.slice(1)} Stand`, lat: sourceLat + 0.005, lng: sourceLng + 0.005 },
                { id: 'dst', name: dLabel, lat: destLat, lng: destLng },
                mode,
                1
            ));
        } else {
            if (srcStop.distance > 0.1) {
                legs.push(buildLeg({ id: 'src', name: sLabel, lat: sourceLat, lng: sourceLng }, srcStop.stop, 'walk', 0));
            }
            legs.push(buildLeg(srcStop.stop, dstStop.stop, mode, 1));
            const destDist = haversine(dstStop.stop.lat, dstStop.stop.lng, destLat, destLng);
            if (destDist > 0.1) {
                legs.push(buildLeg(dstStop.stop, { id: 'dst', name: dLabel, lat: destLat, lng: destLng }, 'walk', 2));
            }
        }

        const totalDuration = legs.reduce((s, l) => s + l.durationMin, 0);
        const totalFare = legs.reduce((s, l) => s + l.fare, 0);
        const totalWalk = legs.filter(l => l.mode === 'walk').reduce((s, l) => s + l.distanceM, 0);

        routes.push({
            id: `route-${mode}-direct`,
            name: `${TRANSPORT_CONFIG[mode].label} Direct`,
            legs,
            totalDuration,
            totalFare,
            totalWalkM: totalWalk,
            modesPrimary: [mode],
            tags: []
        });
    }

    // Multi-modal fallback
    if (modes.includes('train') && modes.includes('bus')) {
        const srcTrain = findNearestStop(sourceLat, sourceLng, 'train');
        const midBus = findNearestStop(destLat, destLng, 'bus');
        const dstFinal = { id: 'dst', name: dLabel, lat: destLat, lng: destLng };

        // ONLY suggest multimodal if stations are within reasonable distance (Proximity Gate)
        if (srcTrain.stop.id !== midBus.stop.id && srcTrain.distance < 50 && midBus.distance < 50) {
            const legs = [];
            if (srcTrain.distance > 0.1) {
                legs.push(buildLeg({ id: 'src', name: sLabel, lat: sourceLat, lng: sourceLng }, srcTrain.stop, 'walk', 0));
            }
            legs.push(buildLeg(srcTrain.stop, STATIONS.trains.find(s => s.id === 'DR') || STATIONS.trains[1], 'train', 1));
            const dadarBus = findNearestStop(19.0180, 72.8450, 'bus');
            legs.push(buildLeg(STATIONS.trains.find(s => s.id === 'DR') || STATIONS.trains[1], dadarBus.stop, 'walk', 2));
            legs.push(buildLeg(dadarBus.stop, midBus.stop, 'bus', 3));
            const lastDist = haversine(midBus.stop.lat, midBus.stop.lng, destLat, destLng);
            if (lastDist > 0.1) {
                legs.push(buildLeg(midBus.stop, dstFinal, 'walk', 4));
            }

            const totalDuration = legs.reduce((s, l) => s + l.durationMin, 0);
            const totalFare = legs.reduce((s, l) => s + l.fare, 0);
            const totalWalk = legs.filter(l => l.mode === 'walk').reduce((s, l) => s + l.distanceM, 0);

            routes.push({
                id: 'route-multimodal',
                name: 'Train + Bus',
                legs,
                totalDuration,
                totalFare,
                totalWalkM: totalWalk,
                modesPrimary: ['train', 'bus'],
                tags: []
            });
        }
    }

    if (routes.length > 0) {
        const fastest = routes.reduce((a, b) => a.totalDuration < b.totalDuration ? a : b);
        const cheapest = routes.reduce((a, b) => a.totalFare < b.totalFare ? a : b);
        const leastWalk = routes.reduce((a, b) => a.totalWalkM < b.totalWalkM ? a : b);
        fastest.tags.push('⚡ Fastest');
        cheapest.tags.push('💰 Cheapest');
        leastWalk.tags.push('🦶 Least Walking');
    }

    return routes;
}

// ─── QR Ticket Generator ────────────────────────────────────────────────────

function generateTicketData(route) {
    const ticketId = `J360-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = new Date();
    return {
        ticketId,
        issuedAt: now.toISOString(),
        validUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        routeName: route.name,
        totalFare: route.totalFare,
        legs: route.legs.map(l => ({
            mode: l.label,
            from: l.from.name,
            to: l.to.name,
            routeNumber: l.routeNumber
        })),
        qrPayload: JSON.stringify({
            id: ticketId,
            route: route.id,
            fare: route.totalFare,
            ts: now.getTime()
        }),
        status: 'ACTIVE'
    };
}

// ─── Downloadable Itinerary ──────────────────────────────────────────────────

function generateItinerarySummary(route, source, destination) {
    const now = new Date();
    let text = '';
    text += '═══════════════════════════════════════════\n';
    text += '          JOURNEY360 — TRAVEL ITINERARY     \n';
    text += '═══════════════════════════════════════════\n\n';
    text += `📅 Date: ${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    text += `🕐 Generated: ${now.toLocaleTimeString('en-IN')}\n\n`;
    text += `📍 From: ${source}\n`;
    text += `📍 To:   ${destination}\n`;
    text += `🛤️  Route: ${route.name}\n`;
    text += `⏱️  Total Duration: ${route.totalDuration} min\n`;
    text += `💰 Total Fare: ₹${route.totalFare}\n`;
    text += `🚶 Walking Distance: ${route.totalWalkM}m\n`;
    if (route.tags.length) text += `🏷️  Tags: ${route.tags.join(', ')}\n`;
    text += '\n───────────────────────────────────────────\n';
    text += '  STEP-BY-STEP DIRECTIONS\n';
    text += '───────────────────────────────────────────\n\n';

    route.legs.forEach((leg, i) => {
        const icon = leg.mode === 'walk' ? '🚶' : leg.mode === 'train' ? '🚂' : leg.mode === 'bus' ? '🚌' : leg.mode === 'drive' ? '🚗' : leg.mode === 'cycle' ? '🚴' : '✈️';
        text += `  Step ${i + 1}: ${icon} ${leg.label}\n`;
        text += `  ├─ From: ${leg.from.name}\n`;
        text += `  ├─ To:   ${leg.to.name}\n`;
        text += `  ├─ Distance: ${leg.distanceKm} km (${leg.distanceM}m)\n`;
        text += `  ├─ Duration: ${leg.durationMin} min\n`;
        if (leg.fare > 0) text += `  ├─ Fare: ₹${leg.fare}\n`;
        if (leg.routeNumber && leg.mode !== 'walk') text += `  ├─ Route/Line: ${leg.routeNumber}\n`;
        if (leg.platform) text += `  ├─ Platform: ${leg.platform}\n`;
        if (leg.crowdDensity) text += `  ├─ Crowd: ${leg.crowdDensity}\n`;
        if (leg.delay?.delayed) text += `  ├─ ⚠️ Delay: +${leg.delay.minutes} min (${leg.delay.reason})\n`;

        // Include turn-by-turn directions if available (from ORS)
        if (leg.steps && leg.steps.length > 0) {
            text += `  ├─ Directions:\n`;
            leg.steps.forEach((step, j) => {
                text += `  │   ${j + 1}. ${step.instruction} (${Math.round(step.distance)}m)\n`;
            });
        }

        text += `  └─────────────────────────\n\n`;
    });

    text += '───────────────────────────────────────────\n';
    text += `  ✅ Have a safe journey!\n`;
    text += '  🌐 Powered by Journey360\n';
    text += '═══════════════════════════════════════════\n';

    return text;
}

function downloadItinerary(route, source, destination) {
    const text = generateItinerarySummary(route, source, destination);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Journey360_Itinerary_${route.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ─── Live Schedule API Functions ─────────────────────────────────────────────

async function fetchTrainSchedules(origin, destination, date = null) {
    try {
        const params = new URLSearchParams({ origin, destination });
        if (date) params.append('date', date);
        const res = await fetch(`${BACKEND_URL}/api/transport/trains?${params}`);
        if (!res.ok) throw new Error(`Train API ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('Train schedule fetch failed:', err.message);
        return { source: 'error', schedules: [], count: 0, error: err.message };
    }
}

async function fetchFlightSchedules(origin, destination, date = null) {
    try {
        const params = new URLSearchParams({ origin, destination });
        if (date) params.append('date', date);
        const res = await fetch(`${BACKEND_URL}/api/transport/flights?${params}`);
        if (!res.ok) throw new Error(`Flight API ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('Flight schedule fetch failed:', err.message);
        return { source: 'error', schedules: [], count: 0, error: err.message };
    }
}

async function fetchBusSchedules(origin, destination, date = null) {
    try {
        const params = new URLSearchParams({ origin, destination });
        if (date) params.append('date', date);
        const res = await fetch(`${BACKEND_URL}/api/transport/buses?${params}`);
        if (!res.ok) throw new Error(`Bus API ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('Bus schedule fetch failed:', err.message);
        return { source: 'error', schedules: [], count: 0, error: err.message };
    }
}

async function fetchAllSchedules(origin, destination, date = null) {
    try {
        const params = new URLSearchParams({ origin, destination });
        if (date) params.append('date', date);
        const res = await fetch(`${BACKEND_URL}/api/transport/search?${params}`);
        if (!res.ok) throw new Error(`Transport search API ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('All schedules fetch failed:', err.message);
        // Fallback: fetch individually
        const [trains, flights, buses] = await Promise.allSettled([
            fetchTrainSchedules(origin, destination, date),
            fetchFlightSchedules(origin, destination, date),
            fetchBusSchedules(origin, destination, date),
        ]);
        return {
            trains: trains.status === 'fulfilled' ? trains.value : { schedules: [], count: 0 },
            flights: flights.status === 'fulfilled' ? flights.value : { schedules: [], count: 0 },
            buses: buses.status === 'fulfilled' ? buses.value : { schedules: [], count: 0 },
        };
    }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const transportService = {
    // Core (now async with API)
    searchPlaces,           // NEW: async geocode search
    searchStops: searchStopsFallback,  // Legacy sync fallback
    generateRoute,          // NOW ASYNC: returns Promise<routes[]>

    // Data
    STATIONS,
    ALL_STOPS,
    TRANSPORT_CONFIG,

    // Smart Features
    getCrowdDensity,
    getTrafficLevel,
    getTrafficMultiplier,
    getTrainDelay,
    getAirportReminder,
    findNearestStop,

    // Tickets & Itinerary
    generateTicketData,
    generateItinerarySummary,
    downloadItinerary,

    // Live Schedule APIs
    fetchTrainSchedules,
    fetchFlightSchedules,
    fetchBusSchedules,
    fetchAllSchedules,

    // Util
    hasApiKey: () => !!ORS_API_KEY,
};

