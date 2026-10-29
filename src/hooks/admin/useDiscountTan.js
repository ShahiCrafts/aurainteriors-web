import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import discountApi from "../../api/discountApi";
import { scopedAdminKey, adminScope } from "../../lib/adminScope";

export const DISCOUNT_KEYS = {
  all: () => scopedAdminKey("discounts"),
  list: (params) => [...DISCOUNT_KEYS.all(), "list", params],
  detail: (id) => [...DISCOUNT_KEYS.all(), "detail", id],
  applied: () => [...DISCOUNT_KEYS.all(), "applied"],
  validate: (code) => ["discounts", adminScope(), "validate", code],
};
const discountListKey = () => [...DISCOUNT_KEYS.all(), "list"];

export const useDiscounts = (params = {}) => {
  return useQuery({
    queryKey: DISCOUNT_KEYS.list(params),
    queryFn: () => discountApi.getAll(params),
  });
};

// Get single discount (Admin)
export const useDiscount = (id, options = {}) => {
  return useQuery({
    queryKey: DISCOUNT_KEYS.detail(id),
    queryFn: () => discountApi.getById(id),
    enabled: !!id,
    ...options,
  });
};

// Create discount (Admin)
export const useCreateDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => discountApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountListKey() });
    },
  });
};

// Update discount (Admin)
export const useUpdateDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => discountApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: discountListKey() });
      queryClient.invalidateQueries({ queryKey: DISCOUNT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: DISCOUNT_KEYS.applied() });
    },
  });
};

// Delete discount (Admin)
export const useDeleteDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => discountApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountListKey() });
      queryClient.invalidateQueries({ queryKey: DISCOUNT_KEYS.applied() });
    },
  });
};

// Apply discount to cart (User)
export const useApplyDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code) => discountApi.apply(code),
    onSuccess: (data) => {
      queryClient.setQueryData(DISCOUNT_KEYS.applied(), data);
    },
  });
};

// Validate discount code (User)
export const useValidateDiscount = (code, options = {}) => {
  return useQuery({
    queryKey: DISCOUNT_KEYS.validate(code),
    queryFn: () => discountApi.validate(code),
    enabled: !!code && code.length >= 3,
    ...options,
  });
};

// Get currently applied discount from cache
export const useAppliedDiscount = () => {
  const queryClient = useQueryClient();
  return queryClient.getQueryData(DISCOUNT_KEYS.applied());
};

// Clear applied discount
export const useClearAppliedDiscount = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({ queryKey: DISCOUNT_KEYS.applied() });
  };
};

export const usePreviewDiscount = () =>
  useMutation({ mutationFn: discountApi.preview });
