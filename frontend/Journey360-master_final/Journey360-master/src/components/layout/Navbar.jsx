import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";

export default function Navbar({ isLoggedIn, currentPath }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // Only show this public navbar on Login and Signup pages
  const publicPaths = ['/', '/signup', '/about', '/services', '/contact'];
  if (!publicPaths.includes(currentPath)) return null;

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 text-xl font-semibold">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center rotate-45">
          <div className="w-4 h-4 bg-white rotate-45"></div>
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">Journey360</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-8">
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-700">
          <span className="hover:text-blue-600 cursor-pointer">Explore</span>
          <span className="hover:text-blue-600 cursor-pointer">Safety</span>
          <span className="hover:text-blue-600 cursor-pointer">Pricing</span>
          <span className="hover:text-blue-600 cursor-pointer">Help</span>
          <Link to="/about" className="hover:text-blue-600 cursor-pointer">About</Link>
        </nav>

        {/* AUTH BUTTON LOGIC */}
        {(currentPath === "/signup" || currentPath === "/about" || currentPath === "/services" || currentPath === "/contact") && !isLoggedIn ? (
          <Link
            to="/"
            className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Login
          </Link>
        ) : (currentPath === "/" || currentPath === "/about" || currentPath === "/services" || currentPath === "/contact") && isLoggedIn ? (
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Go to Dashboard
          </Link>
        ) : null}
      </div>
    </header>
  );
}
