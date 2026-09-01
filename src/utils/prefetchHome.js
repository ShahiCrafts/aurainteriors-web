/**
 * Prefetch utility for home page data
 * Phase 2c: Prefetch data before component mounts to avoid waterfalls
 * 
 * Usage:
 *   useEffect(() => {
 *     prefetchHomeData(queryClient);
 *   }, [queryClient]);
 */

export const prefetchHomeData = async (queryClient) => {
  if (!queryClient) return;

  try {
    // Import here to avoid circular dependencies
    const { useProducts } = await import('../hooks/product/useProductTan');
    const { useCategoryTree } = await import('../hooks/product/useCategoryTan');
    
    // Prefetch categories (tree structure for home page)
    // This starts the fetch immediately so it arrives by the time user scrolls
    queryClient.prefetchQuery({
      queryKey: ['categories', 'tree'],
      queryFn: async () => {
        const response = await fetch('/api/v1/categories?tree=true');
        return response.json();
      },
      staleTime: 10 * 60 * 1000, // 10 min cache
    });

    // Prefetch featured products for home page
    // These load when user scrolls, but prefetch gets a head start
    queryClient.prefetchQuery({
      queryKey: ['products', 'list', { limit: 12, sort: '-isFeatured,-createdAt', status: 'active' }],
      queryFn: async () => {
        const response = await fetch(
          '/api/v1/products?limit=12&sort=-isFeatured,-createdAt&status=active'
        );
        return response.json();
      },
      staleTime: 10 * 60 * 1000, // 10 min cache
    });
  } catch (error) {
    console.debug('Prefetch error (non-critical):', error.message);
    // Silently fail - prefetch is optional optimization, not critical path
  }
};

/**
 * Prefetch on route transition
 * Phase 2c: Start prefetch when user hovers over home link or navigates to home
 * 
 * Usage in Link component:
 *   <Link 
 *     to="/" 
 *     onMouseEnter={() => prefetchHomeOnHover(queryClient)}
 *   >Home</Link>
 */
export const prefetchHomeOnHover = (queryClient) => {
  // Defer prefetch to avoid blocking interaction
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => prefetchHomeData(queryClient), { timeout: 2000 });
  } else {
    // Fallback for older browsers
    setTimeout(() => prefetchHomeData(queryClient), 100);
  }
};
