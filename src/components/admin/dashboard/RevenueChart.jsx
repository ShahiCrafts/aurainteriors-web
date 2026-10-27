import { formatDate } from "../../../utils/formatDate";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

// FE-38: the period <select> below used to have no value/onChange/
// state at all — an admin could pick 'This Year' and nothing changed,
// while the subtitle permanently claimed 'last 30 days'. The period
// CAN genuinely drive the chart: Dashboard owns the period state and
// feeds useRevenueAnalytics(days) → GET /analytics/revenue?days=N,
// and the server honours `days` (clamped to 1..365, default 30 —
// controllers/analytics.controller.js getRevenueAnalytics). So the
// select is wired as a controlled control and the subtitle states
// the window actually being shown. The period definitions and the
// days mapping live in utils/revenuePeriod.js (this file exports
// only the component).
import { REVENUE_PERIODS, DEFAULT_REVENUE_PERIOD } from '../../../utils/revenuePeriod';
import { formatNPR } from '../../../utils/formatCurrency';

export default function RevenueChart({ data, period = DEFAULT_REVENUE_PERIOD, onPeriodChange }) {
    const activePeriod = REVENUE_PERIODS.find((p) => p.value === period) || REVENUE_PERIODS[0];
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base font-bold text-gray-900">Sales Overview</h2>
                    <p className="text-[13px] text-gray-500 mt-0.5">{activePeriod.subtitle}</p>
                </div>
                <select
                    aria-label="Revenue period"
                    value={activePeriod.value}
                    onChange={(e) => onPeriodChange?.(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer hover:border-teal-200 shrink-0"
                >
                    {REVENUE_PERIODS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
            </div>
            <div className="h-[220px] w-full min-w-0">
                {data && data.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0066ff" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#0066ff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: '#9ca3af' }}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                minTickGap={40}
                                tickFormatter={(val) => formatDate(val, { month: 'short', day: 'numeric' })}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: '#9ca3af' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    borderRadius: '12px',
                                    border: '1px solid #e5e7eb',
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                    padding: '12px'
                                }}
                                labelStyle={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}
                                formatter={(value) => [formatNPR(value), 'Revenue']}
                                labelFormatter={(label) => formatDate(label, { weekday: 'short', month: 'short', day: 'numeric' })}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#0066ff"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                dot={false}
                                activeDot={{ r: 5, fill: '#0066ff', strokeWidth: 0 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}