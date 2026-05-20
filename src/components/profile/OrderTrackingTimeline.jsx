import { Clock, CheckCircle, Box, Truck } from "lucide-react";

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

const STATUS_MAP = {
  pending: {
    label: "Pending",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle,
  },
  processing: {
    label: "Processing",
    icon: Box,
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
  },
};

export default function OrderTrackingTimeline({ status }) {
  const currentIdx = STEPS.indexOf(status);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-dm-sans font-medium text-sm text-center">
        This order has been cancelled.
      </div>
    );
  }

  return (
    <div className="w-full py-6 font-dm-sans">
      <div className="flex items-center justify-between relative">
        {/* Connecting Axis Line Background */}
        <div className="absolute left-6 right-6 top-[22px] h-[2px] bg-neutral-100 -z-1" />

        {/* Connecting Axis Line Active */}
        <div
          className="absolute left-6 top-[22px] h-[2px] bg-[#F27318] transition-all duration-700 -z-1"
          style={{
            width: currentIdx >= 0
              ? `calc(${((currentIdx) / (STEPS.length - 1)) * 100}% - 24px)`
              : "0%"
          }}
        />

        {STEPS.map((stepId, idx) => {
          const step = STATUS_MAP[stepId];
          const Icon = step.icon;
          const isActive = stepId === status;
          const isPast = idx < currentIdx;

          return (
            <div key={stepId} className="flex flex-col items-center flex-1 relative z-10">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isActive
                  ? "border-[#F27318] bg-white text-[#F27318] scale-110 shadow-md shadow-[#F27318]/10"
                  : isPast
                    ? "border-[#F27318] bg-[#F27318] text-white"
                    : "border-neutral-200 bg-white text-neutral-400"
                  }`}
              >
                <Icon size={18} />
              </div>
              <span
                className={`text-[11px] font-black uppercase tracking-wider mt-3 text-center transition-colors duration-500 ${isActive
                  ? "text-[#F27318]"
                  : isPast
                    ? "text-neutral-900 font-bold"
                    : "text-neutral-300 font-medium"
                  }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
