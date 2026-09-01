import { useState, useEffect } from "react";
import {
  Package,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Search,
  ChevronDown,
  X,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import { useMyOrders } from "../../hooks/order/useOrderTan";
import OrderCard from "./OrderCard";
import { OrderItemSkeleton, default as Skeleton } from "../common/Skeleton";
import OrderStatsCards from "./OrderStatsCards";
import { Link, useLocation } from "react-router-dom";

const ITEMS_PER_PAGE = 5;

const STATUS_OPTIONS = [
  { value: "", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "amount_high", label: "Amount: High to Low" },
  { value: "amount_low", label: "Amount: Low to High" },
];

export default function OrdersSection() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(location.state?.searchQuery || "");

  const { data, isLoading, isError, refetch } = useMyOrders(
    { page, limit: ITEMS_PER_PAGE, status: statusFilter || undefined },
    { keepPreviousData: true },
  );

  useEffect(() => {
    refetch();
  }, []);

  const rawOrders = data?.data?.orders || [];
  const pagination = data?.data?.pagination || { total: 0, pages: 1 };

  const sortedOrders = [...rawOrders].sort((a, b) => {
    const dateA = new Date(a.orderedAt || a.createdAt || 0);
    const dateB = new Date(b.orderedAt || b.createdAt || 0);
    switch (sortBy) {
      case "oldest":
        return dateA - dateB;
      case "amount_high":
        return (b.total || 0) - (a.total || 0);
      case "amount_low":
        return (a.total || 0) - (b.total || 0);
      default:
        return dateB - dateA;
    }
  });

  const filteredOrders = searchQuery
    ? sortedOrders.filter(
        (o) =>
          o.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o._id?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : sortedOrders;

  if (isLoading && !rawOrders.length) {
    return (
      <div className="h-full flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-[18px] font-semibold text-[#1A1714]">Order History</h2>
            <p className="text-[14px] text-neutral-400 mt-1">
              View your orders, track deliveries, download invoices and more.
            </p>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-2">
                <Skeleton className="w-16 h-4 rounded" />
                <Skeleton className="w-20 h-6 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Controls Skeleton */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:justify-end shrink-0">
          <Skeleton className="w-full sm:w-auto sm:max-w-xs h-11 rounded-xl" />
          <Skeleton className="w-full sm:w-auto sm:min-w-[150px] h-11 rounded-xl" />
          <Skeleton className="w-full sm:w-auto sm:min-w-[170px] h-11 rounded-xl" />
        </div>

        {/* Orders Skeleton */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-5">
          <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
            <OrderItemSkeleton />
            <OrderItemSkeleton />
            <OrderItemSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle size={22} className="text-red-500" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-[16px] font-bold text-[#1A1714]">Connection Error</h3>
          <p className="text-[13px] text-neutral-400 max-w-xs">
            We couldn't retrieve your order information. Please refresh to try again.
          </p>
        </div>
      </div>
    );
  }

  const isEmpty = !(rawOrders.length > 0 || statusFilter || searchQuery);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-[18px] font-semibold text-[#1A1714]">Order History</h2>
          <p className="text-[14px] text-neutral-400 mt-1">
            View your orders, track deliveries, download invoices and more.
          </p>
        </div>
      </div>

      {!isEmpty && (
        <div className="shrink-0">
          <OrderStatsCards orders={rawOrders} totalCount={pagination.total} />
        </div>
      )}

      {!isEmpty ? (
        <>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:justify-end shrink-0">
            <div className="relative w-full sm:w-auto sm:flex-none sm:max-w-xs">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by order ID, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-3 border border-neutral-200 rounded-xl focus:border-[#F27318] outline-none text-sm text-[#1A1714] placeholder:text-neutral-400 bg-white font-medium transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="relative min-w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-3.5 pr-9 py-3 border border-neutral-200 rounded-xl focus:border-[#F27318] outline-none text-sm text-[#1A1714] bg-white appearance-none cursor-pointer font-medium transition-colors"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>

            <div className="relative min-w-[170px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-3.5 pr-9 py-3 border border-neutral-200 rounded-xl focus:border-[#F27318] outline-none text-sm text-[#1A1714] bg-white appearance-none cursor-pointer font-medium transition-colors"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* Results — single table-like container, rows divided by hairlines */}
          {filteredOrders.length === 0 ? (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center bg-neutral-50 rounded-2xl">
              <SlidersHorizontal size={30} className="text-neutral-300 mb-4" />
              <h3 className="text-[16px] font-semibold text-[#1A1714] mb-1">No Orders Match</h3>
              <p className="text-[14px] text-neutral-400 max-w-xs">
                No orders match your filter criteria. Try changing your search query or status filter.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-5">
              <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
                {filteredOrders.map((order, idx) => (
                  <OrderCard key={order._id} order={order} defaultExpanded={idx === 0} />
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded-lg text-neutral-500 hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pageNum) => {
                    const isActive = pageNum === page;
                    const isNear =
                      Math.abs(pageNum - page) <= 1 || pageNum === 1 || pageNum === pagination.pages;

                    if (!isNear) {
                      if (pageNum === 2 || pageNum === pagination.pages - 1) {
                        return (
                          <span key={pageNum} className="w-9 text-center text-xs text-neutral-300">
                            …
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-colors ${
                          isActive
                            ? "bg-[#F27318] text-white"
                            : "border border-neutral-200 text-neutral-500 hover:border-neutral-900 bg-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded-lg text-neutral-500 hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center bg-neutral-50 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-5 text-[#F27318]">
            <Package size={26} />
          </div>
          <h3 className="text-[18px] font-semibold text-[#1A1714]">No orders placed yet</h3>
          <p className="text-[14px] text-neutral-400 max-w-xs mt-1.5 mb-7 leading-relaxed">
            You haven't made any purchases yet. Explore our selection of modern furniture pieces.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F27318] hover:bg-[#D9620E] text-white text-[14px] font-medium rounded-lg transition-colors"
          >
            Start Shopping
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}