import { useQuery } from "@tanstack/react-query";
import productApi from "../../api/productApi";

export const useArCatalogProducts = (options = {}) => {
  return useQuery({
    queryKey: ["products", "ar-catalog"],
    queryFn: async () => {
      const params = { limit: 100, status: "active" };
      const first = await productApi.getAll({ ...params, page: 1 });
      const pages = Math.max(1, first?.data?.pagination?.pages || 1);
      const products = [...(first?.data?.products || [])];
      for (let page = 2; page <= pages; page += 1) {
        const res = await productApi.getAll({ ...params, page });
        products.push(...(res?.data?.products || []));
      }
      return {
        ...first,
        data: { ...(first?.data || {}), products },
      };
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export default useArCatalogProducts;
