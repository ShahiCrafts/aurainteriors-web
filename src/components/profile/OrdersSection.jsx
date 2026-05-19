import { useState } from "react";
import {
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Search,
  ChevronDown,
  X,
} from "lucide-react";
import { useMyOrders } from "../../hooks/order/useOrderTan";
import OrderCard from "./OrderCard";

const ITEMS_PER_PAGE = 5;

const STATUS_OPTIONS = [
  { value: "", label: "All orders" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
];

const STATUS_COLORS = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function OrdersSection() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError } = useMyOrders(
    { page, limit: ITEMS_PER_PAGE, status: statusFilter || undefined },
    { keepPreviousData: true },
  );

  const orders = data?.data?.orders || [];
  const pagination = data?.data?.pagination || { total: 0, pages: 1 };

  const filteredOrders = searchQuery
    ? orders.filter((o) =>
      o._id?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    : orders;

  if (isLoading && !orders.length) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-3">
        <Loader2 size={28} className="text-[#F27318] animate-spin" />
        <p className="text-sm text-neutral-400 font-dm-sans tracking-wide">
          Loading your orders…
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertCircle size={18} className="text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-neutral-700 font-dm-sans mb-1">
            Something went wrong
          </p>
          <p className="text-xs text-neutral-400 font-dm-sans">
            We couldn't load your orders. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Controls ── */}
      {(orders.length > 0 || statusFilter || searchQuery) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center sm:justify-end">
          {/* Search */}
          <div className="relative w-full sm:w-96">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300"
            />
            <input
              type="text"
              placeholder="Search by order ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 border border-neutral-200 rounded-lg focus:border-[#F27318] focus:ring-0 outline-none text-sm text-[#1A1714] placeholder:text-neutral-300 bg-white font-dm-sans font-medium transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-40 pl-3.5 pr-9 py-2.5 border border-neutral-200 rounded-lg focus:border-[#F27318] focus:ring-0 outline-none text-sm text-[#1A1714] bg-white appearance-none cursor-pointer font-dm-sans transition-colors font-medium"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {orders.length === 0 && (
        <div className="py-28 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl border border-neutral-100 bg-neutral-50 flex items-center justify-center mb-5">
            <Package size={28} className="text-neutral-200" />
          </div>
          <h2 className="text-lg font-bold text-[#1A1714] font-dm-sans mb-3">
            No orders yet
          </h2>
          <p className="text-sm text-neutral-400 font-dm-sans max-w-xs leading-relaxed mb-8">
            Once you place an order, it'll appear here with full tracking and
            history.
          </p>
          <a
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F27318] hover:bg-[#E6651B] text-white text-sm font-semibold font-dm-sans rounded-lg transition-colors duration-200"
          >
            Start shopping
          </a>
        </div>
      )}

      {/* ── No search results ── */}
      {orders.length > 0 && filteredOrders.length === 0 && (
        <div className="py-20 text-center border border-dashed border-neutral-200 rounded-xl">
          <Search size={28} className="text-neutral-200 mx-auto mb-4" />
          <p className="text-sm font-semibold text-neutral-700 font-dm-sans mb-2">
            No orders match
          </p>
          <p className="text-xs text-neutral-400 font-dm-sans tracking-wide">
            Try a different order ID or{" "}
            <button
              onClick={() => setSearchQuery("")}
              className="text-[#F27318] underline underline-offset-2"
            >
              clear search
            </button>
          </p>
        </div>
      )}

      {/* ── Orders List ── */}
      {filteredOrders.length > 0 && (
        <div className="flex flex-col gap-6">
          {filteredOrders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-8 border-t border-neutral-100">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#1A1714] border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-dm-sans"
          >
            <ChevronLeft size={14} />
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
              (pageNum) => {
                const isActive = pageNum === page;
                const isNear =
                  Math.abs(pageNum - page) <= 1 ||
                  pageNum === 1 ||
                  pageNum === pagination.pages;

                if (!isNear) {
                  if (pageNum === 2 || pageNum === pagination.pages - 1) {
                    return (
                      <span
                        key={pageNum}
                        className="w-8 text-center text-xs text-neutral-300 font-dm-sans"
                      >
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
                    className={`w-9 h-9 rounded-lg text-sm font-semibold font-dm-sans transition-colors ${isActive
                        ? "bg-[#F27318] text-white"
                        : "border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              },
            )}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#1A1714] border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-dm-sans"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Count footer */}
      {filteredOrders.length > 0 && (
        <p className="text-xs text-neutral-300 font-dm-sans text-center tracking-wide">
          Page {page} of {pagination.pages} · {pagination.total} total orders
        </p>
      )}
    </div>
  );
}
