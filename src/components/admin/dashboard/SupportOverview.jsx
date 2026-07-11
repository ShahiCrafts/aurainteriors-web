import { Link } from 'react-router-dom';
import { MessageSquare, UserCog, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';

export default function SupportOverview({ stats }) {
    const data = stats || {
        openConversations: 18,
        waitingForHuman: 5,
        urgent: 2,
        aiResolved: 23,
    };

    const rows = [
        {
            label: 'Open Conversations',
            value: data.openConversations,
            icon: MessageSquare,
            iconBg: 'bg-indigo-50 text-indigo-600',
            badgeBg: 'bg-indigo-50 text-indigo-700',
        },
        {
            label: 'Waiting for Human',
            value: data.waitingForHuman,
            icon: UserCog,
            iconBg: 'bg-orange-50 text-orange-600',
            badgeBg: 'bg-orange-50 text-orange-700',
        },
        {
            label: 'Urgent',
            value: data.urgent,
            icon: AlertTriangle,
            iconBg: 'bg-red-50 text-red-600',
            badgeBg: 'bg-red-50 text-red-700',
        },
        {
            label: 'AI Resolved',
            value: data.aiResolved,
            icon: Sparkles,
            iconBg: 'bg-emerald-50 text-emerald-600',
            badgeBg: 'bg-emerald-50 text-emerald-700',
        },
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base font-bold text-gray-900">
                        Support Overview
                    </h2>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        View customer support activity
                    </p>
                </div>

                <Link
                    to="/dashboard/support"
                    className="text-teal-600 text-xs font-medium hover:text-teal-700 flex items-center gap-1 transition-colors"
                >
                    View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="space-y-1 flex-1">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-gray-50/60 transition-colors"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${row.iconBg}`}>
                                <row.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm text-gray-700 truncate">{row.label}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${row.badgeBg}`}>
                            {row.value}
                        </span>
                    </div>
                ))}
            </div>

            <Link
                to="/dashboard/support"
                className="mt-3 w-full text-center py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-colors"
            >
                Go to Support Center
            </Link>
        </div>
    );
}