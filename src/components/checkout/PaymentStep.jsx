import { Banknote, Check } from "lucide-react";
import useCheckoutStore from "../../store/checkoutStore";

export default function PaymentStep() {
  const { paymentMethod, setPaymentMethod } = useCheckoutStore();

  return (
    <div className="space-y-8 font-dm-sans">

      {/* Payment Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* eSewa Option */}
        <button
          type="button"
          onClick={() => setPaymentMethod("esewa")}
          className={`relative flex items-center gap-4 p-5 rounded-xl border transition-all duration-300 text-left ${
            paymentMethod === "esewa"
              ? "border-[#60BB46] bg-[#F3FBF1] ring-1 ring-[#60BB46]/20"
              : "border-neutral-200 bg-white hover:border-neutral-300"
          }`}
        >
          <div className="w-14 h-14 flex items-center justify-center shrink-0">
            <img
              src="https://cdn.brandfetch.io/idDVuHZ3OK/w/600/h/600/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1751351358039"
              alt="eSewa"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-semibold text-[#1A1714]">
              eSewa Digital Wallet
            </p>
            <p className="text-[14px] text-neutral-400 mt-0.5">
              Fast and secure mobile payment
            </p>
          </div>

          {paymentMethod === "esewa" && (
            <div className="w-5 h-5 rounded-full bg-[#60BB46] flex items-center justify-center shrink-0">
              <Check size={12} className="text-white" strokeWidth={4} />
            </div>
          )}
        </button>

        {/* Cash on Delivery Option */}
        <button
          type="button"
          onClick={() => setPaymentMethod("cod")}
          className={`relative flex items-center gap-4 p-5 rounded-xl border transition-all duration-300 text-left ${
            paymentMethod === "cod"
              ? "border-[#F27318] bg-[#FFF8F2] ring-1 ring-[#F27318]/20"
              : "border-neutral-200 bg-white hover:border-neutral-300"
          }`}
        >
          <div
  className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
    paymentMethod === "cod"
      ? "bg-[#F27318] text-white"
      : "bg-neutral-100 text-neutral-400"
  }`}
>
  <Banknote size={20} strokeWidth={2.2} />
</div>

          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-semibold text-[#1A1714]">
              Cash on Delivery
            </p>
            <p className="text-[14px] text-neutral-400 mt-0.5">
              Pay when your order arrives at your door
            </p>
          </div>

          {paymentMethod === "cod" && (
            <div className="w-5 h-5 rounded-full bg-[#F27318] flex items-center justify-center shrink-0">
              <Check size={12} className="text-white" strokeWidth={4} />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}