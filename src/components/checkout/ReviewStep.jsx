import {
  MapPin,
  CreditCard,
  Package,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import useCheckoutStore from "../../store/checkoutStore";
import { useCart } from "../../hooks/cart/useCartTan";
import useAuthStore from "../../store/authStore";
import useGuestCartStore from "../../store/guestCartStore";
import { getProductImageUrl } from "../../utils/imageUrl";

export default function ReviewStep() {
  const {
    guestInfo,
    shippingAddress,
    paymentMethod,
    appliedDiscount,
    customerNote,
    setCustomerNote,
  } = useCheckoutStore();

  const { isAuthenticated } = useAuthStore();
  const { data: cartData } = useCart({ enabled: isAuthenticated });
  const { items: guestCartItems, getCartTotals: getGuestCartTotals } =
    useGuestCartStore();

  const cart = cartData?.data?.cart;
  const guestTotals = getGuestCartTotals();
  const items = isAuthenticated ? cart?.items || [] : guestCartItems;
  const subtotal = isAuthenticated ? cart?.subtotal || 0 : guestTotals.subtotal;
  const discountAmount = appliedDiscount?.amount || 0;
  const shippingCost = 0;
  const total = subtotal - discountAmount + shippingCost;

  const getImageUrl = (product) => getProductImageUrl(product);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-neutral-900 font-playfair flex items-center gap-2">
        <ClipboardCheck size={20} className="text-[#F27318]" />
        Review Your Order
      </h2>

      <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-medium text-neutral-700 font-lato flex items-center gap-2">
          <Package size={16} />
          Contact Information
        </h3>
        <p className="text-neutral-900 font-lato">
          {guestInfo.firstName} {guestInfo.lastName}
        </p>
        <p className="text-sm text-neutral-600 font-lato">
          {guestInfo.email}
        </p>
        <p className="text-sm text-neutral-600 font-lato">
          {guestInfo.phone}
        </p>
      </div>

      <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-medium text-neutral-700 font-lato flex items-center gap-2">
          <MapPin size={16} />
          Shipping Address
        </h3>
        <p className="text-neutral-900 font-lato">
          {shippingAddress.fullName}
        </p>
        <p className="text-sm text-neutral-600 font-lato">
          {shippingAddress.addressLine1}
        </p>
        {shippingAddress.addressLine2 && (
          <p className="text-sm text-neutral-600 font-lato">
            {shippingAddress.addressLine2}
          </p>
        )}
        <p className="text-sm text-neutral-600 font-lato">
          {shippingAddress.city}
          {shippingAddress.state && `, ${shippingAddress.state}`},{" "}
          {shippingAddress.postalCode}
        </p>
        <p className="text-sm text-neutral-600 font-lato">
          {shippingAddress.country}
        </p>
        <p className="text-sm text-neutral-600 font-lato">
          Phone: {shippingAddress.phone}
        </p>
      </div>

      <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-medium text-neutral-700 font-lato flex items-center gap-2">
          <CreditCard size={16} />
          Payment Method
        </h3>
        <p className="text-neutral-900 font-lato">
          {paymentMethod === "cod"
            ? "Cash on Delivery"
            : "eSewa Digital Wallet"}
        </p>
        {paymentMethod === "esewa" && (
          <p className="text-sm text-neutral-500 font-lato">
            You will be redirected to eSewa after placing order
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-neutral-700 font-lato">
          Order Items ({items.length})
        </h3>
        <div className="divide-y divide-neutral-100">
          {items.map((item) => {
            const product = item.product || {};
            const price = product.salePrice || product.price || 0;

            return (
              <div key={item._id || item.productId} className="flex gap-4 py-3">
                <img
                  src={getImageUrl(product)}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 font-lato truncate">
                    {product.name}
                  </p>
                  {item.variant && Object.keys(item.variant).length > 0 && (
                    <p className="text-sm text-neutral-500 font-lato">
                      {Object.entries(item.variant)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ")}
                    </p>
                  )}
                  <p className="text-sm text-neutral-600 font-lato">
                    Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-medium text-neutral-900 font-lato">
                  NRs. {(price * item.quantity).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-neutral-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm font-lato">
          <span className="text-neutral-600">Subtotal</span>
          <span className="text-neutral-900">
            NRs. {subtotal.toLocaleString()}
          </span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm font-lato">
            <span className="text-[#F27318]">
              Discount ({appliedDiscount.code})
            </span>
            <span className="text-[#F27318]">
              - NRs. {discountAmount.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm font-lato">
          <span className="text-neutral-600">Shipping</span>
          <span className="text-neutral-900">
            {shippingCost === 0
              ? "Free"
              : `NRs. ${shippingCost.toLocaleString()}`}
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t border-neutral-200">
          <span className="text-lg font-semibold text-neutral-900 font-lato">
            Total
          </span>
          <span className="text-xl font-bold text-[#F27318] font-playfair">
            NRs. {total.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-neutral-700 font-lato flex items-center gap-2">
          <FileText size={16} />
          Order Notes (Optional)
        </h3>
        <textarea
          value={customerNote}
          onChange={(e) => setCustomerNote(e.target.value)}
          rows={3}
          placeholder="Any special instructions for your order..."
          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#F27318] focus:ring-2 focus:ring-[#F27318]/20 outline-none font-lato resize-none transition-colors"
        />
      </div>
    </div>
  );
}
