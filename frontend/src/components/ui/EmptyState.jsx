import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Compass, Bookmark, MessageCircle, Shield, Plane } from 'lucide-react';

/**
 * Empty state component with illustration, message, and CTA.
 * Usage: <EmptyState variant="trips" /> or with custom props.
 */

const presets = {
    trips: {
        icon: Plane,
        title: "No trips yet",
        description: "Start planning your next adventure! Create a trip and let our AI build the perfect itinerary.",
        ctaLabel: "Create Your First Trip",
        ctaPath: "/dashboard",
        color: "indigo"
    },
    saved: {
        icon: Bookmark,
        title: "No saved places",
        description: "Found a place you love? Save it from any itinerary to keep it for later.",
        ctaLabel: "Browse Itineraries",
        ctaPath: "/my-trips",
        color: "amber"
    },
    itinerary: {
        icon: Compass,
        title: "No itinerary generated",
        description: "This trip doesn't have an itinerary yet. Generate one with AI to get started.",
        ctaLabel: "Generate Itinerary",
        ctaPath: null,
        color: "violet"
    },
    chat: {
        icon: MessageCircle,
        title: "Start a conversation",
        description: "Ask your AI travel assistant anything — from restaurant recommendations to local customs.",
        ctaLabel: null,
        color: "cyan"
    },
    safety: {
        icon: Shield,
        title: "No safety data",
        description: "Enter a destination to see real-time safety information and travel advisories.",
        ctaLabel: null,
        color: "emerald"
    },
    search: {
        icon: MapPin,
        title: "No results found",
        description: "We couldn't find anything matching your search. Try a different query.",
        ctaLabel: null,
        color: "slate"
    }
};

const colorClasses = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', btn: 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/25' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', btn: 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/25' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-500', btn: 'bg-slate-600 hover:bg-slate-700 shadow-slate-500/25' },
};

const EmptyState = ({
    variant,
    icon: CustomIcon,
    title: customTitle,
    description: customDesc,
    ctaLabel: customCta,
    ctaPath: customPath,
    onAction,
    color: customColor,
    className = ""
}) => {
    const preset = variant ? presets[variant] : {};
    const Icon = CustomIcon || preset.icon || MapPin;
    const title = customTitle || preset.title || "Nothing here yet";
    const description = customDesc || preset.description || "";
    const ctaLabel = customCta !== undefined ? customCta : preset.ctaLabel;
    const ctaPath = customPath !== undefined ? customPath : preset.ctaPath;
    const color = customColor || preset.color || "slate";
    const colors = colorClasses[color] || colorClasses.slate;

    return (
        <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
            {/* Icon container */}
            <div className={`w-20 h-20 ${colors.bg} rounded-2xl flex items-center justify-center mb-6 rotate-6 hover:rotate-0 transition-transform duration-500`}>
                <Icon className={`w-10 h-10 ${colors.text}`} strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-slate-900 mb-2">
                {title}
            </h3>

            {/* Description */}
            <p className="text-slate-500 max-w-sm leading-relaxed mb-6">
                {description}
            </p>

            {/* CTA Button */}
            {ctaLabel && (
                onAction ? (
                    <button
                        onClick={onAction}
                        className={`px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all active:scale-95 ${colors.btn}`}
                    >
                        {ctaLabel}
                    </button>
                ) : ctaPath ? (
                    <Link
                        to={ctaPath}
                        className={`px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all active:scale-95 inline-block ${colors.btn}`}
                    >
                        {ctaLabel}
                    </Link>
                ) : null
            )}
        </div>
    );
};

export default EmptyState;
