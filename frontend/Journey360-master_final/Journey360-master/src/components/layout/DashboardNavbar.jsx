import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, Search, Bell, Settings, LogOut } from 'lucide-react';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';

const DashboardNavbar = () => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const user = auth.currentUser;
    const userAvatar = user?.email
        ? `https://ui-avatars.com/api/?name=${user.email.split('@')[0]}&background=random`
        : "https://ui-avatars.com/api/?name=User&background=random";

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    return (
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-50 transition-colors duration-300">
            {/* Left: Logo */}
            <div className="flex items-center">
                {/* Logo */}
                <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center rotate-45">
                        <div className="w-4 h-4 bg-white dark:bg-slate-900 rotate-45"></div>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Journey360</span>
                </Link>

                {/* Nav Links */}
                <nav className="hidden md:flex items-center gap-8 text-gray-600 dark:text-gray-400 font-medium text-sm ml-8">
                    <Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
                    <Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</Link>
                    <Link to="/services" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Services</Link>
                    <Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</Link>
                </nav>
            </div>

            {/* Right: Search and Actions */}
            <div className="flex items-center gap-6">
                {/* Search Bar */}
                <div className="hidden lg:flex items-center bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-lg w-64">
                    <Search size={18} className="text-gray-400 dark:text-gray-500 mr-3" />
                    <input
                        type="text"
                        placeholder="Search destinations"
                        className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-200 w-full placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                </div>

                {/* Action Icons */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <Bell size={20} />
                    </button>
                    <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <Settings size={20} />
                    </button>
                </div>

                {/* Profile & Logout */}
                <div className="flex items-center gap-4 border-l border-gray-200 dark:border-slate-800 pl-6">
                    <Link to="/profile">
                        <img
                            src={userAvatar}
                            alt="Profile"
                            className="w-9 h-9 rounded-full border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                        />
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default DashboardNavbar;
