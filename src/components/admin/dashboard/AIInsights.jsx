import { Link } from 'react-router-dom';
import { CreditCard, AlertCircle, Gauge, ArrowRight, Sparkles } from 'lucide-react';

export default function AIInsights({ insights }) {
    const data = insights || {
        paymentIssueChange: 23,
        topIssue: 'Payment Failure',
        topIssueCount: 23,
        resolutionRate: 88,
        resolutionRateChange: 5,
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">AI Insights</h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">
                        New
                    </span>
                </div>
            </div>
            <p className="text-[13px] text-gray-500 mb-6">Your AI assistant has new insights</p>

            <div className="space-y-5">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm text-gray-800 font-medium">
                            Payment issues increased by {data.paymentIssueChange}%
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Compared to last week</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm text-gray-800 font-medium">
                            Top issue: {data.topIssue}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{data.topIssueCount} conversations</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Gauge className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                        <div>
                            <p className="text-sm text-gray-800 font-medium">Resolution rate</p>
                            <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                                ↑ {data.resolutionRateChange}% vs last week
                            </p>
                        </div>
                        <span className="text-sm font-bold text-gray-900 shrink-0">{data.resolutionRate}%</span>
                    </div>
                </div>
            </div>

            <Link
                to="/dashboard/support"
                className="mt-6 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
                <Sparkles className="w-4 h-4 text-teal-600" />
                View all insights
            </Link>
        </div>
    );
}