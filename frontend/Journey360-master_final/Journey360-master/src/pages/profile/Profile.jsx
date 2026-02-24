import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { auth } from '../../services/firebase';
import { User, Mail, Calendar, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const user = auth.currentUser;
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    if (!user) return null;

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your account settings and preferences.</p>
                </header>

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                    {/* Header Banner */}
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                        <div className="absolute -bottom-12 left-8">
                            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full p-1 shadow-md">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${user.email.split('@')[0]}&background=random&size=128`}
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 pb-8 px-8">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.displayName || user.email.split('@')[0]}</h2>
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

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                        <Mail size={20} />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Email Address</span>
                                </div>
                                <p className="text-gray-900 dark:text-gray-100 font-medium pl-1">{user.email}</p>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors">
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

                            <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                        <User size={20} />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Account ID</span>
                                </div>
                                <p className="text-gray-900 dark:text-gray-100 font-medium pl-1 text-sm font-mono truncate">{user.uid}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Profile;
