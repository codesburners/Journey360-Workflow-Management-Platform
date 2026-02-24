import React from 'react';
import { AlertTriangle, Users, Train } from 'lucide-react';
import clsx from 'clsx';

const AlertItem = ({ alert }) => {
    const getStyles = (type) => {
        switch (type) {
            case 'critical':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-100',
                    iconBg: 'bg-red-200',
                    iconColor: 'text-red-600',
                    badgeColor: 'text-red-500',
                    Icon: AlertTriangle,
                    label: 'Critical'
                };
            case 'info':
                return {
                    bg: 'bg-amber-50',
                    border: 'border-amber-100',
                    iconBg: 'bg-amber-200',
                    iconColor: 'text-amber-700',
                    badgeColor: 'text-amber-600',
                    Icon: Users,
                    label: 'Informational'
                };
            case 'transit':
                return {
                    bg: 'bg-white',
                    border: 'border-slate-100',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    badgeColor: 'text-blue-500',
                    Icon: Train,
                    label: 'Transit'
                };
            default:
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-100',
                    iconBg: 'bg-gray-200',
                    iconColor: 'text-gray-600',
                    badgeColor: 'text-gray-500',
                    Icon: AlertTriangle,
                    label: 'Alert'
                };
        }
    };

    const style = getStyles(alert.type);
    const Icon = style.Icon;

    return (
        <div className={clsx("p-5 rounded-2xl border mb-4 last:mb-0", style.bg, style.border)}>
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", style.iconBg)}>
                    <Icon className={clsx("w-5 h-5", style.iconColor)} />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-900 text-sm md:text-base">{alert.title}</h4>
                        <span className={clsx("text-xs font-medium px-2 py-1 rounded-full bg-white/50", style.badgeColor)}>
                            {style.label}
                        </span>
                    </div>

                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                        {alert.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs md:text-sm font-medium">
                        <span className="text-slate-500">{alert.time}</span>
                        {alert.distance && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
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
                <h2 className="text-xl font-bold text-slate-900">Real-time Local Alerts</h2>
                <span className="text-xs font-semibold text-slate-400 uppercase">Updated 2 mins ago</span>
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
