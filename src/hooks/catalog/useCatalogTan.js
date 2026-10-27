import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import catalogApi from "../../api/catalogApi";
import categoryApi from "../../api/categoryApi";
import productApi from "../../api/productApi";

// Phase 6 (catalog) — React Query hooks for the catalog registries
// (product types, rooms, collections, attribute definitions), the
// attribute resolution reads, category attribute assignments,
// category reorder, and product variants.
//
// Invalidation follows the FE-55 rule used by the other hook
// modules: invalidate the narrowest keys that changed — the
// resource's own list/detail keys, plus the resolution keys whose
// inputs changed (a definition or assignment change can alter any
// category's resolved set, so resolution keys are invalidated as a
// family; they are cheap public reads).

export const CATALOG_KEYS = {
  productTypes: ["catalog", "product-types"],
  productType: (key) => ["catalog", "product-types", key],
  rooms: ["catalog", "rooms"],
  collections: ["catalog", "collections"],
  collection: (slug) => ["catalog", "collections", slug],
  attributeDefinitions: ["catalog", "attribute-definitions"],
  categoryAttributes: (ref) => ["catalog", "category-attributes", ref],
  productTypeAttributes: (key) => ["catalog", "product-type-attributes", key],
  categoryAssignments: (id) => ["categories", "assignments", id],
  productVariants: (id) => ["products", "variants", id],
  schema: ["catalog", "schema"],
};

// ── Public schema (Phase 7 storefront) ───────────────────────────
// Attribute definitions for variant option labels + specification
// rendering on the product page. A slow-changing registry read, so
// it rides the global staleTime.
export const useCatalogSchema = (options = {}) =>
  useQuery({
    queryKey: CATALOG_KEYS.schema,
    queryFn: () => catalogApi.getSchema(),
    ...options,
  });

const invalidateResolutions = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ["catalog", "category-attributes"] });
  queryClient.invalidateQueries({ queryKey: ["catalog", "product-type-attributes"] });
};

// ── Product types ────────────────────────────────────────────────

export const useProductTypes = (options = {}) =>
  useQuery({
    queryKey: CATALOG_KEYS.productTypes,
    queryFn: () => catalogApi.listProductTypes(),
    ...options,
  });

export const useCreateProductType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => catalogApi.createProductType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.productTypes });
    },
  });
};

export const useUpdateProductType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, data }) => catalogApi.updateProductType(key, data),
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.productTypes });
      queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.productType(key) });
      // A type's attributeKeys/assignments feed resolution.
      invalidateResolutions(queryClient);
    },
  });
};

export const useDeleteProductType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key) => catalogApi.deleteProductType(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.productTypes });
    },
  });
};

// ── Rooms ────────────────────────────────────────────────────────

export const useRooms = (options = {}) =>
  useQuery({
    queryKey: CATALOG_KEYS.rooms,
    queryFn: () => catalogApi.listRooms(),
    ...options,
  });

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => catalogApi.createRoom(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.rooms }),
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }) => catalogApi.updateRoom(slug, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.rooms }),
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug) => catalogApi.deleteRoom(slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.rooms }),
  });
};

// ── Collections ──────────────────────────────────────────────────

export const useCollections = (options = {}) =>
  useQuery({
    queryKey: CATALOG_KEYS.collections,
    queryFn: () => catalogApi.listCollections(),
    ...options,
  });

export const useCollection = (slug, params = {}, options = {}) =>
  useQuery({
    queryKey: [...CATALOG_KEYS.collection(slug), params],
    queryFn: () => catalogApi.getCollection(slug, params),
    enabled: !!slug,
    ...options,
  });

export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => catalogApi.createCollection(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.collections }),
  });
};

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }) => catalogApi.updateCollection(slug, data),
    onSuccess: (_, { slug }) => {
      queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.collections });
      queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.collection(slug) });
    },
  });
};

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug) => catalogApi.deleteCollection(slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.collections }),
  });
};

// ── Attribute definitions ────────────────────────────────────────

export const useAttributeDefinitions = (options = {}) =>
  useQuery({
    queryKey: CATALOG_KEYS.attributeDefinitions,
    queryFn: () => catalogApi.listAttributeDefinitions(),
    ...options,
  });

export const useCreateAttributeDefinition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => catalogApi.createAttributeDefinition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.attributeDefinitions });
      invalidateResolutions(queryClient);
    },
  });
};

export const useUpdateAttributeDefinition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, data }) => catalogApi.updateAttributeDefinition(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.attributeDefinitions });
      invalidateResolutions(queryClient);
    },
  });
};

export const useDeleteAttributeDefinition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, hard }) => catalogApi.deleteAttributeDefinition(key, { hard }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.attributeDefinitions });
      invalidateResolutions(queryClient);
    },
  });
};

// ── Attribute resolution reads ───────────────────────────────────

export const useCategoryAttributes = (ref, options = {}) =>
  useQuery({
    queryKey: CATALOG_KEYS.categoryAttributes(ref),
    queryFn: () => catalogApi.getCategoryAttributes(ref),
    enabled: !!ref,
    ...options,
  });

export const useProductTypeAttributes = (key, options = {}) =>
  useQuery({
    queryKey: CATALOG_KEYS.productTypeAttributes(key),
    queryFn: () => catalogApi.getProductTypeAttributes(key),
    enabled: !!key,
    ...options,
  });

// ── Category attribute assignments (admin) ───────────────────────

export const useCategoryAssignments = (categoryId, options = {}) =>
  useQuery({
    queryKey: CATALOG_KEYS.categoryAssignments(categoryId),
    queryFn: () => categoryApi.getAttributeAssignments(categoryId),
    enabled: !!categoryId,
    ...options,
  });

export const useSetCategoryAssignments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignments }) => categoryApi.setAttributeAssignments(id, assignments),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.categoryAssignments(id) });
      queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.categoryAttributes(id) });
    },
  });
};

// ── Category reorder ─────────────────────────────────────────────

export const useReorderCategories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => categoryApi.reorder(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", "list"] });
      queryClient.invalidateQueries({ queryKey: ["categories", "tree"] });
    },
  });
};

// ── Product variants ─────────────────────────────────────────────

export const useProductVariants = (productId, options = {}) =>
  useQuery({
    queryKey: CATALOG_KEYS.productVariants(productId),
    queryFn: () => productApi.getVariants(productId),
    enabled: !!productId,
    ...options,
  });

const invalidateVariants = (queryClient, productId) => {
  queryClient.invalidateQueries({ queryKey: CATALOG_KEYS.productVariants(productId) });
  // The product's hasVariants/priceFrom ride the product payloads.
  queryClient.invalidateQueries({ queryKey: ["products", "list"] });
  queryClient.invalidateQueries({ queryKey: ["products", "detail", productId] });
};

export const useCreateVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }) => productApi.createVariant(productId, data),
    onSuccess: (_, { productId }) => invalidateVariants(queryClient, productId),
  });
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId, data }) => productApi.updateVariant(productId, variantId, data),
    onSuccess: (_, { productId }) => invalidateVariants(queryClient, productId),
  });
};

export const useDeleteVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId }) => productApi.deleteVariant(productId, variantId),
    onSuccess: (_, { productId }) => invalidateVariants(queryClient, productId),
  });
};
