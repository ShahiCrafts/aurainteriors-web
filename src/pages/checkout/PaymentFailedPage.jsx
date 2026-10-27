import { useSearchParams, Link } from "react-router-dom";
import {
  XCircle,
  RefreshCw,
  Home,
  HelpCircle,
  Clock,
  PackageSearch,
} from "lucide-react";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";

// FE-43: the server's eSewa failure redirects
// (controllers/order.controller.js:913-970) send exactly these 8 codes
// in ?error= and nothing else — never an orderId. The error value is
// used ONLY as a lookup key here and is never rendered.
const ERROR_MESSAGES = {
  missing_data: "Payment data was not received properly.",
  invalid_response: "Invalid response from payment gateway.",
  signature_mismatch: "Payment verification failed. Please contact support.",
  order_not_found: "Order not found. Please try again.",
  payment_incomplete: "Payment was not completed.",
  invalid_transaction:
    "The payment transaction was invalid and was rejected by the payment gateway.",
  payment_verification_failed:
    "We could not verify this payment with eSewa. Please check your eSewa statement before trying again.",
};

const GENERIC_MESSAGE = "Something went wrong with your payment.";

// payment_reconciliation_required means the payment state is
// UNRESOLVED and may have succeeded: the customer must NOT be offered
// a pay-again path at all.
const RECONCILIATION_MESSAGE =
  "Your payment is still being verified and may have already gone through. Please do not pay again — paying again could charge you twice. We will confirm the outcome of your payment; if you need help in the meantime, please contact support below.";

export default function PaymentFailedPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  const isReconciliation = error === "payment_reconciliation_required";
  const message = isReconciliation
    ? RECONCILIATION_MESSAGE
    : ERROR_MESSAGES[error] || GENERIC_MESSAGE;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-red-50/50 to-white pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Failed Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            {/* Status Icon */}
            <div
              className={`w-16 h-16 ${
                isReconciliation ? "bg-amber-500" : "bg-red-500"
              } rounded-full flex items-center justify-center mx-auto mb-6`}
            >
              {isReconciliation ? (
                <Clock size={32} className="text-white" strokeWidth={2} />
              ) : (
                <XCircle size={32} className="text-white" strokeWidth={2} />
              )}
            </div>

            {/* Error Message */}
            <h1 className="text-2xl md:text-3xl font-playfair text-neutral-900 mb-2">
              {isReconciliation ? (
                <>
                  Payment <span className="text-amber-500">Being Verified</span>
                </>
              ) : (
                <>
                  Payment <span className="text-red-500">Failed</span>
                </>
              )}
            </h1>
            <p className="text-neutral-600 font-lato mb-8">{message}</p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              {isReconciliation ? (
                <Link
                  to="/track-order"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#F27318] text-white font-medium rounded-xl hover:bg-[#D9620E] transition-colors font-lato"
                >
                  <PackageSearch size={18} />
                  Track Order
                </Link>
              ) : (
                <Link
                  to="/checkout"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#F27318] text-white font-medium rounded-xl hover:bg-[#D9620E] transition-colors font-lato"
                >
                  <RefreshCw size={18} />
                  Try Again
                </Link>
              )}
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-neutral-200 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors font-lato"
              >
                <Home size={18} />
                Go Home
              </Link>
            </div>

            {/* Help Section */}
            <div className="pt-6 border-t border-neutral-200">
              <p className="text-neutral-600 font-lato mb-4">
                Need help with your payment?
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-sm text-[#F27318] hover:text-[#D9620E] font-medium font-lato"
              >
                <HelpCircle size={16} />
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
