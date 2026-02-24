import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Custom Icons ────────────────────────────────────────────────────────────

function createTransportIcon(emoji, color) {
    return L.divIcon({
        className: 'custom-transport-icon',
        html: `<div style="
      width: 36px; height: 36px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
      box-shadow: 0 3px 12px rgba(0,0,0,0.3);
      position: relative;
      top: -18px; left: -18px;
    ">${emoji}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });
}

function createEndpointIcon(color, label) {
    return L.divIcon({
        className: 'custom-endpoint-icon',
        html: `<div style="
      width: 14px; height: 14px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      position: relative;
      top: -7px; left: -7px;
    "></div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });
}

function createUserLocationIcon() {
    return L.divIcon({
        className: 'user-location-icon',
        html: `<div style="
      width: 18px; height: 18px;
      background: #3B82F6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 6px rgba(59,130,246,0.25), 0 2px 8px rgba(0,0,0,0.3);
      position: relative;
      top: -9px; left: -9px;
      animation: pulse-ring 2s ease-out infinite;
    "></div>
    <style>
    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 6px rgba(59,130,246,0.25), 0 2px 8px rgba(0,0,0,0.3); }
      50% { box-shadow: 0 0 0 12px rgba(59,130,246,0.1), 0 2px 8px rgba(0,0,0,0.3); }
      100% { box-shadow: 0 0 0 6px rgba(59,130,246,0.25), 0 2px 8px rgba(0,0,0,0.3); }
    }
    </style>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });
}

const modeEmoji = {
    walk: '🚶',
    train: '🚂',
    bus: '🚌',
    airport: '✈️',
    drive: '🚗',
    cycle: '🚴',
};

// ─── Map Auto-Fit Component ──────────────────────────────────────────────────

function FitBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
    }, [bounds, map]);
    return null;
}

// ─── Center on location ──────────────────────────────────────────────────────

function CenterOnLocation({ location }) {
    const map = useMap();
    const hasCentered = useRef(false);
    useEffect(() => {
        if (location && !hasCentered.current) {
            map.setView([location.lat, location.lng], 13, { animate: true });
            hasCentered.current = true;
        }
    }, [location, map]);
    return null;
}

// ─── Highlighted Leg Component ───────────────────────────────────────────────

function HighlightedLeg({ leg }) {
    const map = useMap();
    useEffect(() => {
        if (leg && leg.waypoints) {
            map.fitBounds(leg.waypoints, { padding: [60, 60], maxZoom: 16 });
        }
    }, [leg, map]);
    return null;
}

// ─── Main Map Component ─────────────────────────────────────────────────────

const TransportMapView = ({ route, highlightedLeg, userLocation, className = '' }) => {
    const defaultCenter = userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629]; // India center
    const defaultZoom = userLocation ? 13 : 5;

    // Compute bounds from all route legs
    const bounds = useMemo(() => {
        if (!route?.legs?.length) return null;
        const allPoints = [];
        route.legs.forEach(leg => {
            if (leg.waypoints) {
                leg.waypoints.forEach(wp => allPoints.push(wp));
            }
            allPoints.push([leg.from.lat, leg.from.lng]);
            allPoints.push([leg.to.lat, leg.to.lng]);
        });
        return allPoints.length > 0 ? allPoints : null;
    }, [route]);

    // Collect unique transfer/stop markers
    const markers = useMemo(() => {
        if (!route?.legs?.length) return [];
        const seen = new Set();
        const result = [];

        route.legs.forEach((leg, i) => {
            // From marker
            if (!seen.has(leg.from.id)) {
                seen.add(leg.from.id);
                result.push({
                    id: leg.from.id,
                    position: [leg.from.lat, leg.from.lng],
                    name: leg.from.name,
                    mode: leg.mode,
                    color: leg.color,
                    isStart: i === 0,
                    isEnd: false,
                });
            }
            // To marker of last leg
            if (i === route.legs.length - 1 && !seen.has(leg.to.id)) {
                seen.add(leg.to.id);
                result.push({
                    id: leg.to.id,
                    position: [leg.to.lat, leg.to.lng],
                    name: leg.to.name,
                    mode: leg.mode,
                    color: leg.color,
                    isStart: false,
                    isEnd: true,
                });
            } else if (!seen.has(leg.to.id)) {
                seen.add(leg.to.id);
                result.push({
                    id: leg.to.id,
                    position: [leg.to.lat, leg.to.lng],
                    name: leg.to.name,
                    mode: leg.mode,
                    color: leg.color,
                    isStart: false,
                    isEnd: false,
                });
            }
        });

        return result;
    }, [route]);

    return (
        <div className={`relative rounded-2xl overflow-hidden ${className}`} style={{ minHeight: '400px' }}>
            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                style={{ width: '100%', height: '100%', minHeight: '400px' }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />

                {/* Attribution in corner */}
                <div className="leaflet-bottom leaflet-right">
                    <div className="leaflet-control" style={{ fontSize: '9px', padding: '2px 5px', background: 'rgba(255,255,255,0.7)', borderRadius: '3px' }}>
                        © CARTO · OpenStreetMap
                    </div>
                </div>

                {/* User Location Marker */}
                {userLocation && (
                    <>
                        <Circle
                            center={[userLocation.lat, userLocation.lng]}
                            radius={200}
                            pathOptions={{
                                color: '#3B82F6',
                                fillColor: '#3B82F6',
                                fillOpacity: 0.08,
                                weight: 1,
                                opacity: 0.3,
                            }}
                        />
                        <Marker
                            position={[userLocation.lat, userLocation.lng]}
                            icon={createUserLocationIcon()}
                        >
                            <Popup>
                                <div style={{ fontFamily: 'system-ui', fontSize: '13px' }}>
                                    <strong>📍 Your Location</strong>
                                </div>
                            </Popup>
                        </Marker>
                    </>
                )}

                {/* Center on user location when available */}
                {userLocation && !route && <CenterOnLocation location={userLocation} />}

                {/* Route Polylines */}
                {route?.legs?.map((leg) => (
                    <Polyline
                        key={leg.id}
                        positions={leg.waypoints || [[leg.from.lat, leg.from.lng], [leg.to.lat, leg.to.lng]]}
                        pathOptions={{
                            color: leg.color,
                            weight: highlightedLeg?.id === leg.id ? 7 : 4,
                            opacity: highlightedLeg && highlightedLeg.id !== leg.id ? 0.3 : 0.85,
                            dashArray: leg.mode === 'walk' ? '8, 12' : null,
                            lineCap: 'round',
                            lineJoin: 'round',
                        }}
                    />
                ))}

                {/* Markers */}
                {markers.map((marker) => {
                    let icon;
                    if (marker.isStart) {
                        icon = createEndpointIcon('#10B981', 'Start');
                    } else if (marker.isEnd) {
                        icon = createEndpointIcon('#EF4444', 'End');
                    } else {
                        icon = createTransportIcon(modeEmoji[marker.mode] || '📍', marker.color);
                    }

                    return (
                        <Marker key={marker.id} position={marker.position} icon={icon}>
                            <Popup>
                                <div style={{ fontFamily: 'system-ui', fontSize: '13px' }}>
                                    <strong>{marker.name}</strong>
                                    {marker.isStart && <div style={{ color: '#10B981', fontWeight: 600 }}>Start</div>}
                                    {marker.isEnd && <div style={{ color: '#EF4444', fontWeight: 600 }}>Destination</div>}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Auto-fit bounds */}
                {bounds && <FitBounds bounds={bounds} />}

                {/* Highlight selected leg */}
                {highlightedLeg && <HighlightedLeg leg={highlightedLeg} />}
            </MapContainer>

            {/* Map Overlay — Route info */}
            {route && (
                <div className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg border border-gray-200/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                        {route.legs.filter(l => l.mode !== 'walk').map((leg, i) => (
                            <div key={i} className="flex items-center gap-1">
                                <span className="text-sm">{modeEmoji[leg.mode]}</span>
                                {i < route.legs.filter(l => l.mode !== 'walk').length - 1 && (
                                    <span className="text-gray-300 dark:text-gray-600 mx-1">→</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {route.totalDuration} min · ₹{route.totalFare}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!route && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
                    <div className="text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl px-8 py-6 shadow-lg">
                        <p className="text-3xl mb-2">🗺️</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select a route</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Routes will appear on the map</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransportMapView;
