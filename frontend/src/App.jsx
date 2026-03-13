import { useEffect, useState, lazy, Suspense } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import { Toaster } from "sonner";

import ErrorBoundary from "./components/ErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";
import PageTransition from "./components/PageTransition";
import Navbar from "./components/layout/Navbar";

// Eagerly loaded (small/critical pages)
import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages (code splitting for performance)
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Assistant = lazy(() => import("./pages/assistant/Assistant"));
const BlogPost = lazy(() => import("./pages/dummy/BlogPost"));
const About = lazy(() => import("./pages/dummy/About"));
const Services = lazy(() => import("./pages/dummy/Services"));
const Contact = lazy(() => import("./pages/dummy/Contact"));
const Settings = lazy(() => import("./pages/dummy/Settings"));
const SavedPlaces = lazy(() => import("./pages/dummy/SavedPlaces"));
const Profile = lazy(() => import("./pages/profile/Profile"));
const ItineraryPage = lazy(() => import("./pages/Itinerary/ItineraryPage"));
const SafetyPage = lazy(() => import("./pages/safety-center/SafetyPage"));
const MyTripsPage = lazy(() => import("./pages/dashboard/MyTripsPage"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const TransportPage = lazy(() => import("./pages/Transport/TransportPage"));

// Heavy pages — lazy loaded to avoid 1.7MB initial bundle
const TripNavigation = lazy(() => import("./pages/navigation/TripNavigation"));
const ARConnect = lazy(() => import("./pages/navigation/ARConnect"));

// Suspense fallback spinner
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-sm font-medium text-slate-500">Loading...</p>
    </div>
  </div>
);

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
  }, []);

  // 2️⃣ Protected Route Logic (Run on location change)
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/about", "/services", "/contact", "/ar-connect", "/tos"];
    const isPublic = publicRoutes.includes(location.pathname) || location.pathname.startsWith('/blog/');

    if (!user && !isPublic) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg font-semibold text-slate-700">Loading Journey360...</p>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <OfflineBanner />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: { fontFamily: 'inherit' },
          duration: 4000,
        }}
      />
      <Navbar isLoggedIn={!!user} currentPath={location.pathname} />

      <Suspense fallback={<PageLoader />}>
        <PageTransition>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
            <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
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

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </Suspense>
    </ErrorBoundary>
  );
}
