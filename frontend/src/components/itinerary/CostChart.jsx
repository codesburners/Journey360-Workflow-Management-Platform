import React from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];

const CostChart = ({ costSummary = {}, dailyCosts = [], currencySymbol = '₹' }) => {
    // Prepare data for Pie Chart
    const pieData = Object.entries(costSummary)
        .filter(([key, value]) => key !== 'total' && typeof value === 'number' && value > 0)
        .map(([key, value]) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: value
        }));

    // Prepare data for Bar Chart
    const barData = dailyCosts.map(day => {
        // If totalDayCost is missing, try to sum up place costs
        const amount = day.totalDayCost || (day.places?.reduce((sum, p) => sum + (parseFloat(p.price || p.cost || 0)), 0)) || 0;
        return {
            name: `Day ${day.dayNumber || ''}`,
            amount: amount
        };
    });

    if (pieData.length === 0 && barData.length === 0) {
        return (
            <div className="flex items-center justify-center p-20 text-slate-400 font-medium">
                No cost information available for this itinerary.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full p-4">
            {/* Category Breakdown */}
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100 uppercase tracking-wider text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Expense Breakdown
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#f8fafc',
                                    fontSize: '12px'
                                }}
                                formatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Daily Spending */}
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100 uppercase tracking-wider text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    Daily Spending
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                            <XAxis
                                dataKey="name"
                                fontSize={10}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8' }}
                            />
                            <YAxis
                                fontSize={10}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8' }}
                                tickFormatter={(value) => `${currencySymbol}${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#f8fafc',
                                    fontSize: '12px'
                                }}
                                formatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
                            />
                            <Bar
                                dataKey="amount"
                                fill="#3B82F6"
                                radius={[8, 8, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default CostChart;
