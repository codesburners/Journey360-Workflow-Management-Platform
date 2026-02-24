import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import { useTheme } from "../../context/ThemeContext";

export default function Navbar({ isLoggedIn, currentPath }) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut(auth);
    setTheme('light');
    navigate("/");
  };

  // Show public navbar on specific pages
  const publicPaths = ['/', '/login', '/signup', '/about', '/services', '/contact'];
  const isPublicPage = publicPaths.includes(currentPath) || currentPath.startsWith('/blog/');

  // If we are logged in, we only show this public Navbar on the Landing Page ('/') 
  // All other pages (About, Services, Contact, Dashboard etc) use AppLayout or are protected.
  // This prevents the duplicate Navbar issue you saw on the About page.
  if (!isPublicPage || (isLoggedIn && currentPath !== '/')) return null;

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50 transition-all duration-300">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 text-xl font-semibold hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center rotate-45 shadow-sm">
          <div className="w-4 h-4 bg-white rotate-45"></div>
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">Journey360</span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-8">
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          {['Services', 'About', 'Contact'].map((item) => (
            <Link key={item} to={`/${item.toLowerCase()}`} className="hover:text-emerald-600 transition-colors">
              {item}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className="text-sm font-bold text-white bg-emerald-600 px-5 py-2.5 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-bold text-gray-700 hover:text-emerald-600 px-4 py-2 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="text-sm font-bold text-white bg-emerald-600 px-5 py-2.5 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
