import { useQuery } from "@tanstack/react-query";
import productApi from "../../api/productApi";

// FE-30: the AR picker catalog. The server caps `limit` at 100
// (utils/listQuery boundedLimit), so a single limit:100 request
// silently truncates any catalog larger than one page. This query
// walks every page (sequentially, one page in flight at a time) and
// resolves with the usual getAll response shape whose
// data.products contains the full active catalog.
//
// It is deliberately NOT a rendering gate for the AR entry pages:
// they render and start AR from the directly fetched selected
// product while this catalog streams in behind them.
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
