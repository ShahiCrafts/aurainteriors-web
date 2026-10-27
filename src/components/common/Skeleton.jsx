import React from 'react';

/**
 * Base Shimmer component with smooth linear-gradient animated sweep.
 * Light theme skeleton: bg-gray-100 base with white shimmer overlay.
 * Respects prefers-reduced-motion by falling back to static/pulse block.
 */
export default function Skeleton({
    className = '',
    variant = 'rectangle',
    width,
    height,
    children,
    ...props
}) {
    const baseClasses = 'relative overflow-hidden bg-gray-100 shimmer-element';

    const variantClasses = {
        rectangle: 'rounded-md',
        circle: 'rounded-full',
        text: 'rounded-sm h-4 mb-2 last:mb-0',
        card: 'rounded-xl',
    };

    const style = {
        width: width || undefined,
        height: height || undefined,
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant] || ''} ${className}`}
            style={style}
            {...props}
        >
            {children}
        </div>
    );
}

/* Specialized Skeleton Components matching actual application layouts */

export function CategoryCardSkeleton({ className = '' }) {
    return (
        <div className={`flex flex-col ${className}`}>
            {/* Image area - matches real 160px height */}
            <Skeleton className="w-full rounded-lg" style={{ height: '160px' }} />
            {/* Category name - centered, matches real layout */}
            <Skeleton className="w-3/4 h-4 mx-auto mt-3 mb-2 rounded" />
            {/* Item count - centered, smaller, matches real layout */}
            <Skeleton className="w-1/2 h-3 mx-auto rounded" />
        </div>
    );
}

export function ProductCardSkeleton({ className = '' }) {
    return (
        <div className={`flex flex-col gap-3 sm:gap-4 ${className}`}>
            {/* Image - matches real aspect-[5/3] ratio */}
            <Skeleton className="w-full aspect-[5/3] rounded-lg" />
            
            {/* Category label */}
            <Skeleton className="w-2/3 h-3 rounded" />
            
            {/* Product name - 2 lines for natural appearance */}
            <div className="space-y-1.5">
                <Skeleton className="w-full h-4 rounded" />
                <Skeleton className="w-4/5 h-4 rounded" />
            </div>
            
            {/* Rating - 5 stars + rating number */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="w-3 h-3 rounded-full" />
                </div>
                <Skeleton className="w-8 h-3 rounded" />
            </div>
            
            {/* Price */}
            <Skeleton className="w-1/3 h-5 rounded mt-auto" />
        </div>
    );
}

export function OrderItemSkeleton() {
    return (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            {/* Order Card Header Row Skeleton */}
            <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-5 px-6 py-6">
                {/* Thumbnails Skeleton */}
                <div className="hidden sm:flex items-center -space-x-3 shrink-0">
                    {[0, 1, 2].map((idx) => (
                        <Skeleton
                            key={idx}
                            className="w-12 h-12 rounded-lg border-2 border-white shrink-0"
                            style={{ zIndex: 3 - idx }}
                        />
                    ))}
                </div>

                {/* Order ID + Date Skeleton */}
                <div className="min-w-0 shrink-0">
                    <Skeleton className="w-32 h-5 rounded mb-2" />
                    <Skeleton className="w-40 h-4 rounded" />
                </div>

                {/* Middle: Item Names + Progress Bar Skeleton */}
                <div className="hidden md:flex flex-col justify-center min-w-0 pl-6 border-l border-neutral-100 gap-4">
                    <Skeleton className="w-full h-4 rounded" />
                    <div className="flex items-center gap-2 max-w-[232px]">
                        <Skeleton className="flex-1 h-2 rounded-full" />
                        <Skeleton className="flex-1 h-2 rounded-full" />
                        <Skeleton className="flex-1 h-2 rounded-full" />
                        <Skeleton className="flex-1 h-2 rounded-full" />
                        <Skeleton className="flex-1 h-2 rounded-full" />
                    </div>
                </div>

                {/* Total Price Skeleton */}
                <div className="text-right shrink-0">
                    <Skeleton className="w-16 h-4 rounded mb-2" />
                    <Skeleton className="w-24 h-6 rounded" />
                    <Skeleton className="w-20 h-3 rounded mt-2 lg:hidden" />
                </div>

                {/* Chevron */}
                <div className="flex items-center justify-center shrink-0">
                    <Skeleton className="w-5 h-5 rounded" />
                </div>
            </div>
        </div>
    );
}

export function CartItemSkeleton() {
    return (
        <div className="flex items-center gap-4 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="w-3/4 h-4 rounded" />
                <Skeleton className="w-1/3 h-3 rounded" />
                <Skeleton className="w-1/2 h-5 rounded" />
            </div>
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        </div>
    );
}

export function ReviewSkeleton() {
    return (
        <div className="p-5 bg-neutral-50 dark:bg-neutral-900 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="w-28 h-4 rounded" />
                        <Skeleton className="w-20 h-3 rounded" />
                    </div>
                </div>
                <Skeleton className="w-20 h-4 rounded" />
            </div>
            <Skeleton className="w-full h-4 rounded" />
            <Skeleton className="w-4/5 h-4 rounded" />
        </div>
    );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
    return (
        <div className="w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex gap-4">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className="flex-1 h-4 rounded" />
                ))}
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="px-6 py-4 flex items-center gap-4">
                        {Array.from({ length: cols }).map((_, c) => (
                            <Skeleton key={c} className="flex-1 h-5 rounded" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ChatMessageSkeleton({ isUser = false }) {
    return (
        <div className={`flex gap-3 my-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && <Skeleton className="w-10 h-10 rounded-full shrink-0" />}
            <div className={`flex flex-col gap-2 p-3 rounded-xl max-w-[75%] ${isUser ? 'bg-[#F27318]/10' : 'bg-gray-100'}`}>
                {/* Varied-width lines to mimic natural text wrapping */}
                <Skeleton className="w-48 h-3 rounded" />
                <Skeleton className="w-40 h-3 rounded" />
                <Skeleton className="w-32 h-3 rounded" />
            </div>
            {isUser && <Skeleton className="w-10 h-10 rounded-full shrink-0" />}
        </div>
    );
}

export function AddressSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-neutral-200 flex flex-col h-full">
            {/* Address Card Header */}
            <div className="p-5 flex-1">
                {/* Label & Badge Row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                        <div className="space-y-1 min-w-0">
                            <Skeleton className="w-24 h-4 rounded" />
                            <Skeleton className="w-16 h-3 rounded" />
                        </div>
                    </div>
                    <Skeleton className="w-16 h-6 rounded shrink-0" />
                </div>

                {/* Address Details */}
                <div className="space-y-2 pl-[52px]">
                    <Skeleton className="w-32 h-4 rounded" />
                    <div className="space-y-1.5">
                        <Skeleton className="w-full h-3 rounded" />
                        <Skeleton className="w-4/5 h-3 rounded" />
                    </div>
                    <Skeleton className="w-40 h-3 rounded" />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-4 flex items-center justify-between gap-3 bg-gray-100 rounded-b-xl">
                <Skeleton className="w-24 h-3 rounded" />
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-3 rounded" />
                    <div className="w-px h-3 bg-neutral-200" />
                    <Skeleton className="w-12 h-3 rounded" />
                </div>
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center">
                            <Skeleton className="w-24 h-4 rounded" />
                            <Skeleton className="w-10 h-10 rounded-xl" />
                        </div>
                        <Skeleton className="w-32 h-8 rounded" />
                        <Skeleton className="w-20 h-3 rounded" />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl space-y-4">
                    <Skeleton className="w-40 h-6 rounded" />
                    <Skeleton className="w-full h-64 rounded-xl" />
                </div>
                <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl space-y-4">
                    <Skeleton className="w-32 h-6 rounded" />
                    <Skeleton className="w-full h-64 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

export function WishlistSkeleton() {
    return (
        <div className="h-full flex flex-col space-y-8">
            {/* Header Info */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <Skeleton className="w-32 h-6 rounded mb-2" />
                    <Skeleton className="w-64 h-4 rounded" />
                </div>
                <Skeleton className="w-24 h-6 rounded-full" />
            </div>

            {/* Controls Panel Skeleton */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-neutral-50 p-4 rounded-xl shrink-0">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
                    <Skeleton className="flex-1 max-w-sm h-9 rounded-lg" />
                    <Skeleton className="min-w-[150px] h-9 rounded-lg" />
                    <Skeleton className="min-w-[150px] h-9 rounded-lg" />
                </div>
                <Skeleton className="w-32 h-9 rounded-lg" />
            </div>

            {/* Product Grid Skeleton */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ── Consolidated from components/shop (REUSE-009) ──────────────────────
   ListingCardSkeleton / ProductDetailsSkeleton previously lived in
   shop/ProductLoadingSkeletons.jsx and FilterSidebarSkeleton in
   shop/FilterSidebarSkeleton.jsx. Markup and classes are moved verbatim
   (zero visual change); those files now only re-export from here so the
   one canonical home is this module. */

const ListingBlock = ({ className = "" }) => <div aria-hidden="true" className={`rounded bg-[#F0EFED] motion-safe:animate-pulse ${className}`} />;

export function ListingCardSkeleton({ viewMode = "grid" }) {
  const list = viewMode === "list";
  return (
    <div aria-hidden="true" className={list ? "flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white rounded-lg p-3 sm:p-4 shadow-sm" : "flex flex-col gap-3 sm:gap-4"}>
      <div className={list ? "relative w-full sm:w-40 lg:w-52 shrink-0 aspect-video sm:aspect-auto sm:h-32 lg:h-40 rounded-lg bg-[#F0EFED] motion-safe:animate-pulse" : "relative aspect-[5/3] rounded-lg bg-[#F0EFED] motion-safe:animate-pulse"}>
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="text-[11px] sm:text-[12px] mb-2"><ListingBlock className="h-[1lh] w-20 max-w-full" /></div>
        <div className="text-[13px] sm:text-[15px] mb-2 sm:mb-3"><ListingBlock className="h-[1lh] w-3/4" /></div>
        {list && <div className="text-[11px] sm:text-[13px] leading-snug mb-2 sm:mb-3 space-y-1"><ListingBlock className="h-[1lh] w-full" /><ListingBlock className="h-[1lh] w-4/5" /></div>}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 text-[10px] sm:text-[11px]">
          <div className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <ListingBlock key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />)}</div>
          <ListingBlock className="w-10 h-[1lh]" />
        </div>
        <div className="mt-auto text-[14px] sm:text-[16px] lg:text-[18px]"><ListingBlock className="h-[1lh] w-28 max-w-full" /></div>
      </div>
    </div>
  );
}

export function ProductDetailsSkeleton() {
  return (
    <main className="min-h-screen bg-white pt-4 font-dm-sans pb-32 lg:pb-28" aria-busy="true">
      <span role="status" className="sr-only">Loading product details</span>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
        <nav aria-hidden="true" className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[14px] font-medium mb-5"><ListingBlock className="h-[1lh] w-12" /><ListingBlock className="h-[1lh] w-20" /><ListingBlock className="h-[1lh] w-36" /></nav>
        <div className="flex gap-10 mb-14" aria-hidden="true">
          <div className="flex-[1.2] flex gap-3 justify-end overflow-hidden">
            <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar">{Array.from({ length: 5 }, (_, i) => <ListingBlock key={i} className="shrink-0 w-20 h-20 rounded-lg border-2 border-transparent" />)}</div>
            <div className="space-y-6 flex-1"><ListingBlock className="w-full h-[444px] rounded-xl border border-[#F0EFED]" /></div>
          </div>
          <div className="flex-1 min-w-0">
            <ListingBlock className="w-24 h-6 mb-5" />
            <ListingBlock className="w-4/5 h-9 mb-3" />
            <div className="flex flex-wrap gap-2 mb-4"><ListingBlock className="w-24 h-5" /><ListingBlock className="w-32 h-5" /></div>
            <ListingBlock className="w-44 h-[45px] mb-1.5" />
            <ListingBlock className="w-36 h-5 mb-4" />
            <div className="mb-6 space-y-2"><ListingBlock className="w-full h-[21px]" /><ListingBlock className="w-full h-[21px]" /><ListingBlock className="w-3/4 h-[21px]" /></div>
            <div className="mb-5"><ListingBlock className="w-32 h-[22px] mb-3" /><div className="flex flex-wrap gap-3">{Array.from({ length: 4 }, (_, i) => <ListingBlock key={i} className="w-10 h-10 rounded-full" />)}</div></div>
            <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-5"><ListingBlock className="h-[52px] sm:w-[116px] shrink-0 rounded-lg" /><ListingBlock className="h-[52px] flex-2 rounded-lg" /><ListingBlock className="h-[52px] flex-1 rounded-lg" /></div>
            <div className="flex items-start gap-12 mt-10"><ListingBlock className="w-32 h-5" /><ListingBlock className="w-16 h-5" /></div>
          </div>
        </div>
        <div aria-hidden="true" className="mb-16"><div className="flex gap-8 py-4 border-b border-[#F0EFED]">{Array.from({ length: 4 }, (_, i) => <ListingBlock key={i} className="w-24 h-5" />)}</div><div className="space-y-3 py-6"><ListingBlock className="w-full h-4" /><ListingBlock className="w-full h-4" /><ListingBlock className="w-3/4 h-4" /></div></div>
      </div>
    </main>
  );
}

const FilterBlock = ({ className = "" }) => <div className={`rounded bg-[#F0EFED] motion-safe:animate-pulse ${className}`} />;
const FilterRows = ({ count }) => <div className="space-y-1">{Array.from({ length: count }, (_, i) => <div key={i} className="flex items-center gap-3 py-1.5"><FilterBlock className="w-5 h-5 shrink-0" /><FilterBlock className={`${i % 2 ? "w-24" : "w-32"} max-w-full h-5 flex-1`} /><FilterBlock className="w-4 h-4" /></div>)}</div>;

export function FilterSidebarSkeleton() {
  return <div className="space-y-6" aria-busy="true">
    <span className="sr-only" role="status">Loading filters</span>
    <div aria-hidden="true"><FilterBlock className="w-28 h-5 mb-4" /><FilterRows count={6} /></div>
    <div className="w-full h-px bg-neutral-100" />
    <div aria-hidden="true"><div className="flex items-center justify-between mb-4"><FilterBlock className="w-28 h-5" /><FilterBlock className="w-10 h-4" /></div><div className="flex items-center gap-4 mb-6">{[0, 1].map(i => <div key={i} className="flex-1"><FilterBlock className="w-7 h-[15px] mb-1.5" /><FilterBlock className="w-full h-[34px] rounded-lg" /></div>)}</div><div className="relative h-4"><FilterBlock className="absolute top-1/2 w-full h-1 -translate-y-1/2" /><FilterBlock className="absolute right-1/3 w-4 h-4 rounded-full" /></div></div>
    <div className="w-full h-px bg-neutral-100" />
    <div aria-hidden="true"><FilterBlock className="w-16 h-5 mb-4" /><div className="flex flex-wrap gap-2.5">{Array.from({ length: 6 }, (_, i) => <FilterBlock key={i} className="w-6 h-6 rounded-full" />)}</div></div>
    <div className="w-full h-px bg-neutral-100" />
    <div aria-hidden="true"><FilterBlock className="w-24 h-5 mb-4" /><FilterRows count={5} /></div>
  </div>;
}
