import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import cartApi from "../../api/cartApi";

const CART_KEYS = {
  all: ['cart'],
  list: () => [...CART_KEYS.all, 'list'],
};

export const useCart = (options = {}) => {
  return useQuery({
    queryKey: CART_KEYS.list(),
    queryFn: () => cartApi.getCart(),
    ...options,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => cartApi.addToCart(data),
    // OPTIMIZATION: Optimistic updates for "add to cart"
    // Phase 2b: Makes "add to cart" feel instant (0-5ms perceived vs 500ms waiting for server)
    onMutate: async (newItem) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: CART_KEYS.all });

      // Snapshot the previous value for rollback on error
      const previousCart = queryClient.getQueryData(CART_KEYS.list());

      // Optimistically update the cache with the new item
      queryClient.setQueryData(CART_KEYS.list(), (old) => {
        if (!old) return old;

        const cartCopy = JSON.parse(JSON.stringify(old));
        
        // Check if item already exists
        const existingItemIndex = cartCopy.data.cart.items.findIndex(
          (item) =>
            item.product._id === newItem.productId &&
            JSON.stringify(item.variant) === JSON.stringify(newItem.variant || {})
        );

        if (existingItemIndex > -1) {
          // Increment quantity
          cartCopy.data.cart.items[existingItemIndex].quantity += (newItem.quantity || 1);
        } else {
          // Add new item (simplified - use minimal product data since we don't have full product)
          cartCopy.data.cart.items.push({
            _id: Math.random().toString(36), // Temporary ID
            product: { _id: newItem.productId }, // Minimal product data
            quantity: newItem.quantity || 1,
            variant: newItem.variant || {},
            addedAt: new Date(),
          });
        }

        // Recalculate totals
        cartCopy.data.cart.totalItems = cartCopy.data.cart.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        return cartCopy;
      });

      return { previousCart };
    },
    onSuccess: () => {
      // Refetch to sync with server (ensures accurate prices, images, etc.)
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    },
    onError: (err, newItem, context) => {
      // Rollback to previous value on error
      if (context?.previousCart) {
        queryClient.setQueryData(CART_KEYS.list(), context.previousCart);
      }
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => cartApi.updateCartItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId) => cartApi.removeFromCart(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    },
  });
};
