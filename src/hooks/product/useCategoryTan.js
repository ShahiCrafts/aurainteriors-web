import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import categoryApi from '../../api/categoryApi';

const CATEGORY_KEYS = {
  all: ["categories"],
  list: (params) => [...CATEGORY_KEYS.all, "list", params],
  tree: () => [...CATEGORY_KEYS.all, "tree"],
  detail: (id) => [...CATEGORY_KEYS.all, "detail", id],
  products: (id, params) => [...CATEGORY_KEYS.all, "products", id, params],
};

// FE-55: mutations invalidate the narrowest keys that changed —
// the list prefix + the category tree (names/hierarchy render in
// nav and admin lists) + the mutated category's detail — never
// CATEGORY_KEYS.all, whose prefix also matched every other
// category's detail and every per-category product list.
const categoryListKey = () => [...CATEGORY_KEYS.all, "list"];

export const useCategories = (params = {}) => {
  return useQuery({
    queryKey: CATEGORY_KEYS.list(params),
    queryFn: () => categoryApi.getAll(params),
  });
};

export const useCategoryTree = (options = {}) => {
  return useQuery({
    queryKey: CATEGORY_KEYS.tree(),
    queryFn: () => categoryApi.getTree(),
    // Categories rarely change. Cache for 10 min so CategoryBar (mounted on
    // every page) never triggers a network request on navigation or tab focus.
    staleTime: 10 * 60 * 1000,
    // FE-32: callers may gate the fetch (e.g. ShopByCategory passes
    // { enabled: isInView } so the request waits for the viewport).
    // Default stays enabled, so existing callers are unaffected.
    ...options,
  });
};

export const useCategory = (id, options = {}) => {
  return useQuery({
    queryKey: CATEGORY_KEYS.detail(id),
    queryFn: () => categoryApi.getById(id),
    enabled: !!id,
    ...options,
  });
};

export const useCategoryProducts = (id, params = {}, options = {}) => {
  return useQuery({
    queryKey: CATEGORY_KEYS.products(id, params),
    queryFn: () => categoryApi.getProducts(id, params),
    enabled: !!id,
    ...options,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => categoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryListKey() });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.tree() });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => categoryApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: categoryListKey() });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.tree() });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.detail(id) });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => categoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryListKey() });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.tree() });
    },
  });
};
