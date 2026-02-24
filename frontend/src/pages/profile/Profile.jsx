import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { auth } from '../../services/firebase';
import { User, Mail, Calendar, LogOut, Phone, BookOpen, Loader2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';

const Profile = () => {
    const user = auth.currentUser;
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imgError, setImgError] = useState(false);


    useEffect(() => {
        const loadProfile = async () => {
            // Wait for Firebase auth to initialize
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const data = await apiService.getProfile(auth);
                setProfile(data);
            } catch (error) {
                console.error("Failed to load profile", error);
                // Set empty profile to prevent errors
                setProfile({});
            } finally {
                setLoading(false);
            }
        };

        // Small delay to ensure Firebase auth is ready
        const timer = setTimeout(loadProfile, 100);
        return () => clearTimeout(timer);
    }, [user]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    if (loading) return (
        <AppLayout>
            <div className="flex justify-center items-center px-8 py-20">
                <Loader2 className="animate-spin text-emerald-600" size={40} />
            </div>
        </AppLayout>
    );

    if (!user) return null;

    // Helper function to format name in Title Case
    const formatName = (name) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Get name and format it properly
    // Priority: 1) Custom name from Settings, 2) Email username (ignore Google displayName)
    const rawName = profile?.name || user.email.split('@')[0];
    const name = formatName(rawName);

    // Prioritize Firebase/Google profile picture, then custom photo_url, then fallback to UI Avatars
    const userAvatar = !imgError && (user.photoURL || profile?.photo_url)
        ? (user.photoURL || profile?.photo_url)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=128`;

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your account settings and preferences.</p>
                </header>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                    {/* Header Banner */}
                    <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-600 relative">
                        <div className="absolute -bottom-12 left-8">
                            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full p-1 shadow-md">
                                <img
                                    src={userAvatar}
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 pb-8 px-8">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{name}</h2>
                                <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </div>

                        {/* Bio Section */}
                        {profile?.bio && (
                            <div className="mb-8 p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30">
                                <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <BookOpen size={14} /> About Me
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm italic">
                                    "{profile.bio}"
                                </p>
                            </div>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                        <Mail size={20} />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Email Address</span>
                                </div>
                                <p className="text-gray-900 dark:text-gray-100 font-medium pl-1">{user.email}</p>
                            </div>

                            <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                        <Phone size={20} />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Phone Number</span>
                                </div>
                                <p className="text-gray-900 dark:text-gray-100 font-medium pl-1">{profile?.phone || "Not provided"}</p>
                            </div>

                            <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                                        <Calendar size={20} />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Date of Birth</span>
                                </div>
                                <p className="text-gray-900 dark:text-gray-100 font-medium pl-1">{profile?.dob || "Not specified"}</p>
                            </div>

                            <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                        <Calendar size={20} />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Account Created</span>
                                </div>
                                <p className="text-gray-900 dark:text-gray-100 font-medium pl-1">
                                    {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>

                            <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors md:col-span-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                                        <User size={20} />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Account ID</span>
                                </div>
                                <p className="text-gray-900 dark:text-gray-100 font-medium pl-1 text-xs font-mono break-all">{user.uid}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Profile;
