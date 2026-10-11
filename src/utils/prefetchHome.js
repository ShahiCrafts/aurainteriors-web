import categoryApi from "../api/categoryApi";
import productApi from "../api/productApi";

export const prefetchHomeData = async (queryClient) => {
  if (!queryClient) return;
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["categories", "tree"], queryFn: () => categoryApi.getTree(), staleTime: 10 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ["products", "list", { limit: 12, sort: "-isFeatured,-createdAt", status: "active" }],
      queryFn: () => productApi.getAll({ limit: 12, sort: "-isFeatured,-createdAt", status: "active" }), staleTime: 10 * 60 * 1000,
    }),
  ]);
};

export const prefetchHomeOnHover = (queryClient) => {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(() => prefetchHomeData(queryClient), { timeout: 2000 });
  } else setTimeout(() => prefetchHomeData(queryClient), 100);
};
