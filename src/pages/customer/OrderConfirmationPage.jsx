import { useParams, Link, useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  Check,
  Package,
  MessageSquare,
  HelpCircle,
  Mail,
} from "lucide-react";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";
import { useTrackOrder } from "../../hooks/order/useOrderTan";
import { toast } from "react-toastify";

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const emailSentParam = searchParams.get("emailSent");

  const [order, setOrder] = useState(null);
  const [mounted, setMounted] = useState(false);
  const toastShownRef = useRef(false);

  const trackOrderMutation = useTrackOrder();

  // Entrance animation trigger (kept subtle, respects reduced motion via CSS)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Show toast notification for email confirmation (only once)
  useEffect(() => {
    if (emailSentParam === "true" && email && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success(`Confirmation email sent to ${email}`);
    }
  }, [emailSentParam, email]);

  // Fetch order details when component mounts
  useEffect(() => {
    if (orderId && email) {
      trackOrderMutation.mutate(
        { orderId, email },
        {
          onSuccess: (data) => {
            setOrder(data.data.order);
          },
        },
      );
    }
  }, [orderId, email]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate estimated delivery (7-10 days from order date)
  const getEstimatedDelivery = () => {
    const baseDate = order?.orderedAt ? new Date(order.orderedAt) : new Date();
    const deliveryDate = new Date(baseDate);
    deliveryDate.setDate(deliveryDate.getDate() + 10);
    return deliveryDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const orderDate = order?.orderedAt
    ? formatDate(order.orderedAt)
    : formatDate(new Date());
  const estimatedDelivery = getEstimatedDelivery();
  const customerEmail =
    order?.guestInfo?.email || email || "your email address";
  const customerName =
    order?.shippingAddress?.fullName ||
    (order?.guestInfo?.firstName
      ? `${order.guestInfo.firstName} ${order.guestInfo.lastName || ""}`.trim()
      : order?.user?.fullName ||
        (order?.user?.firstName
          ? `${order.user.firstName} ${order.user.lastName || ""}`.trim()
          : "Customer"));
  const invoiceNo = orderId ? `INV-${String(orderId).slice(-8).toUpperCase()}` : "N/A";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-dm-sans">
          {/* Seal + Heading */}
          <div
            className={`flex flex-col items-center text-center mb-14 transition-all duration-700 ease-out ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <div className="relative mb-6">
              <span className="absolute inset-0 rounded-full bg-[#F27318]/15 animate-ping-slow" />
              <div className="relative w-16 h-16 rounded-full bg-[#F27318] flex items-center justify-center">
                <Check size={30} strokeWidth={3} className="text-white" />
              </div>
            </div>

            <h1 className="text-[32px] md:text-[44px] font-bold text-[#1A1714] tracking-tight leading-tight">
              Thank you for your{" "}
              <span className="text-[#F27318]">purchase!</span>
            </h1>

            <p className="text-[15px] text-neutral-500 max-w-md mt-3 leading-relaxed">
              We've sent your confirmation to{" "}
              <span className="font-semibold text-neutral-800">
                {customerEmail}
              </span>{" "}
              with the full order details and tracking information.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left: invoice */}
            <div className="lg:col-span-7">
              {order && (
                <div className="border border-neutral-200 rounded-2xl bg-white text-left">
                  {/* Invoice Header — company + invoice meta */}
                  <div className="relative px-7 py-6 border-b border-dashed border-neutral-200">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col gap-1.5">
                        <img
                          src="/logo.png"
                          alt="AuraInteriors Logo"
                          className="h-6 w-auto object-contain self-start"
                        />
                        <p className="text-[15px] text-neutral-700 leading-relaxed max-w-[220px]">
                          Aura Interiors Pvt. Ltd.<br />
                          Lalitpur 44600, Nepal
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block text-[12px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border mb-2 ${
                            order.paymentMethod === "esewa"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}
                        >
                          {order.paymentMethod === "esewa"
                            ? "Paid"
                            : "Payment Pending"}
                        </span>
                        <p className="text-[16px] font-bold text-[#1A1714] uppercase tracking-wide">
                          {order.paymentMethod === "esewa"
                            ? "Invoice / Receipt"
                            : "Proforma Invoice"}
                        </p>
                        <p className="text-[14px] text-neutral-600 font-mono mt-0.5">
                          {invoiceNo}
                        </p>
                      </div>
                    </div>

                    {/* Perforation notches sit exactly on the dashed border */}
                    {/* Left notch: half-circle facing inward, masking the left border */}
                    <div className="absolute -left-[2px] bottom-0 translate-y-1/2 w-[14px] h-[24px] overflow-hidden pointer-events-none">
                      <div className="w-[24px] h-[24px] -ml-[10px] rounded-full border border-neutral-200 bg-white" />
                    </div>
                    {/* Right notch: half-circle facing inward, masking the right border */}
                    <div className="absolute -right-[2px] bottom-0 translate-y-1/2 w-[14px] h-[24px] overflow-hidden pointer-events-none">
                      <div className="w-[24px] h-[24px] rounded-full border border-neutral-200 bg-white" />
                    </div>
                  </div>

                  {/* Bill to / order meta row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-7 py-5 border-b border-neutral-100 text-[14px]">
                    <div className="md:col-span-1">
                      <p className="text-[12px] text-neutral-500 uppercase tracking-wider font-semibold mb-1">
                        Billed To
                      </p>
                      <p className="font-bold text-[#1A1714] text-[16px] leading-snug">
                        {customerName || "Guest Customer"}
                      </p>
                      <p className="text-neutral-600 text-[14px] leading-snug break-all">
                        {customerEmail}
                      </p>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[12px] text-neutral-500 uppercase tracking-wider font-semibold mb-1">
                          Order ID
                        </p>
                        <p className="font-bold text-[#1A1714] text-[15px] break-all leading-snug">
                          #{orderId || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] text-neutral-500 uppercase tracking-wider font-semibold mb-1">
                          Date Issued
                        </p>
                        <p className="font-bold text-[#1A1714] text-[15px] leading-snug">{orderDate}</p>
                      </div>
                      <div>
                        <p className="text-[12px] text-neutral-500 uppercase tracking-wider font-semibold mb-1">
                          Est. Delivery
                        </p>
                        <p className="font-bold text-[#1A1714] text-[15px] leading-snug">{estimatedDelivery}</p>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Body */}
                  <div className="px-7 py-6 space-y-5">
                    {/* Line Items Table */}
                    <div>
                      <div className="grid grid-cols-[1fr_50px_100px] gap-2 px-4 py-3 bg-neutral-100 text-[13px] uppercase tracking-wider font-semibold text-neutral-500">
                        <span>Item</span>
                        <span className="text-center">Qty</span>
                        <span className="text-right">Amount</span>
                      </div>
                      <div className="divide-y divide-neutral-100">
                        {order.items?.map((item, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-[1fr_50px_100px] gap-2 items-start px-4 py-3 text-[16px]"
                          >
                            <div className="pr-2">
                              <p className="font-semibold text-[#1A1714] leading-snug">
                                {item.name}
                              </p>
                              <p className="text-[14px] text-neutral-600 mt-0.5 font-mono tabular-nums">
                                NRs. {item.price?.toLocaleString()} / unit
                              </p>
                            </div>
                            <span className="text-center text-neutral-700 font-mono tabular-nums">
                              {item.quantity}
                            </span>
                            <span className="text-right font-semibold text-[#1A1714] font-mono tabular-nums">
                              {(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="border-t border-dashed border-neutral-200 pt-4 space-y-2.5 text-[16px] text-neutral-600">
                      <div className="flex justify-between items-center text-neutral-500">
                        <span>Subtotal</span>
                        <span className="font-semibold text-[#1A1714] font-mono tabular-nums">
                          NRs. {order.subtotal?.toLocaleString()}
                        </span>
                      </div>

                      {order.tax > 0 && (
                        <div className="flex justify-between items-center text-neutral-500">
                          <span>VAT (13%)</span>
                          <span className="font-semibold text-[#1A1714] font-mono tabular-nums">
                            NRs. {order.tax.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-neutral-500">
                        <span>Shipping</span>
                        <span
                          className={`font-semibold font-mono tabular-nums ${
                            order.shippingCost === 0
                              ? "text-emerald-600"
                              : "text-[#1A1714]"
                          }`}
                        >
                          {order.shippingCost === 0
                            ? "Free"
                            : `NRs. ${order.shippingCost.toLocaleString()}`}
                        </span>
                      </div>

                      {order.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-emerald-600">
                          <span>Discount Applied</span>
                          <span className="font-bold font-mono tabular-nums">
                            -NRs. {order.discountAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Total Amount Due */}
                    <div className="border-t border-dashed border-neutral-200 pt-4 flex justify-between items-center">
                      <span className="uppercase tracking-wide text-[14px] text-neutral-500 font-bold">
                        {order.paymentMethod === "esewa"
                          ? "Total Paid"
                          : "Amount Due"}
                      </span>
                      <span className="text-[#F27318] text-[24px] font-extrabold font-mono tabular-nums">
                        NRs. {order.total?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                </div>
              )}

              {!order && (
                <div className="border border-neutral-200 rounded-2xl bg-white p-10 text-center text-neutral-400 text-[14px]">
                  Loading your order summary…
                </div>
              )}
            </div>

            {/* Right: actions + support */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              <div className="border border-neutral-200 rounded-2xl bg-white p-6">
                <p className="text-[13px] font-bold text-[#1A1714] uppercase tracking-wide mb-4">
                  What's next
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    to="/profile"
                    state={{ activeTab: "orders", searchQuery: orderId }}
                    className="inline-flex items-center justify-center gap-2 px-4 h-12 bg-[#F27318] hover:bg-[#cd5704] text-white text-[14px] font-bold rounded-xl transition-all"
                  >
                    <Package size={16} />
                    Track Your Order
                  </Link>
                  <Link
                    to="/shop"
                    className="inline-flex items-center justify-center gap-2 px-4 h-12 border border-neutral-200 hover:bg-neutral-50 text-[#1A1714] text-[14px] font-bold rounded-xl transition-all"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>

              {/* Support Help */}
              <div className="border border-neutral-200 rounded-2xl bg-white p-6">
                <p className="text-[13px] font-semibold text-neutral-500 mb-4">
                  Need help with your order?
                </p>
                <div className="flex flex-col gap-3 text-[13px] font-semibold">
                  <a
                    href="/contact"
                    className="inline-flex items-center gap-2 text-neutral-600 hover:text-[#F27318] transition-colors"
                  >
                    <MessageSquare size={14} />
                    Contact Support
                  </a>
                  <a
                    href="/faq"
                    className="inline-flex items-center gap-2 text-neutral-600 hover:text-[#F27318] transition-colors"
                  >
                    <HelpCircle size={14} />
                    FAQs
                  </a>
                  <a
                    href="mailto:support@aurainteriors.live"
                    className="inline-flex items-center gap-2 text-neutral-600 hover:text-[#F27318] transition-colors"
                  >
                    <Mail size={14} />
                    Email Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.6; }
          75%, 100% { transform: scale(1.9); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-ping-slow { animation: none; }
        }
      `}</style>
    </>
  );
}