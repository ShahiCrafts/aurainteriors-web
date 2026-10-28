import useAuthStore from "../../store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import orderApi from "../../api/orderApi";

const ORDER_KEYS = {
  all: ["orders"],
  myOrders: (params) => [...ORDER_KEYS.all, "my", params],
  detail: (id) => [...ORDER_KEYS.all, "detail", id],
  admin: (params) => [...ORDER_KEYS.all, "admin", params],
};

// Guest checkout
export const useGuestCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => orderApi.guestCheckout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
};

// Authenticated checkout
export const useCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => orderApi.checkout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
};

// Track order (guest)
export const useTrackOrder = () => {
  return useMutation({
    mutationFn: (data) => orderApi.trackOrder(data),
  });
};

// Get my orders
export const useMyOrders = (params = {}, options = {}) => {
  const userId = useAuthStore((state) => state.user?._id);
  return useQuery({
    queryKey: [...ORDER_KEYS.myOrders(params), userId || "guest"],
    queryFn: () => orderApi.getMyOrders(params),
    ...options,
    enabled: !!userId && options.enabled !== false,
  });
};

// Get single order
export const useOrder = (id, options = {}) => {
  const userId = useAuthStore((state) => state.user?._id);
  return useQuery({
    queryKey: [...ORDER_KEYS.detail(id), userId || "guest"],
    queryFn: () => orderApi.getOrder(id),
    ...options,
    enabled: !!userId && !!id && options.enabled !== false,
  });
};

// ========== ADMIN HOOKS ==========

export const useAllOrders = (params = {}, options = {}) => {
  const userId = useAuthStore((state) => state.user?._id);
  return useQuery({
    queryKey: [...ORDER_KEYS.admin(params), userId || "guest"],
    queryFn: () => orderApi.getAllOrders(params),
    ...options,
    enabled: !!userId && options.enabled !== false,
  });
};

export const useOrderAdmin = (id, options = {}) => {
  const userId = useAuthStore((state) => state.user?._id);
  return useQuery({
    queryKey: [...ORDER_KEYS.all, "admin-detail", id, userId || "guest"],
    queryFn: () => orderApi.getOrderAdmin(id),
    ...options,
    enabled: !!userId && !!id && options.enabled !== false,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => orderApi.updateOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => orderApi.cancelOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

// Request return (user)
export const useRequestReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => orderApi.requestReturn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
};

// Process return request (admin)
export const useProcessReturnRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => orderApi.processReturnRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
};
