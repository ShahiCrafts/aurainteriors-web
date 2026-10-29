import React from "react";
import {
  Search,
  Bell,
  Menu,
  Grid3X3,
  List,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import Price from "../ui/Price";
import Rating from "../ui/Rating";

export default function Skeleton({
  className = "",
  variant = "rectangle",
  width,
  height,
  children,
  ...props
}) {
  const baseClasses = "relative overflow-hidden bg-gray-100 shimmer-element";

  const variantClasses = {
    rectangle: "rounded-md",
    circle: "rounded-full",
    text: "rounded-sm h-4 mb-2 last:mb-0",
    card: "rounded-xl",
  };

  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant] || ""} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

export function CategoryCardSkeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`flex aspect-square flex-col overflow-hidden rounded-sm border border-black/6 bg-white md:rounded-lg ${className}`}
    >
      <div className="shimmer-element relative min-h-0 w-full flex-1 overflow-hidden bg-gray-100" />

      <div className="flex shrink-0 items-center justify-between gap-2 p-3">
        <div className="min-w-0">
          <div className="flex h-[19.25px] items-center">
            <div className="shimmer-element relative h-3.25 w-24 max-w-full overflow-hidden rounded-[3px] bg-gray-100" />
          </div>
          <div className="flex h-[16.5px] items-center">
            <div className="shimmer-element relative h-2.75 w-14 max-w-full overflow-hidden rounded-[3px] bg-gray-100" />
          </div>
        </div>

        <div className="shimmer-element relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-gray-100" />
      </div>
    </div>
  );
}

export function ProductCardSkeleton({ className = "" }) {
  return <ListingCardSkeleton viewMode="grid" className={className} />;
}

export function OrderItemSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-5 px-6 py-6">
        <div className="hidden sm:flex items-center -space-x-3 shrink-0">
          {[0, 1, 2].map((idx) => (
            <Skeleton
              key={idx}
              className="w-12 h-12 rounded-lg border-2 border-white shrink-0"
              style={{ zIndex: 3 - idx }}
            />
          ))}
        </div>

        <div className="min-w-0 shrink-0">
          <Skeleton className="w-32 h-5 rounded mb-2" />
          <Skeleton className="w-40 h-4 rounded" />
        </div>

        <div className="hidden md:flex flex-col justify-center min-w-0 pl-6 border-l border-neutral-100 gap-4">
          <Skeleton className="w-full h-4 rounded" />
          <div className="flex items-center gap-2 max-w-58">
            <Skeleton className="flex-1 h-2 rounded-full" />
            <Skeleton className="flex-1 h-2 rounded-full" />
            <Skeleton className="flex-1 h-2 rounded-full" />
            <Skeleton className="flex-1 h-2 rounded-full" />
            <Skeleton className="flex-1 h-2 rounded-full" />
          </div>
        </div>

        <div className="text-right shrink-0">
          <Skeleton className="w-16 h-4 rounded mb-2" />
          <Skeleton className="w-24 h-6 rounded" />
          <Skeleton className="w-20 h-3 rounded mt-2 lg:hidden" />
        </div>

        <div className="flex items-center justify-center shrink-0">
          <Skeleton className="w-5 h-5 rounded" />
        </div>
      </div>
    </div>
  );
}

export function CartItemSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-neutral-100">
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
    <div className="p-5 bg-neutral-50 rounded-2xl space-y-3">
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
    <div className="w-full overflow-hidden rounded-xl border border-neutral-200">
      <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-4 rounded" />
        ))}
      </div>
      <div className="divide-y divide-neutral-100">
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
    <div
      className={`flex gap-3 my-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && <Skeleton className="w-10 h-10 rounded-full shrink-0" />}
      <div
        className={`flex flex-col gap-2 p-3 rounded-xl max-w-[75%] ${isUser ? "bg-brand/10" : "bg-gray-100"}`}
      >
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
      <div className="p-5 flex-1">
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

        <div className="space-y-2 pl-13">
          <Skeleton className="w-32 h-4 rounded" />
          <div className="space-y-1.5">
            <Skeleton className="w-full h-3 rounded" />
            <Skeleton className="w-4/5 h-3 rounded" />
          </div>
          <Skeleton className="w-40 h-3 rounded" />
        </div>
      </div>

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
          <div
            key={i}
            className="p-5 bg-white border border-neutral-200/80 rounded-2xl space-y-3"
          >
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
        <div className="lg:col-span-2 p-6 bg-white border border-neutral-200/80 rounded-2xl space-y-4">
          <Skeleton className="w-40 h-6 rounded" />
          <Skeleton className="w-full h-64 rounded-xl" />
        </div>
        <div className="p-6 bg-white border border-neutral-200/80 rounded-2xl space-y-4">
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
      <div className="flex items-center justify-between shrink-0">
        <div>
          <Skeleton className="w-32 h-6 rounded mb-2" />
          <Skeleton className="w-64 h-4 rounded" />
        </div>
        <Skeleton className="w-24 h-6 rounded-full" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-neutral-50 p-4 rounded-xl shrink-0">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
          <Skeleton className="flex-1 max-w-sm h-9 rounded-lg" />
          <Skeleton className="min-w-37.5 h-9 rounded-lg" />
          <Skeleton className="min-w-37.5 h-9 rounded-lg" />
        </div>
        <Skeleton className="w-32 h-9 rounded-lg" />
      </div>

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

const ListingBlock = ({ className = "" }) => (
  <div
    aria-hidden="true"
    className={`relative overflow-hidden rounded bg-gray-100 shimmer-element ${className}`}
  />
);

const MeasuredBlock = ({ className = "", innerClassName = "", children }) => (
  <div
    aria-hidden="true"
    className={`relative overflow-hidden rounded bg-gray-100 shimmer-element ${className}`}
  >
    <div className={`invisible ${innerClassName}`}>{children}</div>
  </div>
);

export function CatalogCountSkeleton() {
  return (
    <span
      aria-hidden="true"
      className="ml-3 sm:ml-5 text-[13px] sm:text-[15px] font-semibold text-black/40 tracking-normal lowercase"
    >
      <span className="relative inline-block align-middle h-lh w-20 sm:w-24 overflow-hidden rounded bg-gray-100 shimmer-element" />
    </span>
  );
}

export function ListingCardSkeleton({ viewMode = "grid", className = "" }) {
  const list = viewMode === "list";
  if (list) {
    return (
      <div
        aria-hidden="true"
        className={`flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white rounded-sm md:rounded-lg border border-black/6 p-3 sm:p-4 ${className}`}
      >
        <div className="relative w-full sm:w-40 lg:w-52 shrink-0 aspect-video sm:aspect-auto sm:h-32 lg:h-40 overflow-hidden rounded-sm md:rounded-md bg-gray-100 shimmer-element">
          <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="text-[11px] sm:text-[12px] mb-2">
            <ListingBlock className="h-lh w-20 max-w-full" />
          </div>
          <div className="text-[13px] sm:text-[15px] mb-2 sm:mb-3">
            <ListingBlock className="h-lh w-3/4" />
          </div>
          <div className="text-[11px] sm:text-[13px] leading-snug mb-2 sm:mb-3">
            <ListingBlock className="h-[0.8lh] w-full mb-[0.4lh]" />
            <ListingBlock className="h-[0.8lh] w-4/5" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 text-[10px] sm:text-[11px]">
            <ListingBlock className="h-lh w-16" />
          </div>
          <div className="mt-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <MeasuredBlock
                className="w-28 max-w-full"
                innerClassName="flex items-center"
              >
                <Price amount={0} size="md" />
              </MeasuredBlock>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`group relative flex h-full flex-col overflow-hidden rounded-sm md:rounded-lg border border-black/6 bg-white ${className}`}
    >
      <div className="p-2 pb-0 sm:p-2.5 sm:pb-0">
        <div className="relative aspect-2/1 overflow-hidden rounded-md bg-gray-100 shimmer-element">
          <div className="absolute left-3 top-3 h-5.5 w-16 rounded-md bg-white/70" />
          <div className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/80" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-[15px] leading-snug">
          <ListingBlock className="h-lh w-3/4" />
        </div>
        <div className="mt-0.5 text-[13px] leading-snug">
          <ListingBlock className="h-lh w-full" />
        </div>
        <div className="mt-1.5">
          <MeasuredBlock className="w-24">
            <Rating value={4} count={1} size="md" />
          </MeasuredBlock>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="min-w-0">
            <MeasuredBlock className="w-24">
              <Price amount={0} size="md" />
            </MeasuredBlock>
            <div className="mt-3 flex items-center gap-1.5 pb-1">
              <ListingBlock className="h-4.5 w-4.5 rounded-full" />
              <ListingBlock className="h-4.5 w-4.5 rounded-full" />
              <ListingBlock className="h-4.5 w-4.5 rounded-full" />
            </div>
          </div>
          <ListingBlock className="h-9 w-9 shrink-0 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailsSkeleton() {
  return (
    <main
      className="min-h-screen bg-white pt-4 font-dm-sans pb-32 lg:pb-28"
      aria-busy="true"
    >
      <span role="status" className="sr-only">
        Loading product details
      </span>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
        <nav
          aria-hidden="true"
          className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[14px] font-medium mb-5"
        >
          <ListingBlock className="h-lh w-12" />
          <ListingBlock className="h-lh w-20" />
          <ListingBlock className="h-lh w-36" />
        </nav>
        <div className="flex gap-10 mb-14" aria-hidden="true">
          <div className="flex-[1.2] flex gap-3 justify-end overflow-hidden">
            <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar">
              {Array.from({ length: 5 }, (_, i) => (
                <ListingBlock
                  key={i}
                  className="shrink-0 w-20 h-20 rounded-lg border-2 border-transparent"
                />
              ))}
            </div>
            <div className="space-y-6 flex-1">
              <ListingBlock className="w-full h-111 rounded-xl border border-[#F0EFED]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <ListingBlock className="w-24 h-6 mb-5" />
            <ListingBlock className="w-4/5 h-9 mb-3" />
            <div className="flex flex-wrap gap-2 mb-4">
              <ListingBlock className="w-24 h-5" />
              <ListingBlock className="w-32 h-5" />
            </div>
            <ListingBlock className="w-44 h-11.25 mb-1.5" />
            <ListingBlock className="w-36 h-5 mb-4" />
            <div className="mb-6 space-y-2">
              <ListingBlock className="w-full h-5.25" />
              <ListingBlock className="w-full h-5.25" />
              <ListingBlock className="w-3/4 h-5.25" />
            </div>
            <div className="mb-5">
              <ListingBlock className="w-32 h-5.5 mb-3" />
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <ListingBlock key={i} className="w-10 h-10 rounded-full" />
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-5">
              <ListingBlock className="h-13 sm:w-29 shrink-0 rounded-lg" />
              <ListingBlock className="h-13 flex-2 rounded-lg" />
              <ListingBlock className="h-13 flex-1 rounded-lg" />
            </div>
            <div className="flex items-start gap-12 mt-10">
              <ListingBlock className="w-32 h-5" />
              <ListingBlock className="w-16 h-5" />
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="mb-16">
          <div className="flex gap-8 py-4 border-b border-[#F0EFED]">
            {Array.from({ length: 4 }, (_, i) => (
              <ListingBlock key={i} className="w-24 h-5" />
            ))}
          </div>
          <div className="space-y-3 py-6">
            <ListingBlock className="w-full h-4" />
            <ListingBlock className="w-full h-4" />
            <ListingBlock className="w-3/4 h-4" />
          </div>
        </div>
      </div>
    </main>
  );
}

const FilterBlock = ({ className = "" }) => (
  <div
    className={`relative overflow-hidden rounded bg-gray-100 shimmer-element ${className}`}
  />
);
const FilterRows = ({ count }) => (
  <div className="space-y-1">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex items-center gap-3 py-1.5">
        <FilterBlock className="w-5 h-5 shrink-0" />
        <FilterBlock
          className={`${i % 2 ? "w-24" : "w-32"} max-w-full h-5 flex-1`}
        />
        <FilterBlock className="w-4 h-4" />
      </div>
    ))}
  </div>
);

export function FilterSidebarSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only" role="status">
        Loading filters
      </span>
      <div aria-hidden="true">
        <FilterBlock className="w-28 h-5 mb-4" />
        <FilterRows count={8} />
      </div>
      <div className="w-full h-px bg-neutral-100" />
      <div aria-hidden="true">
        <div className="flex items-center justify-between mb-4">
          <FilterBlock className="w-28 h-5" />
          <FilterBlock className="w-10 h-4" />
        </div>
        <div className="flex items-center gap-4 mb-6">
          {[0, 1].map((i) => (
            <div key={i} className="flex-1">
              <FilterBlock className="w-7 h-3.75 mb-1.5" />
              <FilterBlock className="w-full h-8.5 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="relative px-1 h-6">
          <FilterBlock className="absolute top-1/2 w-full h-0.75 -translate-y-1/2" />
          <FilterBlock className="absolute top-1/2 right-0 w-4 h-4 rounded-full -translate-y-1/2" />
        </div>
      </div>
      <div className="w-full h-px bg-neutral-100" />
      <div aria-hidden="true">
        <FilterBlock className="w-16 h-5 mb-4" />
        <div className="flex flex-wrap gap-2.5">
          {Array.from({ length: 6 }, (_, i) => (
            <FilterBlock key={i} className="w-6 h-6 rounded-full" />
          ))}
        </div>
      </div>
      <div className="w-full h-px bg-neutral-100" />
      <div aria-hidden="true">
        <FilterBlock className="w-24 h-5 mb-4" />
        <FilterRows count={5} />
      </div>
      <div className="w-full h-px bg-neutral-100" />
      <div aria-hidden="true">
        <FilterBlock className="w-16 h-5 mb-4" />
        <div className="space-y-1">
          <div className="px-2 py-1.5">
            <FilterBlock className="w-20 h-5" />
          </div>
          {[4, 3, 2, 1].map((r) => (
            <div key={r} className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex gap-0.5">
                {Array.from({ length: r }, (_, i) => (
                  <FilterBlock key={i} className="w-3.5 h-3.5" />
                ))}
              </div>
              <FilterBlock className="w-8 h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RouteSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-360 px-4 sm:px-5 md:px-6 lg:px-4 py-8"
      aria-busy="true"
    >
      <span role="status" className="sr-only">
        Loading…
      </span>
      <div aria-hidden="true" className="space-y-6">
        <Skeleton className="h-9 w-64 max-w-full rounded" />
        <Skeleton className="h-4 w-96 max-w-full rounded" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

const actionButtonClasses =
  "relative flex flex-col items-center gap-[4px] px-2 md:px-[14px] py-[6px] rounded-[10px]";

export function WishlistActionSkeleton() {
  return (
    <div className={actionButtonClasses} aria-hidden="true">
      <Skeleton className="w-5 h-5 md:w-5.5 md:h-5.5 rounded-full" />
      <span className="hidden md:block text-[12px] font-medium whitespace-nowrap">
        <Skeleton className="h-lh w-16.5 rounded" />
      </span>
    </div>
  );
}

export function CartActionSkeleton() {
  return (
    <div className={actionButtonClasses} aria-hidden="true">
      <Skeleton className="w-5 h-5 md:w-5.5 md:h-5.5 rounded-full" />
      <span className="hidden md:block text-[12px] font-medium whitespace-nowrap">
        <Skeleton className="h-lh w-11 rounded" />
      </span>
      <div className="absolute -top-1 right-1 w-3.75 h-3.75 md:w-4.25 md:h-4.25">
        <Skeleton className="w-full h-full rounded-full border-2 border-white" />
      </div>
    </div>
  );
}

export function ProfileActionSkeleton() {
  return (
    <div className={actionButtonClasses} aria-hidden="true">
      <div className="flex items-center gap-1">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <ChevronDown size={12} className="text-[#6A6058]" />
      </div>
    </div>
  );
}

export function ProfileMenuHeaderSkeleton() {
  return (
    <div
      className="px-4 py-3 border-b border-[#F0EFED] bg-[#FAFAFA] flex items-center gap-3"
      aria-hidden="true"
    >
      <Skeleton className="w-10 h-10 rounded-full shrink-0 border border-neutral-100" />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] mb-0.5">
          <Skeleton className="h-lh w-32 rounded" />
        </div>
        <div className="text-[12px]">
          <Skeleton className="h-lh w-40 rounded" />
        </div>
      </div>
    </div>
  );
}

export function NavbarSkeleton() {
  return (
    <div
      className="sticky top-0 z-50 bg-white border-b border-[#F0EFED] font-dm-sans"
      aria-hidden="true"
    >
      <div className="px-4 md:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-3 md:gap-6">
        <div className="flex items-center gap-2 md:gap-2.75 shrink-0 select-none">
          <img
            src="/logo-aura-interiors.webp"
            alt="AuraInteriors Logo"
            className="h-8 md:h-10 w-auto object-contain"
          />
        </div>

        <div className="hidden md:block flex-1 max-w-140 relative">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              type="text"
              readOnly
              tabIndex={-1}
              placeholder="Search furniture, décor, colours…"
              className="w-full py-2.75 pr-25 pl-11 border-[1.5px] border-neutral-300 rounded-[10px] bg-[#FAFAFA] font-sans text-[14px] text-neutral-400 focus:outline-none placeholder:text-[#B8B4AE]"
            />
            <div className="absolute right-1.25 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <div className="bg-brand text-white rounded-lg px-4.5 py-1.75 font-sans text-[13.5px] font-semibold">
                Search
              </div>
            </div>
          </div>
        </div>

        <div className="flex md:hidden items-center gap-4.5 shrink-0 text-[#1A1714]">
          <Bell size={22} />
          <Search size={22} />
          <Menu size={24} />
        </div>

        <div className="hidden md:flex items-start gap-1.5 shrink-0">
          <WishlistActionSkeleton />
          <CartActionSkeleton />
          <ProfileActionSkeleton />
        </div>
      </div>
    </div>
  );
}

const categoryBarItemClasses =
  "flex items-center gap-1.5 md:gap-2 pr-4 md:pr-9 py-2.5 md:py-3 text-[14px] md:text-[15px] whitespace-nowrap shrink-0";

const categoryBarLabelWidths = [64, 72, 56, 80, 68, 76, 60, 72];

export function CategoryBarSkeletonItems() {
  return (
    <>
      {categoryBarLabelWidths.map((width, i) => (
        <div key={i} className={categoryBarItemClasses} aria-hidden="true">
          <Skeleton className="h-3.75 w-3.75 shrink-0 rounded-sm" />
          <Skeleton className="h-lh rounded" style={{ width }} />
        </div>
      ))}
    </>
  );
}

export function CategoryBarSkeletonContent() {
  return (
    <>
      <div
        className="flex shrink-0 items-center whitespace-nowrap pr-6.5 py-2.5 text-[14px] md:pr-8.5 md:py-3 md:text-[15px]"
        aria-hidden="true"
      >
        <div className="flex items-center gap-1.5 md:gap-2 py-1">
          <Skeleton className="h-3.75 w-3.75 shrink-0 rounded-sm" />
          <Skeleton className="h-lh w-8 rounded" />
        </div>
      </div>
      <CategoryBarSkeletonItems />
    </>
  );
}

export function CategoryBarSkeleton() {
  return (
    <div
      className="bg-white border-b border-[#F0EFED] font-dm-sans"
      aria-hidden="true"
    >
      <div className="flex items-center overflow-hidden px-4 md:px-6 lg:px-8">
        <CategoryBarSkeletonContent />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] lg:grid-rows-[286px_286px] gap-2 sm:gap-3 px-2 md:px-6 lg:px-8 py-2 md:py-4 bg-white"
      aria-hidden="true"
    >
      <div className="relative lg:row-span-2 h-92.5 sm:h-112.5 lg:h-auto rounded-sm md:rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gray-100 shimmer-element" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
          <Skeleton className="h-10 md:h-14 w-3/5 rounded bg-white/70" />
          <Skeleton className="mt-2 h-10 md:h-14 w-2/5 rounded bg-white/70" />
          <Skeleton className="mt-4 h-4 w-1/2 max-w-full rounded bg-white/70" />
          <Skeleton className="mt-2 h-4 w-2/5 rounded bg-white/70" />
          <div className="mt-6 flex items-center gap-6">
            <Skeleton className="h-12 w-36 rounded-lg bg-white/70" />
            <Skeleton className="h-6 w-44 max-w-full rounded bg-white/70" />
          </div>
        </div>
      </div>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="relative hidden md:block h-62.5 sm:h-71.5 rounded-sm md:rounded-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gray-100 shimmer-element" />
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-[28px_32px]">
            <Skeleton className="h-7 w-1/2 rounded bg-white/70" />
            <Skeleton className="mt-2 h-4 w-3/5 rounded bg-white/70" />
            <Skeleton className="mt-4 h-10 w-28 rounded-lg bg-white/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Loading…
      </span>
      <div
        className="hidden md:flex bg-gray-100 px-4 md:px-6 lg:px-8 h-10 md:h-11 items-center justify-between"
        aria-hidden="true"
      >
        <Skeleton className="h-4 w-44 rounded" />
        <Skeleton className="h-4 w-72 max-w-full rounded" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>
      <NavbarSkeleton />
      <CategoryBarSkeleton />
      <HeroSkeleton />
      <div aria-hidden="true">
        <div
          className="relative w-full overflow-hidden bg-gray-100 shimmer-element"
          style={{ minHeight: "120px" }}
        />
        <div
          className="relative w-full overflow-hidden bg-gray-100 shimmer-element"
          style={{ minHeight: "300px" }}
        />
        <div
          className="relative w-full overflow-hidden bg-gray-100 shimmer-element"
          style={{ minHeight: "400px" }}
        />
      </div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Loading…
      </span>
      <NavbarSkeleton />
      <div
        className="flex flex-col lg:flex-row items-stretch"
        aria-hidden="true"
      >
        <div className="flex-1">
          <div className="w-full px-4 sm:px-6 lg:px-12 py-12">
            <div className="flex items-center gap-3 mb-10">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <Skeleton className="h-5 w-20 rounded" />
              <div className="h-px w-10 bg-neutral-200" />
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <Skeleton className="h-5 w-20 rounded" />
            </div>
            <div className="space-y-6">
              {[0, 1].map((card) => (
                <div
                  key={card}
                  className="rounded-xl border border-black/6 p-6 space-y-4"
                >
                  <Skeleton className="h-6 w-48 max-w-full rounded" />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Skeleton className="h-11 rounded-lg" />
                    <Skeleton className="h-11 rounded-lg" />
                    <Skeleton className="h-11 rounded-lg" />
                    <Skeleton className="h-11 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full lg:w-105 shrink-0 bg-neutral-50 border-t lg:border-t-0 lg:border-l border-[#F0EFED] px-6 py-12 space-y-4">
          <Skeleton className="h-6 w-40 rounded" />
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3.5 w-1/3 rounded" />
              </div>
              <Skeleton className="h-4 w-14 rounded" />
            </div>
          ))}
          <div className="border-t border-neutral-200 pt-4 flex items-center justify-between">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Loading…
      </span>
      <NavbarSkeleton />
      <CategoryBarSkeleton />
      <div className="flex flex-col lg:flex-row" aria-hidden="true">
        <div className="w-full lg:w-[320px] xl:w-95 shrink-0 bg-white p-6 lg:p-8 space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <Skeleton key={row} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6 lg:p-10 space-y-6">
          <Skeleton className="h-8 w-64 max-w-full rounded" />
          <div className="rounded-xl border border-black/6 p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Skeleton className="h-11 rounded-lg" />
              <Skeleton className="h-11 rounded-lg" />
              <Skeleton className="h-11 rounded-lg" />
              <Skeleton className="h-11 rounded-lg" />
            </div>
            <Skeleton className="h-11 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BlogListSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Loading…
      </span>
      <NavbarSkeleton />
      <div aria-hidden="true">
        <div className="pt-12 sm:pt-14 md:pt-16 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-4">
            <Skeleton className="h-10 w-96 max-w-full rounded" />
            <Skeleton className="h-5 w-120 max-w-full rounded" />
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-8 sm:mb-12">
          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            <Skeleton className="aspect-16/10 md:aspect-auto md:h-full w-full rounded-2xl" />
            <div className="space-y-4 py-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-2/3 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-5 w-32 rounded" />
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((card) => (
            <div key={card} className="space-y-3">
              <Skeleton className="aspect-16/10 w-full rounded-xl" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-6 w-full rounded" />
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BlogPostSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Loading…
      </span>
      <NavbarSkeleton />
      <div
        className="max-w-7xl mx-auto pt-12 sm:pt-14 md:pt-16 px-4 sm:px-6 lg:px-8 pb-16"
        aria-hidden="true"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-6 w-24 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-10 w-2/3 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <Skeleton className="aspect-21/9 w-full rounded-2xl" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Loading…
      </span>
      <NavbarSkeleton />
      <div
        className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 max-w-7xl mx-auto px-6 sm:px-8 py-12 sm:py-14"
        aria-hidden="true"
      >
        <div className="max-w-md w-full space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-10 w-3/4 rounded" />
            <Skeleton className="h-5 w-full rounded" />
            <Skeleton className="h-5 w-5/6 rounded" />
          </div>
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-4">
              <Skeleton className="h-11 w-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 w-full max-w-xl rounded-2xl border border-black/6 p-6 sm:p-8 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Skeleton className="h-11 rounded-lg" />
            <Skeleton className="h-11 rounded-lg" />
          </div>
          <Skeleton className="h-11 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-12 w-40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function FaqSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Loading…
      </span>
      <NavbarSkeleton />
      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14"
        aria-hidden="true"
      >
        <div className="text-center space-y-4 mb-10">
          <Skeleton className="h-10 w-72 max-w-full rounded mx-auto" />
          <Skeleton className="h-5 w-105 max-w-full rounded mx-auto" />
        </div>
        <div className="space-y-4 max-w-2xl mx-auto">
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between rounded-xl border border-black/6 px-5 h-16"
            >
              <Skeleton className="h-5 w-2/3 rounded" />
              <Skeleton className="h-5 w-5 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TrackOrderSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Loading…
      </span>
      <NavbarSkeleton />
      <div
        className="max-w-4xl mx-auto px-4 py-12 space-y-8"
        aria-hidden="true"
      >
        <div className="space-y-3">
          <Skeleton className="h-9 w-64 max-w-full rounded" />
          <Skeleton className="h-5 w-96 max-w-full rounded" />
        </div>
        <div className="rounded-2xl border border-black/6 p-6 flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-12 flex-1 rounded-lg" />
          <Skeleton className="h-12 w-full sm:w-36 rounded-lg" />
        </div>
        <div className="rounded-2xl border border-black/6 p-6 space-y-5">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-start gap-4">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OrderConfirmationSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Loading…
      </span>
      <NavbarSkeleton />
      <div
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        aria-hidden="true"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-9 w-80 max-w-full rounded" />
          <Skeleton className="h-5 w-105 max-w-full rounded" />
        </div>
        <div className="mt-10 rounded-2xl border border-black/6 p-6 space-y-4">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-44 rounded" />
            </div>
          ))}
          <div className="border-t border-neutral-200 pt-4 space-y-3">
            {[0, 1].map((row) => (
              <div key={row} className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2 rounded" />
                  <Skeleton className="h-3.5 w-1/4 rounded" />
                </div>
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Loading…
      </span>
      <NavbarSkeleton />
      <div
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
        aria-hidden="true"
      >
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-52 rounded" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="divide-y divide-neutral-100 rounded-2xl border border-black/6">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-start gap-4 p-4 sm:p-5">
              <Skeleton className="h-11 w-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-3.5 w-1/2 rounded" />
              </div>
              <Skeleton className="h-3.5 w-14 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CenteredCardSkeleton() {
  return (
    <div
      aria-busy="true"
      className="min-h-screen flex items-center justify-center px-4 py-12"
    >
      <span role="status" className="sr-only">
        Loading…
      </span>
      <div
        className="w-full max-w-md rounded-2xl border border-black/6 p-8 flex flex-col items-center text-center space-y-4"
        aria-hidden="true"
      >
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-7 w-56 max-w-full rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-11 w-40 rounded-lg" />
      </div>
    </div>
  );
}

export function PaymentFailedSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Loading…
      </span>
      <NavbarSkeleton />
      <div
        className="min-h-[60vh] flex items-center justify-center px-4 py-12"
        aria-hidden="true"
      >
        <div className="w-full max-w-md flex flex-col items-center text-center space-y-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-8 w-64 max-w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-11 w-36 rounded-lg" />
            <Skeleton className="h-11 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ viewMode = "grid", count = 12 }) {
  return (
    <div
      className={
        viewMode === "grid"
          ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6 md:gap-x-5 md:gap-y-8"
          : "flex flex-col gap-4"
      }
    >
      <span className="sr-only" role="status">
        Loading products
      </span>
      {Array.from({ length: count }, (_, i) => (
        <ListingCardSkeleton key={i} viewMode={viewMode} />
      ))}
    </div>
  );
}

function CatalogBreadcrumbsStatic({ crumbs, className }) {
  return (
    <nav className={className}>
      {crumbs.map((name, index) => (
        <div key={`${name}-${index}`} className="flex items-center gap-2">
          {index > 0 && <span className="text-black/10">/</span>}
          <span
            className={
              index === crumbs.length - 1 ? "text-black/60 font-semibold" : ""
            }
          >
            {name}
          </span>
        </div>
      ))}
    </nav>
  );
}

export function CatalogPageSkeleton({
  crumbs = ["Home", "Shop"],
  title = "Collection",
}) {
  return (
    <div
      className="max-w-360 mx-auto px-4 sm:px-5 md:px-6 lg:px-4"
      aria-busy="true"
    >
      <span role="status" className="sr-only">
        Loading…
      </span>
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12">
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <CatalogBreadcrumbsStatic
            crumbs={crumbs}
            className="flex items-center gap-2 text-[14px] font-medium text-black/40 mb-10 flex-wrap"
          />
          <div className="sticky top-28" aria-hidden="true">
            <FilterSidebarSkeleton />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <CatalogBreadcrumbsStatic
            crumbs={crumbs}
            className="flex lg:hidden items-center gap-2 text-[13px] sm:text-[14px] font-medium text-black/40 mb-5 flex-wrap"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-4">
              <h1 className="text-[20px] sm:text-[24px] md:text-[28px] font-semibold text-[#1A1714]">
                {title}
                <CatalogCountSkeleton />
              </h1>
            </div>

            <div
              className="flex items-center gap-2 sm:gap-3 flex-wrap"
              aria-hidden="true"
            >
              <div className="lg:hidden relative flex items-center gap-2 px-4 py-2.5 rounded-md border border-black/8 bg-white text-[13px] sm:text-[14px] font-semibold text-[#1A1714]">
                <SlidersHorizontal size={16} className="text-black/40" />
                <span>Filters</span>
              </div>

              <div className="relative">
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-md border border-black/8 bg-white text-[13px] sm:text-[14px] font-semibold text-[#1A1714]">
                  <span className="hidden sm:inline text-black/40 font-medium">
                    Sort by:
                  </span>
                  <span className="truncate max-w-30 sm:max-w-none">
                    Featured
                  </span>
                  <ChevronDown size={16} className="text-black/20 shrink-0" />
                </div>
              </div>

              <div className="flex items-center border border-black/8 rounded-md p-1 bg-white">
                <div className="p-2 rounded-sm bg-brand text-white shadow-sm">
                  <Grid3X3 size={16} />
                </div>
                <div className="p-2 rounded-sm text-black/30">
                  <List size={16} />
                </div>
              </div>
            </div>
          </div>

          <ListingGridSkeleton />
        </div>
      </div>
    </div>
  );
}