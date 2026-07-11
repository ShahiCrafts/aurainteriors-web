import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a78bfa', '#ec4899', '#facc15'];

export default function CategorySalesChart({ data }) {
    const total = data.reduce((sum, entry) => sum + (entry.value || 0), 0);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <div className="mb-4">
                <h2 className="text-base font-bold text-gray-900">
                    Sales by Category
                </h2>
                <p className="text-[13px] text-gray-500 mt-0.5">
                    Product distribution by category
                </p>
            </div>            
            <div className="flex flex-col items-center">
                <div className="relative w-[140px] h-[140px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={62}
                                paddingAngle={3}
                                dataKey="value"
                                strokeWidth={0}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                formatter={(val) => [val, 'Sold']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-sm font-bold text-gray-900 leading-none">{total.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400 mt-1">Total</span>
                    </div>
                </div>

                <div className="w-full mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                    {data.slice(0, 6).map((entry, index) => {
                        const percent = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                        return (
                            <div key={entry.name} className="flex items-center justify-between text-xs gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-gray-600 truncate">{entry.name}</span>
                                </div>
                                <span className="font-semibold text-gray-900 shrink-0">{percent}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}