 import { Link } from 'react-router-dom';
import { ShoppingBag, ClipboardPlus, UserPlus, FileBarChart } from 'lucide-react';

const actions = [
    {
        label: 'Add Product',
        icon: ShoppingBag,
        path: '/dashboard/products/new',
        iconBg: 'bg-indigo-50 text-indigo-600',
    },
    {
        label: 'Create Order',
        icon: ClipboardPlus,
        path: '/dashboard/orders/new',
        iconBg: 'bg-blue-50 text-blue-600',
    },
    {
        label: 'Add User',
        icon: UserPlus,
        path: '/dashboard/users/new',
        iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
        label: 'View Reports',
        icon: FileBarChart,
        path: '/dashboard/reports',
        iconBg: 'bg-orange-50 text-orange-600',
    },
];

export default function QuickActions() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-3">
                {actions.map((action) => (
                    <Link
                        key={action.label}
                        to={action.path}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${action.iconBg}`}>
                            <action.icon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-medium text-gray-600 text-center leading-tight">
                            {action.label}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}