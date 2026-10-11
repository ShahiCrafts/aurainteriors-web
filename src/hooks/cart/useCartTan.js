import useAuthStore from "../../store/authStore";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import cartApi from "../../api/cartApi";

const CART_KEYS = {
  all: ['cart'],
  list: () => [...CART_KEYS.all, 'list', useAuthStore.getState().user?._id || 'guest'],
};

export const useCart = (options = {}) => {
  const userId = useAuthStore(state => state.user?._id);
  return useQuery({
    queryKey: [...CART_KEYS.all, 'list', userId || 'guest'],
    queryFn: () => cartApi.getCart(),
    ...options,
    enabled: !!userId && options.enabled !== false,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => cartApi.addToCart(data),
    onSuccess: () => {
      // Refetch to sync with server (ensures accurate prices, images, etc.)
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
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
