import { ShoppingBag, Clock, Truck, CheckCircle2 } from "lucide-react";

// Note: pending/processing/delivered counts are derived from the orders
// currently loaded on this page. For fully accurate totals across every
// page, expose an orders-summary endpoint from the API and pass those
// numbers in via props instead.
export default function OrderStatsCards({ orders = [], totalCount }) {
  const stats = orders.reduce(
    (acc, o) => {
      if (o.orderStatus === "pending" || o.orderStatus === "confirmed") acc.pending += 1;
      if (o.orderStatus === "processing" || o.orderStatus === "shipped") acc.processing += 1;
      if (o.orderStatus === "delivered") acc.delivered += 1;
      return acc;
    },
    { pending: 0, processing: 0, delivered: 0 },
  );

  const cards = [
    {
      label: "Total Orders",
      value: totalCount ?? orders.length,
      icon: ShoppingBag,
      color: "text-[#F27318]",
      bg: "bg-[#F27318]/10",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      label: "Processing",
      value: stats.processing,
      icon: Truck,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Delivered",
      value: stats.delivered,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-3.5 p-4 bg-white border border-neutral-200 rounded-xl"
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.bg}`}>
            <card.icon size={19} className={card.color} />
          </div>
          <div>
            <p className="text-[22px] font-semibold text-neutral-900 leading-none">{card.value}</p>
            <p className="text-[14px] text-neutral-400 font-medium mt-1">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}