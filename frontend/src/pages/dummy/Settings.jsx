import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import {
    Bell, Shield, Lock, Palette, User, Globe, CreditCard,
    HelpCircle, LogOut, ChevronRight, Save, Loader2, Trash2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/apiService';
import { auth } from '../../services/firebase';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const SettingsSection = ({ icon: Icon, title, description, children, color }) => (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 mb-6 transition-colors duration-300">
        <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </div>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

const ToggleItem = ({ label, description, isOn, onToggle }) => (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors" onClick={onToggle}>
        <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{label}</p>
            {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>
        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isOn ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-slate-600'}`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isOn ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </div>
    </div>
);

const InputItem = ({ label, value, onChange, type = "text", placeholder, disabled = false }) => (
    <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-900' : ''}`}
            placeholder={placeholder}
        />
    </div>
);

const Settings = () => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // User Profile State
    const [profile, setProfile] = useState({
        name: '',
        bio: '',
        phone: '',
        dob: '',
        preferences: {
            currency: 'INR',
            language: 'English',
            notifications: {
                email: true,
                push: true,
                safety: true
            },
            privacy: {
                profileVisible: true,
                locationSharing: false
            }
        }
    });

    // Fetch settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            if (!auth.currentUser) return;

            try {
                const data = await apiService.getProfile(auth);
                // Merge with defaults to prevent null errors
                // Priority: 1) Saved name from DB, 2) Email username (ignore Google displayName)
                const initialName = data.name || auth.currentUser?.email?.split('@')[0] || '';
                setProfile(prev => ({
                    ...prev,
                    ...data,
                    name: initialName,
                    preferences: {
                        ...prev.preferences,
                        ...(data.preferences || {})
                    }
                }));
            } catch (error) {
                console.error("Failed to load settings", error);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaveSuccess(false);
        try {
            await apiService.updateProfile(auth, profile);
            setSaveSuccess(true);
            setTimeout(() => {
                setSaving(false);
                setTimeout(() => setSaveSuccess(false), 3000);
            }, 600);
        } catch (error) {
            console.error("Failed to save", error);
            setSaving(false);
            alert("Failed to save settings.");
        }
    };

    const updatePref = (section, key, value) => {
        setProfile(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                [section]: {
                    ...prev.preferences[section],
                    [key]: value
                }
            }
        }));
    };

    const handleSignOut = async () => {
        await signOut(auth);
        navigate('/');
    };

    const [show2FAModal, setShow2FAModal] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');

    // Fetch 2FA Setup details when modal opens
    useEffect(() => {
        if (show2FAModal && !qrCodeUrl) {
            const setup = async () => {
                try {
                    const data = await apiService.setup2FA(auth);
                    setQrCodeUrl(data.otpauth_url);
                } catch (error) {
                    alert("Failed to initialize 2FA setup");
                    setShow2FAModal(false);
                }
            };
            setup();
        }
    }, [show2FAModal]);

    const handleVerify2FA = async () => {
        try {
            await apiService.verify2FA(auth, verificationCode);
            setProfile(prev => ({ ...prev, two_factor_enabled: true }));
            setShow2FAModal(false);
            setVerificationCode('');
            alert("Two-Factor Authentication Enabled! 🔐");
        } catch (error) {
            alert("Invalid code. Please try again.");
        }
    };

    const handleDisable2FA = async () => {
        if (window.confirm("Are you sure you want to disable 2FA? Your account will be less secure.")) {
            try {
                await apiService.disable2FA(auth);
                setProfile(prev => ({ ...prev, two_factor_enabled: false }));
            } catch (error) {
                alert("Failed to disable 2FA");
            }
        }
    };

    const handlePasswordReset = async () => {
        if (auth.currentUser?.email) {
            try {
                await sendPasswordResetEmail(auth, auth.currentUser.email);
                alert(`Password reset email sent to ${auth.currentUser.email}`);
            } catch (e) {
                alert("Error sending reset email: " + e.message);
            }
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone and all your data will be lost.")) {
            try {
                await apiService.deleteAccount(auth);
                alert("Your account has been deleted.");
                handleSignOut();
            } catch (error) {
                console.error("Delete failed", error);
                alert("Failed to delete account: " + error.message);
            }
        }
    };

    if (loading) return <AppLayout><div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-emerald-600" /></div></AppLayout>;

    return (
        <AppLayout>
            <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
                <main className="max-w-4xl mx-auto p-6 lg:p-10 mb-20">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Settings</h1>
                            <p className="text-gray-500 dark:text-gray-400">Manage your profile and preferences.</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`${saveSuccess ? 'bg-green-600' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all disabled:opacity-70 active:scale-95`}
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : (saveSuccess ? <Shield size={18} /> : <Save size={18} />)}
                                {saving ? 'Saving...' : (saveSuccess ? 'Changes Saved!' : 'Save Changes')}
                            </button>
                            {saveSuccess && <p className="text-xs font-bold text-green-500 animate-bounce">Profile updated successfully!</p>}
                        </div>
                    </div>

                    {/* 1. Profile Management */}
                    <SettingsSection icon={User} title="My Profile" description="Update your personal information." color="text-emerald-600 bg-emerald-600">
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-600 border-4 border-white shadow-sm overflow-hidden">
                                {(auth.currentUser?.photoURL || profile.photo_url) ? (
                                    <img
                                        src={auth.currentUser?.photoURL || profile.photo_url}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                ) : (
                                    profile.name ? profile.name[0].toUpperCase() : 'U'
                                )}
                            </div>
                            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <InputItem label="Login Email (Account ID)" value={auth.currentUser?.email} onChange={() => { }} placeholder="email@example.com" disabled={true} />
                                    <p className="text-[10px] text-gray-400 mt-1 italic">* Your login email cannot be changed from this page.</p>
                                </div>
                                <div className="md:col-span-2">
                                    <InputItem label="Full Name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} placeholder="Your Name" />
                                </div>
                                <div className="md:col-span-2">
                                    <InputItem label="Profile Picture URL" value={profile.photo_url} onChange={(v) => setProfile({ ...profile, photo_url: v })} placeholder="https://example.com/avatar.jpg" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bio</label>
                                    <textarea
                                        rows="3"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium resize-none"
                                        placeholder="Tell us a bit about yourself..."
                                        value={profile.bio || ''}
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                    ></textarea>
                                </div>
                                <InputItem label="Phone Number" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} placeholder="+1 (555) 000-0000" />
                                <InputItem label="Date of Birth" value={profile.dob} onChange={(v) => setProfile({ ...profile, dob: v })} type="date" />
                            </div>
                        </div>
                    </SettingsSection>

                    {/* 2. Preferences (Region & Appearance) */}
                    <SettingsSection icon={Globe} title="Preferences" description="Customize your regional usage." color="text-purple-600 bg-purple-600">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Currency</label>
                                <select
                                    value={profile.preferences.currency}
                                    onChange={(e) => setProfile(prev => ({ ...prev, preferences: { ...prev.preferences, currency: e.target.value } }))}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
                                >
                                    <option value="INR">INR (₹) - Indian Rupee</option>
                                    <option value="USD">USD ($) - US Dollar</option>
                                    <option value="EUR">EUR (€) - Euro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Language</label>
                                <select
                                    value={profile.preferences.language}
                                    onChange={(e) => setProfile(prev => ({ ...prev, preferences: { ...prev.preferences, language: e.target.value } }))}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
                                >
                                    <option value="English">English</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="French">French</option>
                                </select>
                            </div>
                        </div>
                        <ToggleItem
                            label="Dark Mode"
                            description="Easier on the eyes at night."
                            isOn={theme === 'dark'}
                            onToggle={toggleTheme}
                        />
                    </SettingsSection>

                    {/* 3. Notifications */}
                    <SettingsSection icon={Bell} title="Notifications" description="Choose what we keep you updated on." color="text-emerald-600 bg-emerald-600">
                        <ToggleItem label="Safety Alerts" description="Critical alerts about your destination." isOn={profile.preferences.notifications.safety} onToggle={() => updatePref('notifications', 'safety', !profile.preferences.notifications.safety)} />
                        <ToggleItem label="Itinerary Updates" description="Changes to your trip plans." isOn={profile.preferences.notifications.push} onToggle={() => updatePref('notifications', 'push', !profile.preferences.notifications.push)} />
                        <ToggleItem label="Email Reports" description="Weekly summaries and travel tips." isOn={profile.preferences.notifications.email} onToggle={() => updatePref('notifications', 'email', !profile.preferences.notifications.email)} />
                    </SettingsSection>

                    {/* 4. Security */}
                    <SettingsSection icon={Shield} title="Security & Account" description="Protect your account." color="text-teal-600 bg-teal-600">
                        <div className="flex items-center justify-between p-3">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">Password</p>
                                <p className="text-xs text-gray-400 mt-1">Last changed recently</p>
                            </div>
                            <button onClick={handlePasswordReset} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                Change Password
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-3">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">Two-Factor Authentication</p>
                                <p className="text-xs text-gray-400 mt-1">Extra layer of security using Google Authenticator.</p>
                            </div>
                            <button
                                onClick={profile.two_factor_enabled ? handleDisable2FA : () => setShow2FAModal(true)}
                                className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${profile.two_factor_enabled
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {profile.two_factor_enabled ? 'Enabled' : 'Enable'}
                            </button>
                        </div>
                    </SettingsSection>

                    {/* 2FA Setup Modal */}
                    {show2FAModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-slate-800">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Setup Two-Factor Auth</h3>
                                <p className="text-sm text-gray-500 mb-6">Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>

                                {qrCodeUrl ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="p-4 bg-white rounded-xl border border-gray-200">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeUrl)}`}
                                                alt="QR Code"
                                                className="w-40 h-40"
                                            />
                                        </div>

                                        <div className="w-full text-center">
                                            <p className="text-xs text-gray-500 mb-2">Can't scan? Enter this key manually:</p>
                                            <div
                                                className="bg-gray-100 dark:bg-slate-800 p-3 rounded-lg font-mono text-sm font-bold tracking-widest break-all cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                                onClick={() => {
                                                    // Parse secret from otpauth URL for display (it's in the 'secret' param)
                                                    const secret = new URLSearchParams(qrCodeUrl.split('?')[1]).get('secret');
                                                    navigator.clipboard.writeText(secret);
                                                    alert("Key copied to clipboard!");
                                                }}
                                            >
                                                {new URLSearchParams(qrCodeUrl.split('?')[1]).get('secret')}
                                            </div>
                                        </div>

                                        <div className="w-full">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                Enter 6-digit Code from App
                                            </label>
                                            <input
                                                type="text"
                                                maxLength="6"
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value)}
                                                className="w-full text-center text-2xl tracking-widest font-mono py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-black dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                placeholder="000000"
                                            />
                                        </div>

                                        <div className="flex gap-3 w-full">
                                            <button
                                                onClick={() => { setShow2FAModal(false); setQrCodeUrl(null); setVerificationCode(''); }}
                                                className="flex-1 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleVerify2FA}
                                                disabled={verificationCode.length !== 6}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:shadow-none transition-all"
                                            >
                                                Verify & Enable
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="animate-spin text-emerald-600" size={32} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 5. Support */}
                    <SettingsSection icon={HelpCircle} title="Support" description="Need help?" color="text-orange-500 bg-orange-500">
                        <div onClick={() => navigate('/contact')} className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Contact Support Team</p>
                            <ChevronRight size={18} className="text-gray-400" />
                        </div>
                        <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Help Center & FAQs</p>
                            <ChevronRight size={18} className="text-gray-400" />
                        </div>
                    </SettingsSection>

                    {/* Danger Zone */}
                    <div className="mt-8 border border-red-100 bg-red-50 dark:bg-red-900/10 rounded-2xl p-6">
                        <h3 className="text-red-900 dark:text-red-200 font-bold mb-4 flex items-center gap-2">
                            <Trash2 size={18} /> Danger Zone
                        </h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">Delete Account</p>
                                <p className="text-xs text-red-500/80 mt-1">This action cannot be undone.</p>
                            </div>
                            <button onClick={handleDeleteAccount} className="text-sm font-bold text-red-600 hover:text-red-700 bg-white border border-red-200 px-4 py-2 rounded-lg shadow-sm active:scale-95 transition-transform">
                                Delete Account
                            </button>
                        </div>
                    </div>

                    <div className="mt-10 flex justify-center">
                        <button onClick={handleSignOut} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold transition-colors">
                            <LogOut size={18} /> Sign Out
                        </button>
                    </div>

                    <div className="text-center mt-12 text-sm text-gray-400">
                        Journey360 v2.2.0 (Build 5062)
                    </div>
                </main>
            </div>
        </AppLayout>
    );
};

export default Settings;
