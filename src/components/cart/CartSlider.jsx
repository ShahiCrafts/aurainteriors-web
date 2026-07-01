import { Link } from "react-router-dom";
import { X, ShoppingBag, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { useEffect } from "react";
import {
  useCart,
  useUpdateCartItem,
  useRemoveFromCart,
} from "../../hooks/cart/useCartTan";
import useAuthStore from "../../store/authStore";
import useGuestCartStore from "../../store/guestCartStore";
import { toast } from "react-toastify";
import { getProductImageUrl } from "../../utils/imageUrl";
import formatError from "../../utils/errorHandler";

export default function CartSlider({ isOpen, onClose }) {
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading } = useCart({ enabled: isAuthenticated });
  const { mutate: updateCartItem, isPending: isUpdating } = useUpdateCartItem();
  const { mutate: removeFromCart, isPending: isRemoving } = useRemoveFromCart();

  const {
    items: guestCartItems,
    updateItemQuantity: updateGuestCartQuantity,
    removeItem: removeGuestCartItem,
    getCartTotals: getGuestCartTotals,
  } = useGuestCartStore();

  const cart = data?.data?.cart;
  const cartItems = isAuthenticated ? cart?.items || [] : guestCartItems;
  const guestTotals = getGuestCartTotals();
  const totalItems = isAuthenticated
    ? cart?.totalItems || 0
    : guestTotals.itemCount;
  const subtotal = isAuthenticated ? cart?.subtotal || 0 : guestTotals.subtotal;

  const getImageUrl = (product) => getProductImageUrl(product);

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    if (!isAuthenticated) {
      updateGuestCartQuantity(itemId, newQuantity);
      return;
    }

    updateCartItem(
      { itemId, quantity: newQuantity },
      {
        onError: (err) => toast.error(formatError(err, "Failed to update quantity")),
      }
    );
  };

  useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }

  return () => {
    document.body.style.overflow = "";
  };
}, [isOpen]);

  const handleRemoveItem = (itemId) => {
    if (!isAuthenticated) {
      removeGuestCartItem(itemId);
      toast.success("Item removed from cart");
      return;
    }

    removeFromCart(itemId, {
      onSuccess: () => toast.success("Item removed from cart"),
      onError: (err) => toast.error(formatError(err, "Failed to remove item")),
    });
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[100] bg-black/40 h-[100vh] transition-opacity duration-300 ${
      isOpen
        ? "opacity-100 visible pointer-events-auto"
        : "opacity-0 invisible pointer-events-none"
    }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 z-[101] h-full w-full sm:max-w-[480px] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col font-sans ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex items-start justify-between px-6 py-6 border-b border-gray-100 bg-white">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[8px] bg-[#F27318]/10 flex items-center justify-center shrink-0">
              <ShoppingBag size={20} className="text-[#F27318]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  Your Cart
                </h2>
                <span className="text-[12px] font-bold text-white bg-[#F27318] px-2 py-0.5 rounded-[4px]">
                  {totalItems}
                </span>
              </div>
              <p className="text-[13px] text-gray-500">
                You're just a few steps away from your new space.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition-colors rounded-[8px]"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/30">
          {isAuthenticated && isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={28} className="text-[#F27318] animate-spin" />
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-[8px] mb-6">
                <ShoppingBag size={28} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Your Cart is Empty
              </h3>
              <p className="text-[14px] text-gray-500 mb-8 max-w-[280px]">
                Looks like you haven't added any items yet. Start exploring our premium collection.
              </p>
              <button 
                onClick={onClose}
                className="bg-[#F27318] text-white px-8 py-3 font-bold text-[14px] rounded-[8px] hover:bg-[#D9620E] transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              {cartItems.map((item) => {
                const product = item.product;
                if (!product) return null;

                return (
                  <div
                    key={item._id}
                    className="flex gap-5 bg-white p-4 border border-gray-100 shadow-sm rounded-[8px]"
                  >
                    <Link
                      to={`/product/${product.slug || product._id}`}
                      onClick={onClose}
                      className="w-[84px] h-[84px] shrink-0 rounded-[8px] overflow-hidden bg-gray-100"
                    >
                      <img
                        src={getImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <Link
                            to={`/product/${product.slug || product._id}`}
                            onClick={onClose}
                            className="flex-1 min-w-0"
                          >
                            <h4 className="text-[15px] font-bold text-gray-900 leading-tight hover:text-[#F27318] transition-colors line-clamp-2">
                              {product.name}
                            </h4>
                          </Link>
                          <button
                            onClick={() => handleRemoveItem(item._id)}
                            disabled={isRemoving}
                            className="w-7 h-7 shrink-0 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 rounded-[6px]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {product.category?.name && (
                          <p className="text-[11px] font-bold text-[#F27318] tracking-widest uppercase">
                            {product.category.name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-end justify-between mt-3">
                        <div className="flex items-center border border-gray-200 rounded-[6px] overflow-hidden bg-white">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item._id, item.quantity - 1)
                            }
                            disabled={isUpdating || item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-black disabled:opacity-40 transition-colors"
                          >
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                          <span className="w-8 h-8 flex items-center justify-center text-[13px] font-bold text-gray-900 border-x border-gray-200 bg-gray-50/50">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item._id, item.quantity + 1)
                            }
                            disabled={isUpdating}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-black disabled:opacity-40 transition-colors"
                          >
                            <Plus size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                        <p className="text-[15px] font-bold text-gray-900">
                          NRs. {(product.price * item.quantity)?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[15px] font-bold text-gray-500 uppercase tracking-wide">
                Subtotal
              </span>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">
                NRs. {subtotal.toLocaleString()}
              </span>
            </div>

            <p className="text-[13px] text-gray-500 mb-5">
              Shipping and taxes calculated at checkout.
            </p>

            <Link
              to="/checkout"
              onClick={onClose}
              className="w-full flex items-center justify-center py-4 bg-[#F27318] hover:bg-[#D9620E] text-white text-[15px] font-bold rounded-[8px] transition-all duration-200 shadow-sm"
            >
              Proceed to Checkout
            </Link>

            <button
              onClick={onClose}
              className="w-full flex items-center justify-center mt-3 py-3 text-[14px] font-bold text-gray-500 hover:text-black transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
