import React from 'react';

/**
 * Skeleton shimmer animation component.
 * Usage: <Skeleton className="w-32 h-4" /> or <Skeleton variant="card" />
 */

const shimmerBase = "relative overflow-hidden bg-slate-200/70 rounded-lg before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

export const Skeleton = ({ className = "", variant, count = 1 }) => {
    const items = Array.from({ length: count }, (_, i) => i);

    if (variant === 'card') {
        return (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
                <div className={`${shimmerBase} h-5 w-2/3`} />
                <div className={`${shimmerBase} h-4 w-full`} />
                <div className={`${shimmerBase} h-4 w-4/5`} />
                <div className="flex gap-2 pt-2">
                    <div className={`${shimmerBase} h-8 w-20 rounded-full`} />
                    <div className={`${shimmerBase} h-8 w-24 rounded-full`} />
                </div>
            </div>
        );
    }

    if (variant === 'stat') {
        return (
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-3">
                <div className={`${shimmerBase} w-10 h-10 rounded-lg`} />
                <div className="space-y-2 flex-1">
                    <div className={`${shimmerBase} h-3 w-16`} />
                    <div className={`${shimmerBase} h-5 w-10`} />
                </div>
            </div>
        );
    }

    if (variant === 'list-item') {
        return (
            <>
                {items.map((i) => (
                    <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-100 last:border-0">
                        <div className={`${shimmerBase} w-12 h-12 rounded-xl shrink-0`} />
                        <div className="flex-1 space-y-2">
                            <div className={`${shimmerBase} h-4 w-3/4`} />
                            <div className={`${shimmerBase} h-3 w-1/2`} />
                        </div>
                        <div className={`${shimmerBase} h-8 w-16 rounded-lg`} />
                    </div>
                ))}
            </>
        );
    }

    if (variant === 'trip-form') {
        return (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 space-y-6">
                <div className={`${shimmerBase} h-7 w-48`} />
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className={`${shimmerBase} h-3 w-20`} />
                        <div className={`${shimmerBase} h-11 w-full rounded-xl`} />
                    </div>
                    <div className="space-y-2">
                        <div className={`${shimmerBase} h-3 w-24`} />
                        <div className={`${shimmerBase} h-11 w-full rounded-xl`} />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-2">
                            <div className={`${shimmerBase} h-3 w-16`} />
                            <div className={`${shimmerBase} h-11 w-full rounded-xl`} />
                        </div>
                    ))}
                </div>
                <div className={`${shimmerBase} h-12 w-full rounded-xl`} />
            </div>
        );
    }

    if (variant === 'page') {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                <div className="space-y-3">
                    <div className={`${shimmerBase} h-8 w-64`} />
                    <div className={`${shimmerBase} h-4 w-96`} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} variant="stat" />
                    ))}
                </div>
                <Skeleton variant="trip-form" />
                <Skeleton variant="card" />
            </div>
        );
    }

    // Default: simple shimmer line
    return (
        <>
            {items.map((i) => (
                <div key={i} className={`${shimmerBase} ${className}`} />
            ))}
        </>
    );
};

// Dashboard-specific skeleton
export const DashboardSkeleton = () => (
    <div className="p-8 max-w-7xl mx-auto pb-24">
        {/* Header skeleton */}
        <div className="mb-8 space-y-4">
            <div className={`${shimmerBase} h-8 w-72`} />
            <div className={`${shimmerBase} h-4 w-96`} />
            <div className="grid grid-cols-3 gap-4 mt-6">
                {[1, 2, 3].map(i => <Skeleton key={i} variant="stat" />)}
            </div>
            <div className="flex gap-3 mt-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`${shimmerBase} h-10 w-28 rounded-xl`} />
                ))}
            </div>
        </div>

        {/* Main grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Skeleton variant="trip-form" />
                <Skeleton variant="card" />
            </div>
            <div className="space-y-8">
                <Skeleton variant="card" />
                <Skeleton variant="card" />
            </div>
        </div>
    </div>
);

// Itinerary skeleton
export const ItinerarySkeleton = () => (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <div className={`${shimmerBase} h-8 w-48`} />
                <div className={`${shimmerBase} h-4 w-72`} />
            </div>
            <div className="flex gap-2">
                <div className={`${shimmerBase} h-10 w-28 rounded-xl`} />
                <div className={`${shimmerBase} h-10 w-28 rounded-xl`} />
            </div>
        </div>
        {[1, 2, 3].map(day => (
            <div key={day} className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
                <div className={`${shimmerBase} h-6 w-24`} />
                <Skeleton variant="list-item" count={3} />
            </div>
        ))}
    </div>
);

export default Skeleton;
