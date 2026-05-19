import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Calendar,
  CheckCircle,
  Truck,
  Clock,
  ChevronRight,
  Download,
  Star,
  RotateCcw,
  Box,
} from "lucide-react";
import { getImageUrl as getImageUrlUtil } from "../../utils/imageUrl";

const STATUS_MAP = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  processing: {
    label: "Processing",
    icon: Box,
    color: "text-[#F27318]",
    bg: "bg-[#F27318]/5",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  cancelled: {
    label: "Cancelled",
    icon: Package,
    color: "text-red-500",
    bg: "bg-red-50",
  },
};

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function OrderCard({ order }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const getImageUrl = (item) => getImageUrlUtil(item.image, "products");

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const currentIdx = STEPS.indexOf(order.orderStatus);
  const status = STATUS_MAP[order.orderStatus] || STATUS_MAP.pending;
  const isCancelled = order.orderStatus === "cancelled";

  return (
    <div className="group relative bg-white rounded-2xl border border-neutral-100 shadow-sm transition-all duration-300 overflow-hidden">
      <div className="p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
        {/* The Architectural Timeline Pillar */}
        <div className="lg:w-48 shrink-0">
          <div className="pt-1">
            <div className="space-y-6">
              <div className="flex flex-col gap-5 relative">
                {/* Vertical Axis Line */}
                <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-neutral-100 rounded-full" />

                {STEPS.map((stepId, idx) => {
                  const step = STATUS_MAP[stepId];
                  const isActive = stepId === order.orderStatus;
                  const isPast = idx < currentIdx;

                  if (isCancelled && idx > 0) return null;

                  return (
                    <div
                      key={stepId}
                      className="flex items-center gap-6 relative"
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 z-10 transition-all duration-500 ${
                          isActive
                            ? "border-[#F27318] bg-white scale-125"
                            : isPast
                              ? "border-[#F27318] bg-[#F27318]"
                              : "border-neutral-200 bg-white"
                        }`}
                      />
                      <span
                        className={`text-[11px] font-black uppercase tracking-widest transition-colors duration-500 ${
                          isActive
                            ? "text-neutral-900"
                            : isPast
                              ? "text-neutral-400"
                              : "text-neutral-200"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section: Metadata & Boutique Items */}
        <div className="space-y-8">
          {/* Metadata Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-black text-neutral-900 tracking-tight">
                  #{order.orderId}
                </h3>
                <span className="text-[14px] font-semibold text-neutral-400">
                  {formatDate(order.orderedAt)}
                </span>
              </div>
              <p className="text-[14px] text-neutral-400 font-medium">
                {order.items?.length} items • Transaction verified by Aura
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-neutral-900 leading-none">
                <span className="text-[16px] text-[#F27318] mr-1">NRs.</span>
                {order.total?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Boutique Item List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex gap-6 group/item">
                <div className="w-24 h-20 bg-neutral-50 rounded-2xl overflow-hidden shrink-0 transition-transform duration-700 group-hover/item:scale-105">
                  <img
                    src={getImageUrl(item)}
                    alt={item.name}
                    className="w-full h-full object-cover grayscale-[0.5] group-hover/item:grayscale-0 transition-all duration-700"
                  />
                </div>
                <div className="flex flex-col justify-center space-y-3">
                  <div>
                    <h5 className="text-[14px] font-bold text-neutral-900 uppercase tracking-tight[0.02rem] leading-tight">
                      {item.name}
                    </h5>
                    <div className="flex gap-3 mt-1">
                      {item.variant &&
                        Object.entries(item.variant).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider"
                          >
                            {k}: <span className="text-neutral-900">{v}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                  <p className="text-[14px] font-bold text-[#F27318]">
                    NRs. {item.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      {/* High-Fidelity Actions Suite */}
      <div className="px-6 lg:px-8 py-4 bg-neutral-50/50 border-t border-neutral-100 flex flex-wrap gap-4 justify-end">
        <Link
          to="/shop"
          className="px-8 py-2 bg-[#F27318] hover:bg-[#E6651B] text-white text-[15px] font-medium rounded-[8px] transition-all duration-300 transform active:scale-95"
        >
          Buy Again
        </Link>
        <button className="flex items-center gap-2 px-8 py-2 border border-[#DCDAD6] hover:border-neutral-900 text-neutral-400 hover:text-neutral-900 text-[15px] font-medium rounded-[8px] transition-all duration-300">
          <Download size={14} />
          Invoice
        </button>
        {!isCancelled && order.orderStatus === "delivered" && (
          <button className="flex items-center gap-2 px-8 py-3 border border-[#DCDAD6] hover:border-neutral-900 text-neutral-400 hover:text-neutral-900 text-[11px] font-black uppercase tracking-[0.2em] rounded-[8px] transition-all duration-300">
            <Star size={14} />
            Write Review
          </button>
        )}
        {["pending", "confirmed"].includes(order.orderStatus) && (
          <button className="flex items-center gap-2 px-8 py-3 border border-[#DCDAD6] hover:border-red-500 hover:text-red-500 text-neutral-400 text-[11px] font-black uppercase tracking-[0.2em] rounded-[8px] transition-all duration-300">
            <RotateCcw size={14} />
            Request Return
          </button>
        )}
      </div>
    </div>
  );
}
