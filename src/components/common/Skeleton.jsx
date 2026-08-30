import React from 'react';

/**
 * Base Shimmer component with smooth linear-gradient animated sweep.
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
    const baseClasses = 'relative overflow-hidden bg-neutral-200 dark:bg-neutral-800 shimmer-element';

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

export function ProductCardSkeleton({ className = '' }) {
    return (
        <div className={`bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 shadow-xs flex flex-col gap-3 ${className}`}>
            <Skeleton className="w-full aspect-[4/3] rounded-xl" />
            <Skeleton className="w-1/3 h-3 rounded" />
            <Skeleton className="w-3/4 h-5 rounded" />
            <div className="flex items-center justify-between pt-2 mt-auto">
                <Skeleton className="w-1/2 h-6 rounded" />
                <Skeleton className="w-9 h-9 rounded-full" />
            </div>
        </div>
    );
}

export function OrderItemSkeleton() {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200/80 dark:border-neutral-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="space-y-1">
                    <Skeleton className="w-32 h-5 rounded" />
                    <Skeleton className="w-24 h-3 rounded" />
                </div>
                <Skeleton className="w-20 h-7 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="w-3/4 h-4 rounded" />
                    <Skeleton className="w-1/2 h-3 rounded" />
                </div>
                <Skeleton className="w-16 h-5 rounded" />
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
            {!isUser && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
            <div className={`space-y-2 p-3.5 rounded-2xl max-w-[75%] ${isUser ? 'bg-amber-100/50 dark:bg-amber-900/20' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                <Skeleton className="w-48 h-4 rounded" />
                <Skeleton className="w-32 h-3 rounded" />
            </div>
            {isUser && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
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
