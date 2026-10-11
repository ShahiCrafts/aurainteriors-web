import useAuthStore from "../../store/authStore";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import wishlistApi from "../../api/wishlistApi";

const WISHLIST_KEYS = {
  all: ['wishlist'],
  list: () => [...WISHLIST_KEYS.all, 'list', useAuthStore.getState().user?._id || 'guest'],
  check: (productId) => [...WISHLIST_KEYS.all, 'check', productId, useAuthStore.getState().user?._id || 'guest'],
};

// Get user's wishlist.
// staleTime: 5 min — all ProductCard instances subscribe to this same query
// key, so one network request serves the entire page. Without staleTime every
// remount would refetch even though the data is still fresh.
export const useWishlist = (options = {}) => {
  const userId = useAuthStore(state => state.user?._id);
  return useQuery({
    queryKey: [...WISHLIST_KEYS.all, 'list', userId || 'guest'],
    queryFn: () => wishlistApi.getWishlist(),
    staleTime: 5 * 60 * 1000,
    ...options,
    enabled: !!userId && options.enabled !== false,
  });
};

// Check if product is in wishlist
export const useCheckWishlist = (productId, options = {}) => {
  const userId = useAuthStore(state => state.user?._id);
  return useQuery({
    queryKey: [...WISHLIST_KEYS.all, 'check', productId, userId || 'guest'],
    queryFn: () => wishlistApi.checkWishlist(productId),
    ...options,
    enabled: !!userId && !!productId && options.enabled !== false,
  });
};

// Add product to wishlist
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId) => wishlistApi.addToWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.all });
    },
  });
};

// Remove product from wishlist
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId) => wishlistApi.removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.all });
    },
  });
};

// Clear entire wishlist
export const useClearWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => wishlistApi.clearWishlist(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.all });
    },
  });
};
