import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Box,
  Image,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Skeleton from "../../../components/common/Skeleton";
import ConfirmationDialog from "../../../components/modals/ConfirmationDialog";
import {
  useProducts,
  useDeleteProduct,
} from "../../../hooks/product/useProductTan";
import { useCategories } from "../../../hooks/product/useCategoryTan";
import useDebounce from "../../../hooks/useDebounce";
import { toast } from "../../../lib/toast";
import ImageWithFallback from "../../../components/fallbacks/ImageWithFallback";
import { getProductImageUrl } from "../../../utils/imageUrl";
import formatError from "../../../utils/errorHandler";
import { API_V1_URL } from "../../../config/constants";
import { formatNPR } from "../../../utils/formatCurrency";
import ProductFormDrawer from "./ProductFormDrawer";
import useProductFormState from "./hooks/useProductFormState";

const API_URL = API_V1_URL;

import Pagination from "../../../components/common/Pagination";

export default function ProductListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // PERF-F-007: input stays immediate; only the query-param value is debounced
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Advanced filters state
  const [stockFilter, setStockFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // FE-51: the products list is server-driven. The API already
  // supports page/limit/search/category/status (verified in the server
  // tree: product.controller getAllProducts), so the request carries
  // them and the pager reports the server's totals. The old code
  // fetched limit:1000 (silently capped to 100 server-side) and did
  // everything client-side. "status: all" must be sent explicitly —
  // for an admin the server treats it as "no status filter", while an
  // omitted status defaults to active + out_of_stock only.
  const { data: productsData, isLoading } = useProducts({
    page,
    limit: pageSize,
    status: statusFilter,
    ...(debouncedSearchQuery.trim()
      ? { search: debouncedSearchQuery.trim() }
      : {}),
    ...(selectedCategory !== "all" ? { category: selectedCategory } : {}),
  });
  const pageProducts = productsData?.data?.products || [];
  const serverPagination = productsData?.data?.pagination || {
    total: 0,
    pages: 1,
  };
  const totalPages = serverPagination.pages || 1;

  // Stats that the API can total exactly are read from server
  // pagination totals via limit:1 probes — never from a fetched
  // array's length or full-array filter passes.
  const { data: totalStatsData } = useProducts({ status: "all", limit: 1 });
  const { data: activeStatsData } = useProducts({ status: "active", limit: 1 });
  const { data: outOfStockStatsData } = useProducts({
    status: "out_of_stock",
    limit: 1,
  });
  const totalProductsCount = totalStatsData?.data?.pagination?.total ?? 0;
  const activeProductsCount = activeStatsData?.data?.pagination?.total ?? 0;
  const outOfStockCount = outOfStockStatsData?.data?.pagination?.total ?? 0;

  // The API has no stock-band or 3D-model parameter, so those two
  // filters honestly refine only the loaded page (their labels say
  // "(this page)"), and the low-stock / model counts below are
  // page-scoped and labelled as such. Memoised — the old code re-ran
  // four full-array filter passes on every render.
  const pageStats = useMemo(() => {
    return {
      lowStockCount: pageProducts.filter((p) => p.stock > 0 && p.stock < 10)
        .length,
      modelCount: pageProducts.filter(
        (p) => p.modelUrl || p.modelFiles?.length > 0,
      ).length,
    };
  }, [pageProducts]);
  const lowStockCount = pageStats.lowStockCount;
  const modelCount = pageStats.modelCount;

  const products = useMemo(() => {
    return pageProducts.filter((product) => {
      // Stock Filter (page-scoped — no server parameter exists)
      if (stockFilter !== "all") {
        if (stockFilter === "outofstock" && product.stock !== 0) return false;
        if (
          stockFilter === "lowstock" &&
          (product.stock === 0 || product.stock >= 10)
        )
          return false;
        if (stockFilter === "instock" && product.stock === 0) return false;
      }

      // 3D Model Filter (page-scoped — no server parameter exists)
      if (modelFilter !== "all") {
        const hasModel = !!(product.modelUrl || product.modelFiles?.length > 0);
        if (modelFilter === "hasmodel" && !hasModel) return false;
        if (modelFilter === "nomodel" && hasModel) return false;
      }

      return true;
    });
  }, [pageProducts, stockFilter, modelFilter]);

  // Fetch categories for filter and form
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data?.categories || [];

  // Phase 7 split: the create/edit form state machine (values,
  // images, models, catalog attributes, submit payload) lives in
  // products/hooks/useProductFormState.js; the drawer + tabs under
  // products/ render it.
  const form = useProductFormState({ categories });
  const { handleOpenModal } = form;

  // Mutations
  const deleteMutation = useDeleteProduct();

  const handleDeleteProduct = async () => {
    try {
      await deleteMutation.mutateAsync(productToDelete);
      toast.success("Product deleted successfully");
      setDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (err) {
      toast.error(formatError(err, "Failed to delete product"));
    }
  };

  const confirmDelete = (id) => {
    setProductToDelete(id);
    setDeleteModalOpen(true);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Active";
      case "out_of_stock":
        return "Out of Stock";
      case "draft":
        return "Draft";
      default:
        return status;
    }
  };

  const getProductImage = (product) => {
    return getProductImageUrl(product);
  };

  return (
    <div className="p-6 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Manage your product inventory
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Total Catalog
              </p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {totalProductsCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
              <Package size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400 font-medium">
            <span>Total registered products</span>
          </div>
        </div>

        {/* Active Listings */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Active Listings
              </p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {activeProductsCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400 font-medium">
            <span>Visible to customers</span>
          </div>
        </div>

        {/* Stock Alert */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Stock Alerts
              </p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {outOfStockCount}{" "}
                <span className="text-xs font-semibold text-red-500">Out</span>{" "}
                / {lowStockCount}{" "}
                <span className="text-xs font-semibold text-amber-500">
                  Low (this page)
                </span>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-sm">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400 font-medium">
            <span>Requires attention</span>
          </div>
        </div>

        {/* 3D Models */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                3D Models Ready (this page)
              </p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {modelCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm">
              <Box size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400 font-medium">
            <span>AR visualization ready</span>
          </div>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
        {/* Filters and search toolbar */}
        <div className="p-6 border-b border-gray-100 bg-[#FAFAFA]/40">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-gray-400 font-medium text-gray-800"
              />
            </div>

            {/* Select Dropdown Filters */}
            <div className="flex flex-wrap gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:border-teal-500 transition-colors cursor-pointer hover:border-gray-300"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Stock Status Filter */}
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:border-teal-500 transition-colors cursor-pointer hover:border-gray-300"
              >
                <option value="all">Stock Status: All (this page)</option>
                <option value="instock">In Stock (this page)</option>
                <option value="lowstock">Low Stock (&lt;10) (this page)</option>
                <option value="outofstock">Out of Stock (this page)</option>
              </select>

              {/* 3D Model Availability Filter */}
              <select
                value={modelFilter}
                onChange={(e) => {
                  setModelFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:border-teal-500 transition-colors cursor-pointer hover:border-gray-300"
              >
                <option value="all">3D Model: All (this page)</option>
                <option value="hasmodel">Has 3D Model (this page)</option>
                <option value="nomodel">No 3D Model (this page)</option>
              </select>

              {/* Status Filter (Active / Draft) */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:border-teal-500 transition-colors cursor-pointer hover:border-gray-300"
              >
                <option value="all">Status: All</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  <th className="px-6 py-4">
                    <Skeleton className="h-4 w-24" />
                  </th>
                  <th className="px-6 py-4">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="px-6 py-4">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="px-6 py-4">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="px-6 py-4">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="px-6 py-4">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="px-6 py-4 text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-11 h-11 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="w-8 h-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60">
                <tr className="text-left text-gray-500">
                  <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">
                    Product
                  </th>
                  <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">
                    Category
                  </th>
                  <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">
                    Price
                  </th>
                  <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">
                    Stock
                  </th>
                  <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">
                    3D Model
                  </th>
                  <th className="text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-right text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <motion.tr
                    key={product._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => handleOpenModal(product)}
                    className="group hover:bg-gray-50/60 transition-all duration-150 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm shrink-0">
                          {getProductImage(product) ? (
                            <ImageWithFallback
                              src={getProductImage(product)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-[14px] group-hover:text-teal-600 transition-colors">
                            {product.name}
                          </p>
                          <p className="font-mono text-xs text-gray-400 mt-0.5">
                            {product.sku ||
                              product._id?.slice(-8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-600">
                        {product.category?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-gray-900">
                          {formatNPR(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through ml-2">
                            {formatNPR(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          product.stock === 0
                            ? "text-red-500"
                            : product.stock < 10
                              ? "text-amber-500"
                              : "text-gray-600"
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.modelUrl || product.modelFiles?.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-100">
                          <Box className="w-3.5 h-3.5" />
                          {product.modelFiles?.length > 0
                            ? `${product.modelFiles.length} Model${
                                product.modelFiles.length > 1 ? "s" : ""
                              }`
                            : "Available"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-50 text-gray-400 border border-gray-100">
                          No Model
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          product.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : product.status === "out_of_stock"
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {getStatusLabel(product.status)}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-2 hover:bg-slate-100 text-gray-500 rounded-full transition-colors duration-150"
                          title="Edit"
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(product._id)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors duration-150"
                          title="Delete"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && products.length === 0 && (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1">
              No products found
            </h3>
            <p className="text-sm text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={serverPagination.total}
        onPageChange={setPage}
      />

      <ConfirmationDialog
        isOpen={deleteModalOpen}
        title="Delete Product?"
        message="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteModalOpen(false)}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />

      <ProductFormDrawer form={form} categories={categories} />
    </div>
  );
}
