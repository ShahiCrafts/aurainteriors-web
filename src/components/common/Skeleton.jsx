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
