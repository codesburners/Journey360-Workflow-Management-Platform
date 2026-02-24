import { useEffect, useState } from "react";
// Vercel Deployment Check
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import LandingPage from "./pages/LandingPage";
import BlogPost from "./pages/dummy/BlogPost";
import Dashboard from "./pages/dashboard/Dashboard";
import Assistant from "./pages/assistant/Assistant";
import About from "./pages/dummy/About";
import Services from "./pages/dummy/Services";
import Contact from "./pages/dummy/Contact";
import Settings from "./pages/dummy/Settings";
import SavedPlaces from "./pages/dummy/SavedPlaces";
import Profile from "./pages/profile/Profile";
import ItineraryPage from "./pages/Itinerary/ItineraryPage";
import SafetyPage from "./pages/safety-center/SafetyPage";
import MyTripsPage from "./pages/dashboard/MyTripsPage";
import TermsOfService from "./pages/TermsOfService";
import TripNavigation from "./pages/navigation/TripNavigation";
import ARConnect from "./pages/navigation/ARConnect";
import TransportPage from "./pages/Transport/TransportPage";
import Navbar from "./components/layout/Navbar";


export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  // 1️⃣ Auth Listener (Run ONCE)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsub();
  }, []); // Empty dependency array = runs only on mount

  // 2️⃣ Protected Route Logic (Run on location change)
  useEffect(() => {
    if (loading) return; // Wait for initial auth check

    // ✅ Allow public routes
    const publicRoutes = ["/", "/login", "/signup", "/about", "/services", "/contact", "/ar-connect", "/tos"];
    const isPublic = publicRoutes.includes(location.pathname) || location.pathname.startsWith('/blog/');

    // ❌ Block protected routes if not logged in
    if (!user && !isPublic) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold">Loading App...</div>;

  return (
    <>
      <Navbar isLoggedIn={!!user} currentPath={location.pathname} />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/tos" element={<TermsOfService />} />
        <Route path="/ar-connect" element={<TripNavigation />} />
        <Route path="/ar-navigate" element={<TripNavigation />} />
        <Route path="/ar-sync" element={<ARConnect />} />


        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/my-trips"
          element={user ? <MyTripsPage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/assistant"
          element={user ? <Assistant /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/itinerary"
          element={user ? <ItineraryPage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/safety"
          element={user ? <SafetyPage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/transport"
          element={user ? <TransportPage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/settings"
          element={user ? <Settings /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/saved"
          element={user ? <SavedPlaces /> : <Navigate to="/login" replace />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
