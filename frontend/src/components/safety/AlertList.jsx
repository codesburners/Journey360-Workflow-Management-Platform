import React from 'react';
import { AlertTriangle, Users, Train } from 'lucide-react';
import clsx from 'clsx';

const AlertItem = ({ alert }) => {
    const getStyles = (type) => {
        switch (type) {
            case 'critical':
                return {
                    bg: 'bg-red-50/50 dark:bg-red-900/10',
                    border: 'border-red-100 dark:border-red-900/30',
                    iconBg: 'bg-red-200 dark:bg-red-900/40',
                    iconColor: 'text-red-600 dark:text-red-400',
                    badgeColor: 'text-red-500 dark:text-red-400',
                    Icon: AlertTriangle,
                    label: 'Critical'
                };
            case 'info':
                return {
                    bg: 'bg-amber-50/50 dark:bg-amber-900/10',
                    border: 'border-amber-100 dark:border-amber-900/30',
                    iconBg: 'bg-amber-200 dark:bg-amber-900/40',
                    iconColor: 'text-amber-700 dark:text-amber-400',
                    badgeColor: 'text-amber-600 dark:text-amber-400',
                    Icon: Users,
                    label: 'Informational'
                };
            case 'transit':
                return {
                    bg: 'bg-white/40 dark:bg-slate-800/40',
                    border: 'border-white/20 dark:border-slate-700/50',
                    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
                    iconColor: 'text-emerald-600 dark:text-emerald-400',
                    badgeColor: 'text-emerald-500 dark:text-emerald-400',
                    Icon: Train,
                    label: 'Transit'
                };
            default:
                return {
                    bg: 'bg-gray-50/50 dark:bg-slate-800/50',
                    border: 'border-gray-100 dark:border-slate-700',
                    iconBg: 'bg-gray-200 dark:bg-slate-700',
                    iconColor: 'text-gray-600 dark:text-gray-400',
                    badgeColor: 'text-gray-500 dark:text-gray-300',
                    Icon: AlertTriangle,
                    label: 'Alert'
                };
        }
    };

    const style = getStyles(alert.type);
    const Icon = style.Icon;

    return (
        <div className={clsx("p-5 rounded-2xl border mb-4 last:mb-0 backdrop-blur-md", style.bg, style.border)}>
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", style.iconBg)}>
                    <Icon className={clsx("w-5 h-5", style.iconColor)} />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">{alert.title}</h4>
                        <span className={clsx("text-xs font-semibold px-2 py-1 rounded-full bg-white/50 dark:bg-slate-900/50", style.badgeColor)}>
                            {style.label}
                        </span>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-gray-300 mb-3 leading-relaxed">
                        {alert.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs md:text-sm font-medium">
                        <span className="text-slate-500 dark:text-gray-500">{alert.time}</span>
                        {alert.distance && (
                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                                {alert.distance}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AlertList = ({ alerts }) => {
    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detailed Alerts</h2>
                <span className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase">Updated 2 mins ago</span>
            </div>
            <div className="space-y-4">
                {alerts.map(alert => (
                    <AlertItem key={alert.id} alert={alert} />
                ))}
            </div>
        </div>
    );
};

export default AlertList;
