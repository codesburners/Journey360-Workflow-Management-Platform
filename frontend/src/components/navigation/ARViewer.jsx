import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, Navigation, Compass, MapPin, AlertCircle, Radio } from 'lucide-react';

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImMxNDEzYzM1ZjFkNzQzODRhYzBlYzJjMGZhMTVmODJhIiwiaCI6Im11cm11cjY0In0=";
const WAYPOINT_THRESHOLD = 15; // meters
const ROUTE_RECALC_THRESHOLD = 100; // meters — recalculate route if user drifts this far
const LERP_FACTOR = 0.15; // smoothing factor for arrow rotation (higher = more responsive, lower = smoother)
const TURN_THRESHOLD = 40; // degrees — ignore tiny direction changes to prevent left/right oscillation

const ARViewer = ({ destination, onClose, isEmbedded = false }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [info, setInfo] = useState("Initializing navigation...");
  const [error, setError] = useState(null);
  const [distanceText, setDistanceText] = useState("");
  const [totalDistText, setTotalDistText] = useState("");
  const [turnDirection, setTurnDirection] = useState("STRAIGHT");
  const [bearingToTarget, setBearingToTarget] = useState(0); // angle for 2D arrow rotation
  const [isSimulation, setIsSimulation] = useState(isEmbedded);
  const [cameraActive, setCameraActive] = useState(false); // Track if camera feed is active

  // GPS smoothing buffer — average last N readings to reduce jitter  
  const gpsBufferRef = useRef([]);
  const [compassCalibrated, setCompassCalibrated] = useState(false);
  const [sensorStatus, setSensorStatus] = useState({
    gps: 'waiting', // waiting, poor, good
    compass: 'waiting', // waiting, absolute, relative
    accuracy: null
  });

  // State for logic refs to avoid re-renders during animation
  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    arrow: null,
    directionLine: null,
    userLat: null,
    userLng: null,
    prevLat: null,    // previous GPS position for movement heading
    prevLng: null,
    gpsHeading: null, // heading derived from GPS movement
    gpsSpeed: 0,      // speed in m/s from GPS
    phoneHeading: 0,
    fusedHeading: 0,  // blended compass + GPS heading
    phonePitch: 0,    // device tilt forward/back (beta)
    phoneRoll: 0,     // device tilt left/right (gamma)
    smoothedYaw: 0,   // lerp-smoothed arrow yaw
    smoothedPitch: 0, // lerp-smoothed arrow pitch
    routePoints: [],
    currentIndex: 0,
    animationId: null,
    watchId: null,
    lastRouteLat: null,  // position where route was last fetched
    lastRouteLng: null,
    hasAbsoluteOrientation: false, // true if we have a real compass
    simIntervalId: null,
    lastGpsTime: 0,
    gpsAccuracy: null,
  });

  useEffect(() => {
    const init = async () => {
      try {
        await startCamera();
        initThree();
        setupGeolocation();
        // setupCompass(); // Move this to be triggered by user gesture
        animate();
      } catch (err) {
        console.error("AR Initialization Error:", err);
        setError(err.message || "Failed to start AR");
      }
    };

    init();

    return () => {
      // Cleanup
      if (stateRef.current.animationId) cancelAnimationFrame(stateRef.current.animationId);
      if (stateRef.current.watchId) navigator.geolocation.clearWatch(stateRef.current.watchId);
      if (stateRef.current.simIntervalId) clearInterval(stateRef.current.simIntervalId);
      if (stateRef.current.renderer) {
        stateRef.current.renderer.dispose();
        if (containerRef.current) containerRef.current.removeChild(stateRef.current.renderer.domElement);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleAbsoluteOrientation);
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Run ONLY once on mount

  // Handle Destination Updates without re-mounting
  useEffect(() => {
    if (!stateRef.current.scene) return;

    setInfo(`Updating route to ${destination.name}...`);

    // Refresh route
    if (stateRef.current.userLat) {
      getRoute(stateRef.current.userLat, stateRef.current.userLng)
        .then(points => {
          stateRef.current.routePoints = points;
          stateRef.current.currentIndex = 0;
          setInfo(`Ready for ${destination.name}`);
        });
    }
  }, [destination.lat, destination.lng, destination.name]);

  const startCamera = async () => {
    try {
      // Check if we're on a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        console.warn("Not a secure context — camera requires HTTPS.");
        setCameraActive(false);
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("getUserMedia not supported — camera unavailable.");
        setCameraActive(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => { });
        setCameraActive(true);
      }
    } catch (err) {
      console.warn("Camera access failed:", err.message);
      setCameraActive(false);
      // Don't throw — we'll use a fallback background instead of a black screen
    }
  };

  const setupGeolocation = () => {
    if (isEmbedded) {
      setIsSimulation(true);
      // Try to watch real location even in embedded mode (laptop)
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          stateRef.current.userLat = latitude;
          stateRef.current.userLng = longitude;
          stateRef.current.gpsAccuracy = accuracy;

          setIsSimulation(false); // We have real GPS!
          setInfo("Laptop GPS Active");

          // Only fetch route once or if we move significantly
          if (stateRef.current.routePoints.length === 0) {
            getRoute(latitude, longitude).then(points => {
              stateRef.current.routePoints = points;
              stateRef.current.currentIndex = 0;
            }).catch(() => { });
          }
        },
        () => {
          // Fallback to simulation if denied or fails
          if (stateRef.current.userLat === null) {
            const mockLat = destination.lat - 0.0005;
            const mockLng = destination.lng - 0.0005;
            stateRef.current.userLat = mockLat;
            stateRef.current.userLng = mockLng;
            getRoute(mockLat, mockLng).then(points => {
              stateRef.current.routePoints = points;
              setInfo("Simulation — Demo Route");
            }).catch(e => {
              stateRef.current.routePoints = [[mockLng, mockLat], [destination.lng, destination.lat]];
              setInfo("Simulation — Straight Line");
            });
          }
        },
        { enableHighAccuracy: true, maximumAge: 1000 }
      );

      stateRef.current.watchId = watchId;

      // Simulation Movement: Slow auto-rotate + slow walk towards target
      let heading = 0;
      stateRef.current.simIntervalId = setInterval(() => {
        if (!isSimulation) return; // Stop if real GPS took over

        heading = (heading + 0.5) % 360;
        stateRef.current.phoneHeading = heading;
        stateRef.current.phonePitch = 45 + Math.sin(Date.now() * 0.001) * 5;

        // "Walk" effect: every few seconds, move slightly closer to destination
        if (Date.now() % 5000 < 50) {
          stateRef.current.userLat += (destination.lat - stateRef.current.userLat) * 0.01;
          stateRef.current.userLng += (destination.lng - stateRef.current.userLng) * 0.01;
        }
      }, 50);

      return;
    }

    // --- LIVE MODE: Real GPS ---
    setIsSimulation(false);
    stateRef.current.watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed, heading: gpsHeading, accuracy } = pos.coords;
        stateRef.current.gpsAccuracy = accuracy;

        // Update sensor status UI
        setSensorStatus(prev => ({
          ...prev,
          gps: accuracy < 20 ? 'good' : 'poor',
          accuracy: Math.round(accuracy)
        }));

        // GPS Smoothing: average last 5 readings to reduce jitter
        const buf = gpsBufferRef.current;
        buf.push({ lat: latitude, lng: longitude });
        if (buf.length > 5) buf.shift();

        const avgLat = buf.reduce((s, p) => s + p.lat, 0) / buf.length;
        const avgLng = buf.reduce((s, p) => s + p.lng, 0) / buf.length;

        // GPS Movement Heading: compute heading from previous position
        const state = stateRef.current;
        if (state.prevLat !== null) {
          const d = distance(state.prevLat, state.prevLng, avgLat, avgLng);
          const elapsed = (Date.now() - state.lastGpsTime) / 1000;
          state.gpsSpeed = elapsed > 0 ? d / elapsed : 0;

          // Only use GPS heading when actually moving (>0.5 m/s ~ slow walk)
          if (d > 1 && state.gpsSpeed > 0.5) {
            state.gpsHeading = bearing(state.prevLat, state.prevLng, avgLat, avgLng);
          }
        }

        // Fusion v3: Priority Matrix
        // 1. If GPS is accurate (<10m) and speed > 1m/s, trust GPS + Compass Blend
        // 2. If Compass is absolute, trust Compass heavily
        // 3. If everything is low quality, use best guess from alpha

        const gpsWeight = (state.gpsSpeed > 1.2 && state.gpsAccuracy < 15) ? 0.6 : 0;
        let currentHeading;

        if (gpsWeight > 0 && state.gpsHeading !== null) {
          // Blended heading
          currentHeading = (state.gpsHeading * gpsWeight + state.phoneHeading * (1 - gpsWeight) + 360) % 360;
        } else {
          currentHeading = state.phoneHeading;
        }

        // Apply smoothing to the fused heading
        state.fusedHeading = lerpAngle(toRad(state.fusedHeading), toRad(currentHeading), 0.1) * 180 / Math.PI;

        state.prevLat = avgLat;
        state.prevLng = avgLng;
        state.lastGpsTime = Date.now();
        state.userLat = avgLat;
        state.userLng = avgLng;

        // Route Snapping: snap to nearest route point for stable navigation
        if (state.routePoints.length > 2) {
          let minDist = Infinity;
          let bestIdx = state.currentIndex;
          // Search from current index to a few ahead
          const searchEnd = Math.min(state.routePoints.length, state.currentIndex + 10);
          for (let i = state.currentIndex; i < searchEnd; i++) {
            const pt = state.routePoints[i];
            const ptDist = distance(avgLat, avgLng, pt[1], pt[0]);
            if (ptDist < minDist) {
              minDist = ptDist;
              bestIdx = i;
            }
          }
          // Advance to the nearest route point (+ 1 to look ahead)
          if (bestIdx > state.currentIndex && minDist < 30) {
            state.currentIndex = Math.min(bestIdx + 1, state.routePoints.length - 1);
          }
        }

        const needsRoute = state.routePoints.length === 0;
        const needsRecalc = state.lastRouteLat !== null &&
          distance(avgLat, avgLng, state.lastRouteLat, state.lastRouteLng) > ROUTE_RECALC_THRESHOLD;

        if (needsRoute || needsRecalc) {
          try {
            if (needsRecalc) setInfo("Recalculating route...");
            const points = await getRoute(latitude, longitude);
            stateRef.current.routePoints = points;
            stateRef.current.currentIndex = 0;
            stateRef.current.lastRouteLat = latitude;
            stateRef.current.lastRouteLng = longitude;
            setInfo("Route loaded. Follow the arrow.");
          } catch (err) {
            console.error("Route Fetch Error:", err);
            if (needsRoute) {
              // Fallback to straight line with explicit warning
              stateRef.current.routePoints = [
                [longitude, latitude],
                [destination.lng, destination.lat]
              ];
              stateRef.current.lastRouteLat = latitude;
              stateRef.current.lastRouteLng = longitude;
              setInfo("⚠ Straight-line mode (route API unavailable)");
            }
          }
        }
      },
      (err) => {
        setError("Please enable GPS for AR navigation.");
      },
      { enableHighAccuracy: true, maximumAge: 500, timeout: 10000 }
    );
  };

  // --- COMPASS: Android absolute orientation + iOS webkitCompassHeading ---
  const setupCompass = () => {
    if (isEmbedded) return; // simulation handles heading internally

    // Try to get absolute orientation (Android)
    window.addEventListener('deviceorientationabsolute', handleAbsoluteOrientation, true);

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }
  };

  const handleAbsoluteOrientation = (e) => {
    if (e.alpha !== null && (e.absolute === true || e.webkitCompassHeading !== undefined)) {
      const heading = e.webkitCompassHeading || (360 - e.alpha) % 360;
      stateRef.current.phoneHeading = heading;
      stateRef.current.hasAbsoluteOrientation = true;
      if (!compassCalibrated) setCompassCalibrated(true);
      setSensorStatus(prev => ({ ...prev, compass: 'absolute' }));
    }
    // Also read pitch/roll from this event
    if (e.beta !== null) stateRef.current.phonePitch = e.beta;
    if (e.gamma !== null) stateRef.current.phoneRoll = e.gamma;
  };

  const handleOrientation = (e) => {
    // Read pitch (beta) and roll (gamma) from all devices
    if (e.beta !== null) stateRef.current.phonePitch = e.beta;
    if (e.gamma !== null) stateRef.current.phoneRoll = e.gamma;

    if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
      stateRef.current.phoneHeading = e.webkitCompassHeading;
      stateRef.current.hasAbsoluteOrientation = true;
      if (!compassCalibrated) setCompassCalibrated(true);
      setSensorStatus(prev => ({ ...prev, compass: 'absolute' }));
    } else if (e.alpha !== null && !stateRef.current.hasAbsoluteOrientation) {
      stateRef.current.phoneHeading = (360 - e.alpha) % 360;
      setSensorStatus(prev => ({ ...prev, compass: 'relative' }));
    }
  };

  const getRoute = async (startLat, startLng) => {
    try {
      const res = await fetch(
        "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
        {
          method: "POST",
          headers: {
            "Authorization": ORS_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            coordinates: [
              [startLng, startLat],
              [destination.lng, destination.lat]
            ]
          })
        }
      );

      if (!res.ok) throw new Error("Failed to fetch route");
      const data = await res.json();
      return data.features[0].geometry.coordinates;
    } catch (err) {
      console.error("Route fetching error:", err);
      // Fallback straight line
      return [[startLng, startLat], [destination.lng, destination.lat]];
    }
  };

  const initThree = () => {
    const width = isEmbedded ? 375 : window.innerWidth;
    const height = isEmbedded ? 812 : window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    if (containerRef.current) containerRef.current.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(2, 5, 2);
    scene.add(directionalLight);

    // --- STYLIZED ARROW ---
    const arrowGroup = new THREE.Group();

    // Arrow Head
    const headGeo = new THREE.ConeGeometry(0.35, 0.7, 32);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x1e40af,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.rotation.x = Math.PI / 2;
    arrowGroup.add(head);

    // Arrow Body (Subtle Glow)
    const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.8
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.z = -0.4;
    body.rotation.x = Math.PI / 2;
    arrowGroup.add(body);

    arrowGroup.position.set(0, -0.6, -5);
    scene.add(arrowGroup);

    // --- ROUTE RIBBON (Dynamic segments) ---
    const ribbonGroup = new THREE.Group();
    scene.add(ribbonGroup);

    // --- TARGET MARKER ---
    const targetGeo = new THREE.TorusGeometry(0.5, 0.05, 16, 100);
    const targetMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x3b82f6,
      emissiveIntensity: 1.0
    });
    const targetMarker = new THREE.Mesh(targetGeo, targetMat);
    targetMarker.rotation.x = Math.PI / 2;
    targetMarker.visible = false;
    scene.add(targetMarker);

    stateRef.current.scene = scene;
    stateRef.current.camera = camera;
    stateRef.current.renderer = renderer;
    stateRef.current.arrow = arrowGroup;
    stateRef.current.targetMarker = targetMarker;
    stateRef.current.ribbonGroup = ribbonGroup;

    window.addEventListener('resize', handleResize);
  };

  const handleResize = () => {
    if (!stateRef.current.camera || !stateRef.current.renderer) return;

    const width = isEmbedded ? (containerRef.current?.clientWidth || 375) : window.innerWidth;
    const height = isEmbedded ? (containerRef.current?.clientHeight || 812) : window.innerHeight;

    stateRef.current.camera.aspect = width / height;
    stateRef.current.camera.updateProjectionMatrix();
    stateRef.current.renderer.setSize(width, height);
  };

  const toRad = d => d * Math.PI / 180;

  // Linear interpolation helper for smooth transitions
  const lerp = (current, target, factor) => current + (target - current) * factor;

  // Shortest-path angle lerp (handles 0/360 wraparound)
  const lerpAngle = (current, target, factor) => {
    let diff = target - current;
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    return current + diff * factor;
  };

  const bearing = (lat1, lon1, lat2, lon2) => {
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  };

  const distance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const animate = () => {
    stateRef.current.animationId = requestAnimationFrame(animate);
    const state = stateRef.current;
    const time = Date.now() * 0.001;

    if (state.routePoints.length && state.userLat !== null) {
      const next = state.routePoints[state.currentIndex];
      const d = distance(state.userLat, state.userLng, next[1], next[0]);

      if (d < WAYPOINT_THRESHOLD && state.currentIndex < state.routePoints.length - 1) {
        state.currentIndex++;
      }

      const b = bearing(state.userLat, state.userLng, next[1], next[0]);

      // Use fused heading (GPS + compass blend) for more stable direction
      let targetYawDiff = b - state.fusedHeading;
      if (targetYawDiff > 180) targetYawDiff -= 360;
      if (targetYawDiff < -180) targetYawDiff += 360;

      const targetYawRad = toRad(targetYawDiff);

      // Compute pitch offset: when phone is held upright (~90°), arrow should be level.
      // beta=90 means phone is vertical. We want the arrow to tilt down as the phone tilts up.
      const phonePitchNormalized = (state.phonePitch - 45) * 0.5; // center around ~45° holding angle
      const targetPitchRad = toRad(-phonePitchNormalized);

      // Smooth interpolation (lerp) to avoid jitter
      state.smoothedYaw = lerpAngle(state.smoothedYaw, targetYawRad, LERP_FACTOR);
      state.smoothedPitch = lerp(state.smoothedPitch, targetPitchRad, LERP_FACTOR);

      // --- Rotate and tilt arrow ---
      if (state.arrow) {
        state.arrow.rotation.y = state.smoothedYaw;
        state.arrow.rotation.x = state.smoothedPitch;
        // Subtle floating animation
        state.arrow.position.y = -0.6 + Math.sin(time * 2) * 0.05;

        // Scale arrow Z-depth based on distance to next waypoint
        const depthScale = Math.max(3, Math.min(8, d / 20));
        state.arrow.position.z = -depthScale;
      }

      // Update Route Ribbon (Visual path to next point)
      if (state.ribbonGroup) {
        state.ribbonGroup.clear();
        const ribbonGeo = new THREE.PlaneGeometry(0.4, 10);
        const ribbonMat = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          transparent: true,
          opacity: 0.3 + Math.sin(time * 3) * 0.1,
          side: THREE.DoubleSide
        });
        const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
        ribbon.rotation.x = Math.PI / 2;
        ribbon.rotation.z = state.smoothedYaw;
        ribbon.position.set(0, -1.2, -7);
        state.ribbonGroup.add(ribbon);
      }

      // Final Destination Marker
      if (state.targetMarker) {
        const totalDist = distance(state.userLat, state.userLng, destination.lat, destination.lng);
        if (totalDist < 50) {
          state.targetMarker.visible = true;
          const targetB = bearing(state.userLat, state.userLng, destination.lat, destination.lng);
          let targetDiff = targetB - state.phoneHeading;
          if (targetDiff > 180) targetDiff -= 360;
          if (targetDiff < -180) targetDiff += 360;

          const distScale = Math.min(10, totalDist / 5);
          state.targetMarker.position.set(
            Math.sin(toRad(targetDiff)) * distScale,
            -1,
            -Math.cos(toRad(targetDiff)) * distScale
          );
          state.targetMarker.scale.setScalar(1 + Math.sin(time * 5) * 0.1);
        } else {
          state.targetMarker.visible = false;
        }
      }

      const distStr = d > 1000 ? (d / 1000).toFixed(2) + " km" : Math.round(d) + " m";
      if (distStr !== distanceText) setDistanceText(distStr);

      // Calculate and show total distance to final destination
      const totalDist = distance(state.userLat, state.userLng, destination.lat, destination.lng);
      const totalStr = totalDist > 1000 ? (totalDist / 1000).toFixed(1) + " km" : Math.round(totalDist) + " m";
      setTotalDistText(totalStr);

      let turn = "STRAIGHT";
      if (targetYawDiff > TURN_THRESHOLD) turn = "RIGHT";
      if (targetYawDiff < -TURN_THRESHOLD) turn = "LEFT";
      if (turn !== turnDirection) setTurnDirection(turn);

      // Store raw yaw diff for smooth 2D arrow CSS rotation
      setBearingToTarget(targetYawDiff);
    }

    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  };

  // Expose setupCompass so it can be called from parent on user gesture
  ARViewer.setupCompass = setupCompass;

  return (
    <div className={`${isEmbedded ? 'absolute inset-0' : 'fixed inset-0 z-[9999]'} bg-black overflow-hidden select-none`}>
      {/* Fallback gradient background when camera is not available */}
      {!cameraActive && (
        <div className="absolute inset-0 z-[1]"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #0f172a 60%, #1e3a5f 100%)',
          }}
        >
          {/* Animated grid pattern for depth */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          {/* Subtle camera-off indicator */}
          {!isEmbedded && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[20] bg-amber-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/30 pointer-events-none">
              <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">Camera Unavailable — AR Overlay Mode</span>
            </div>
          )}
        </div>
      )}

      {/* Background Video Feed (only shown when camera is active) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${cameraActive ? 'opacity-80' : 'opacity-0'}`}
      />

      {/* Calibration Helper Overlay */}
      {sensorStatus.compass === 'relative' && cameraActive && !isEmbedded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="max-w-xs bg-slate-900/90 p-6 rounded-3xl border border-amber-500/50 text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw size={32} className="text-amber-500 animate-spin-slow" />
            </div>
            <h3 className="text-white font-black text-lg mb-2 uppercase tracking-tighter">Calibrating Compass</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Wave your phone in a <span className="text-amber-400 font-bold">figure-8 motion</span> or walk forward 5 meters to lock the direction.
            </p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full w-1/3 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Grid Overlay (only in embedded/simulation mode) */}
      {isSimulation && (
        <div className="absolute inset-0 z-[5] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* Main Overlay UI */}
      <div className="relative z-20 flex flex-col h-full pointer-events-none">

        {/* Top Header */}
        <div className={`${isEmbedded ? 'p-3' : 'p-6'} flex justify-between items-start`}>
          <div className={`bg-slate-900/80 backdrop-blur-xl ${isEmbedded ? 'p-2.5 rounded-2xl' : 'p-4 rounded-3xl'} border border-white/10 text-white shadow-2xl max-w-[85%]`}>
            <div className={`flex items-center ${isEmbedded ? 'gap-2' : 'gap-3'}`}>
              <div className={`${isEmbedded ? 'w-6 h-6' : 'w-8 h-8'} rounded-full ${isSimulation ? 'bg-amber-600' : 'bg-emerald-600'} flex items-center justify-center shrink-0`}>
                {isSimulation ? <Radio size={isEmbedded ? 10 : 16} className="text-white" /> : <Navigation size={isEmbedded ? 10 : 16} fill="white" />}
              </div>
              <div className="min-w-0">
                <h2 className={`font-bold ${isEmbedded ? 'text-xs' : 'text-lg'} leading-tight truncate`}>{destination.name}</h2>
                <div className={`flex items-center gap-1 ${isSimulation ? 'text-amber-400' : 'text-emerald-400'} ${isEmbedded ? 'text-[8px]' : 'text-[10px]'} font-bold uppercase tracking-wider`}>
                  <span className={`w-1 h-1 rounded-full ${isSimulation ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`}></span>
                  {isSimulation ? 'Simulation' : 'Live Navigation'}
                </div>
              </div>
            </div>
          </div>

          {!isEmbedded && (
            <div className="flex flex-col gap-2 scale-75 md:scale-100 origin-top-right">
              <button
                onClick={onClose}
                className="p-4 bg-white/10 hover:bg-white/20 active:scale-90 backdrop-blur-xl rounded-full text-white border border-white/10 transition-all pointer-events-auto shadow-2xl self-end"
              >
                <X size={24} />
              </button>

              {/* Sensor Accuracy Tags */}
              <div className="flex flex-col items-end gap-1.5 pointer-events-none">
                <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-2 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider ${sensorStatus.gps === 'good' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/20 border-amber-500/30 text-amber-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${sensorStatus.gps === 'good' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                  GPS: {sensorStatus.accuracy ? `${sensorStatus.accuracy}m` : 'Locating...'}
                </div>
                <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-2 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider ${sensorStatus.compass === 'absolute' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/20 border-amber-500/30 text-amber-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${sensorStatus.compass === 'absolute' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                  Compass: {sensorStatus.compass}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SIMULATION Badge */}
        {isSimulation && (
          <div className={`absolute ${isEmbedded ? 'top-12' : 'top-20'} left-1/2 -translate-x-1/2 z-30 pointer-events-none`}>
            <div className={`bg-amber-500/90 backdrop-blur-md text-white ${isEmbedded ? 'px-3 py-1 text-[8px] gap-1' : 'px-5 py-2 text-xs gap-2'} rounded-full font-black uppercase tracking-[0.15em] shadow-lg shadow-amber-500/30 border border-amber-400/50 flex items-center animate-pulse`}>
              <Radio size={isEmbedded ? 8 : 12} />
              SIMULATION
            </div>
          </div>
        )}

        {/* The 3D AR Layer (Arrows/Lines) */}
        <div ref={containerRef} className="absolute inset-0 z-10" />

        {/* 2D Direction Arrow — scales for embedded mode */}
        <div className="absolute inset-0 z-[15] flex items-center justify-center pointer-events-none">
          <div
            className="transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${bearingToTarget}deg)` }}
          >
            <svg width={isEmbedded ? '70' : '120'} height={isEmbedded ? '70' : '120'} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="58" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="2" />
              <path
                d="M60 15 L78 70 L60 58 L42 70 Z"
                fill="rgba(16, 185, 129, 0.85)"
                stroke="white"
                strokeWidth="2.5"
                strokeLinejoin="round"
                filter="url(#glow)"
              />
              <circle cx="60" cy="75" r="5" fill="rgba(255,255,255,0.6)" />
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.5" />
                </filter>
              </defs>
            </svg>
          </div>
        </div>

        {/* Bottom Navigation HUD */}
        <div className={`mt-auto ${isEmbedded ? 'p-2 pb-4' : 'p-6 pb-12'}`}>
          <div className={`${isSimulation ? 'bg-slate-900/80 border-amber-500/20' : 'bg-slate-900/90 border-white/10'} backdrop-blur-2xl ${isEmbedded ? 'p-3 rounded-2xl gap-3' : 'p-5 rounded-[32px] gap-5'} text-white shadow-[0_16px_48px_-8px_rgba(0,0,0,0.6)] border flex items-center pointer-events-auto`}>

            {/* Direction Icon */}
            <div className={`${isEmbedded ? 'w-11 h-11 rounded-xl text-xl' : 'w-16 h-16 rounded-2xl text-3xl'} ${isSimulation ? 'bg-amber-600 shadow-amber-500/30' : 'bg-emerald-600 shadow-emerald-500/30'} flex items-center justify-center shadow-lg transition-all duration-500 shrink-0 ${turnDirection !== 'STRAIGHT' ? 'scale-105' : ''}`}>
              {turnDirection === 'LEFT' ? '⬅️' : turnDirection === 'RIGHT' ? '➡️' : '⬆️'}
            </div>

            {/* Instruction */}
            <div className="flex-1 min-w-0">
              <div className={`${isEmbedded ? 'text-[9px]' : 'text-[11px]'} font-bold ${isSimulation ? 'text-amber-400' : 'text-emerald-400'} uppercase tracking-widest mb-0.5`}>
                {turnDirection === 'STRAIGHT' ? 'Head Straight' : `Turn ${turnDirection}`}
              </div>
              <div className={`${isEmbedded ? 'text-xl' : 'text-3xl'} font-black tracking-tight leading-none`}>{totalDistText || distanceText}</div>
              <div className={`flex items-center gap-1.5 mt-1.5 text-slate-400 ${isEmbedded ? 'text-[9px]' : 'text-xs'} font-medium`}>
                <MapPin size={isEmbedded ? 9 : 12} className={isSimulation ? 'text-amber-500' : 'text-emerald-500'} />
                <span className="truncate">{destination.name || info}</span>
              </div>
            </div>

            {/* Compass — hidden in embedded for space */}
            {!isEmbedded && (
              <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center relative shadow-inner shrink-0">
                <Compass className={`${isSimulation ? 'text-amber-500/40' : 'text-emerald-500/40'}`} size={20} />
                <div
                  className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out"
                  style={{ transform: `rotate(${-stateRef.current.phoneHeading}deg)` }}
                >
                  <div className="w-1 h-5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calibration Overlay (Subtle Gradient) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-15 pointer-events-none" />

      {/* Initialization/Error State Overlay */}
      {error && (
        <div className="absolute inset-0 z-[10000] bg-slate-950 flex flex-col items-center justify-center p-10 text-center text-white">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
            <AlertCircle className="text-red-500" size={48} />
          </div>
          <h2 className="text-3xl font-black mb-4 tracking-tight">AR Unavailable</h2>
          <p className="text-slate-400 mb-10 max-w-sm leading-relaxed">
            {error}
          </p>
          {!isEmbedded && (
            <button
              onClick={onClose}
              className="w-full max-w-[240px] py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-200 active:scale-95 transition-all shadow-xl"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ARViewer;
