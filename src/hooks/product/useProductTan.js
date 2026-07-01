import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import productApi from '../../api/productApi';

const PRODUCT_KEYS = {
  all: ['products'],
  list: (params) => [...PRODUCT_KEYS.all, 'list', params],
  detail: (id) => [...PRODUCT_KEYS.all, 'detail', id],
  featured: (limit) => [...PRODUCT_KEYS.all, 'featured', limit],
  newArrivals: (limit) => [...PRODUCT_KEYS.all, 'newArrivals', limit],
  related: (id, limit) => [...PRODUCT_KEYS.all, 'related', id, limit],
};

// Get all products with filtering.
// `options` is an optional second argument for passing React Query options
// (e.g. { enabled: false }) without touching the hook's core logic.
// All existing callers that omit `options` are unaffected.
export const useProducts = (params = {}, options = {}) => {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(params),
    queryFn: () => productApi.getAll(params),
    // Search results: shorter staleTime so they feel fresh. Product listings
    // (shop page, featured): inherits the 5-min global default unless overridden.
    staleTime: params.search ? 30 * 1000 : undefined, // 30s for search, global default otherwise
    ...options,
  });
};

// Get single product
export const useProduct = (id, options = {}) => {
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(id),
    queryFn: () => productApi.getById(id),
    enabled: !!id,
    ...options,
  });
};

// Get featured products
export const useFeaturedProducts = (limit = 8) => {
  return useQuery({
    queryKey: PRODUCT_KEYS.featured(limit),
    queryFn: () => productApi.getFeatured(limit),
    // Featured products rarely change — keep cached for 10 min.
    staleTime: 10 * 60 * 1000,
  });
};

// Get new arrivals
export const useNewArrivals = (limit = 8) => {
  return useQuery({
    queryKey: PRODUCT_KEYS.newArrivals(limit),
    queryFn: () => productApi.getNewArrivals(limit),
    // New arrivals update at most a few times per day.
    staleTime: 10 * 60 * 1000,
  });
};

// Get related products
export const useRelatedProducts = (id, limit = 4) => {
  return useQuery({
    queryKey: PRODUCT_KEYS.related(id, limit),
    queryFn: () => productApi.getRelated(id, limit),
    enabled: !!id,
  });
};

// Create product mutation
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
};

// Update product mutation
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => productApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(id) });
    },
  });
};

// Delete product mutation
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
};

// Hard delete product mutation
export const useHardDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => productApi.hardDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
};

// Set primary image mutation
export const useSetPrimaryImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, imageId }) => productApi.setPrimaryImage(productId, imageId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(productId) });
    },
  });
};

// Update stock mutation
export const useUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stock }) => productApi.updateStock(id, stock),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(id) });
    },
  });
};
