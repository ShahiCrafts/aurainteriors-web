import { Clock, CheckCircle, Box, Truck } from "lucide-react";

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

const STATUS_MAP = {
  pending: { label: "Pending", icon: Clock },
  confirmed: { label: "Confirmed", icon: CheckCircle },
  processing: { label: "Processing", icon: Box },
  shipped: { label: "Shipped", icon: Truck },
  delivered: { label: "Delivered", icon: CheckCircle },
};

const formatShortDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function OrderTrackingTimeline({ status, dates = {}, compact = false }) {
  const currentIdx = STEPS.indexOf(status);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-500 font-dm-sans font-bold text-[12px] uppercase tracking-wider text-center">
        Order Cancelled
      </div>
    );
  }

  return (
    <div className="w-full font-dm-sans">
      {!compact && (
        <p className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-3">
          Order Tracking
        </p>
      )}
      <div className="flex items-start justify-between relative">
        <div className="absolute left-[18px] right-[18px] top-[17px] h-[2px] bg-neutral-100 -z-0" />
        <div
          className="absolute left-[18px] top-[17px] h-[2px] bg-[#F27318] transition-all duration-700 -z-0"
          style={{
            width:
              currentIdx >= 0
                ? `calc(${(currentIdx / (STEPS.length - 1)) * 100}% - 36px)`
                : "0%",
          }}
        />

        {STEPS.map((stepId, idx) => {
          const step = STATUS_MAP[stepId];
          const Icon = step.icon;
          const isActive = stepId === status;
          const isPast = idx < currentIdx;
          const isReached = isActive || isPast;

          return (
            <div key={stepId} className="flex flex-col items-center flex-1 relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-1 transition-all duration-500 ${
                  isActive
                    ? "border-[#F27318] bg-white text-[#F27318]"
                    : isPast
                      ? "border-[#F27318] bg-[#F27318] text-white"
                      : "border-neutral-400 bg-white text-neutral-400"
                }`}
              >
                <Icon size={15} />
              </div>
              <span
                className={`text-[12px] font-semibold uppercase tracking-wide mt-2 text-center ${
                  isActive ? "text-[#F27318]" : isPast ? "text-neutral-900" : "text-neutral-400"
                }`}
              >
                {step.label}
              </span>
              <span
                className={`text-[12px] font-semibold mt-0.5 ${
                  isReached ? "text-neutral-600" : "text-neutral-400"
                }`}
              >
                {isReached ? formatShortDate(dates[stepId]) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}