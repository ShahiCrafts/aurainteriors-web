import { Link } from "react-router-dom";
import { ShoppingBag, ClipboardPlus, UserPlus } from "lucide-react";

// FE-16: the previous targets (/dashboard/products/new, /dashboard/orders/new,
// /dashboard/users/new, /dashboard/reports) match no child route under
// /dashboard — they rendered the admin layout with an empty content area.
// Create actions now land on the real list pages (each has its own
// in-page create flow); "View Reports" is hidden — the SalesReports page
// component exists but is not routed, pending an owner decision.
const actions = [
  {
    label: "Add Product",
    icon: ShoppingBag,
    path: "/dashboard/products",
    iconBg: "bg-indigo-50 text-indigo-600",
  },
  {
    label: "Create Order",
    icon: ClipboardPlus,
    path: "/dashboard/orders",
    iconBg: "bg-blue-50 text-blue-600",
  },
  {
    label: "Add User",
    icon: UserPlus,
    path: "/dashboard/users",
    iconBg: "bg-emerald-50 text-emerald-600",
  },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
      <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.path}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${action.iconBg}`}
            >
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
