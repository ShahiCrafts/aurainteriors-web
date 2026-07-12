import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Upload,
  Package,
  Box,
  Link as LinkIcon,
  Image,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Tag,
  Activity,
  Layers,
  FileText,
  Ruler,
  Weight,
  Palette,
} from "lucide-react";
import Skeleton from "../../components/common/Skeleton";
import ConfirmationDialog from "../../components/modals/ConfirmationDialog";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "../../hooks/product/useProductTan";

const colorMap = {
  white: "#FFFFFF",
  black: "#1A1A1A",
  gray: "#71717A",
  brown: "#78350F",
  beige: "#F5F5DC",
  navy: "#1E3A8A",
  green: "#15803D",
  red: "#B91C1C",
  blue: "#1D4ED8",
  natural: "#E5C158",
};
import { useCategories } from "../../hooks/product/useCategoryTan";
import { toast } from "react-toastify";
import ImageWithFallback from "../../components/fallbacks/ImageWithFallback";
import {
  getImageUrl as getImageUrlUtil,
  getProductImageUrl,
} from "../../utils/imageUrl";
import formatError from "../../utils/errorHandler";
import { API_V1_URL } from "../../config/constants";

const API_URL = API_V1_URL;

import Pagination from "../../components/common/Pagination";

export default function Products() {
  const fileInputRef = useRef(null);
  const modelFileInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Advanced filters state
  const [stockFilter, setStockFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [modelInputType, setModelInputType] = useState("url");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({}); // { [url]: 0-100 }
  const [showAllImages, setShowAllImages] = useState(false);
  const [modelFiles, setModelFiles] = useState([]); // New file uploads
  const [modelUrls, setModelUrls] = useState([]); // New URL entries
  const [existingModelFiles, setExistingModelFiles] = useState([]); // Existing models (both files and URLs)
  const [isDraggingModel, setIsDraggingModel] = useState(false);
  const [materialInput, setMaterialInput] = useState("");
  const [newModelUrl, setNewModelUrl] = useState(""); // For URL input field
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    price: "",
    originalPrice: "",
    stock: "",
    description: "",
    shortDescription: "",
    status: "active",
    modelUrl: "",
    sku: "",
    style: "",
    isFeatured: false,
    isNewArrival: false,
    dimensions: { width: "", height: "", depth: "" },
    weight: { value: "", unit: "kg" },
    materials: [],
    colors: [],
  });

  const handleAddColor = () => {
    const input = document.createElement("input");
    input.type = "color";
    input.value = "#000000";
    input.style.position = "fixed";
    input.style.top = "-100px";
    input.style.left = "-100px";
    input.style.opacity = "0";
    document.body.appendChild(input);

    const cleanup = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    input.addEventListener("change", (e) => {
      const newColor = e.target.value.toUpperCase();
      setProductForm((prev) => ({
        ...prev,
        colors: prev.colors.includes(newColor)
          ? prev.colors
          : [...prev.colors, newColor],
      }));
      cleanup();
    });

    input.addEventListener("blur", () => {
      setTimeout(cleanup, 300);
    });

    input.click();
  };

  const handleEditColor = (oldColor, currentHex) => {
    const input = document.createElement("input");
    input.type = "color";
    input.value = currentHex.toLowerCase();
    input.style.position = "fixed";
    input.style.top = "-100px";
    input.style.left = "-100px";
    input.style.opacity = "0";
    document.body.appendChild(input);

    const cleanup = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    input.addEventListener("change", (e) => {
      const newColor = e.target.value.toUpperCase();
      setProductForm((prev) => ({
        ...prev,
        colors: prev.colors.map((c) => (c === oldColor ? newColor : c)),
      }));
      cleanup();
    });

    input.addEventListener("blur", () => {
      setTimeout(cleanup, 300);
    });

    input.click();
  };

  const colorOptions = [
    "White",
    "Black",
    "Gray",
    "Brown",
    "Beige",
    "Navy",
    "Green",
    "Red",
    "Blue",
    "Natural",
  ];
  const materialOptions = [
    "Wood",
    "Metal",
    "Fabric",
    "Leather",
    "Glass",
    "Marble",
    "Velvet",
    "Rattan",
  ];
  const styleOptions = [
    "Modern",
    "Contemporary",
    "Traditional",
    "Minimalist",
    "Industrial",
    "Scandinavian",
    "Bohemian",
    "Rustic",
  ];

  // Fetch all products for dynamic overview stats & instant client-side filtering
  const { data: productsData, isLoading } = useProducts({
    status: "all",
    limit: 1000,
  });
  const allProducts = productsData?.data?.products || [];

  // Calculate dynamic stats
  const totalProductsCount = allProducts.length;
  const activeProductsCount = allProducts.filter((p) => p.status === "active").length;
  const outOfStockCount = allProducts.filter((p) => p.stock === 0).length;
  const lowStockCount = allProducts.filter((p) => p.stock > 0 && p.stock < 10).length;
  const modelCount = allProducts.filter((p) => p.modelUrl || p.modelFiles?.length > 0).length;

  // Filter products on the client side
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name?.toLowerCase().includes(query);
        const matchesSku = product.sku?.toLowerCase().includes(query);
        const matchesDesc = product.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesDesc) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== "all") {
        const categoryId = product.category?._id || product.category;
        if (categoryId !== selectedCategory) return false;
      }

      // 3. Status Filter
      if (statusFilter !== "all") {
        if (product.status !== statusFilter) return false;
      }

      // 4. Stock Filter
      if (stockFilter !== "all") {
        if (stockFilter === "outofstock" && product.stock !== 0) return false;
        if (stockFilter === "lowstock" && (product.stock === 0 || product.stock >= 10)) return false;
        if (stockFilter === "instock" && product.stock === 0) return false;
      }

      // 5. 3D Model Filter
      if (modelFilter !== "all") {
        const hasModel = !!(product.modelUrl || product.modelFiles?.length > 0);
        if (modelFilter === "hasmodel" && !hasModel) return false;
        if (modelFilter === "nomodel" && hasModel) return false;
      }

      return true;
    });
  }, [allProducts, searchQuery, selectedCategory, statusFilter, stockFilter, modelFilter]);

  // Calculate paginated slice
  const products = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, page, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;

  // Fetch categories for filter and form
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data?.categories || [];

  // Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category: product.category?._id || product.category || "",
        price: product.price?.toString() || "",
        originalPrice: product.originalPrice?.toString() || "",
        stock: product.stock?.toString() || "",
        description: product.description || "",
        shortDescription: product.shortDescription || "",
        status: product.status || "active",
        modelUrl: product.modelUrl || "",
        sku: product.sku || "",
        style: product.style || "",
        isFeatured: product.isFeatured || false,
        isNewArrival: product.isNewArrival || false,
        dimensions: product.dimensions || { width: "", height: "", depth: "" },
        weight: product.weight || { value: "", unit: "kg" },
        materials: product.materials || [],
        colors: product.colors || [],
      });
      setModelInputType(
        product.modelUrl || product.modelFiles?.length > 0
          ? product.modelUrl
            ? "url"
            : "upload"
          : "url"
      );
      // Set existing images as previews
      if (product.images?.length > 0) {
        setImagePreviews(
          product.images.map((img) => ({
            url: getImageUrlUtil(img.url, "products"),
            existing: true,
            originalUrl: img.url,
          }))
        );
      } else {
        setImagePreviews([]);
      }
      setImageFiles([]);
      // Set existing model files (both uploaded and URL-based)
      if (product.modelFiles?.length > 0) {
        setExistingModelFiles(
          product.modelFiles.map((model) => ({
            ...model,
            existing: true,
          }))
        );
      } else {
        setExistingModelFiles([]);
      }
      setModelFiles([]);
      setModelUrls([]);
      setNewModelUrl("");
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        category: categories[0]?._id || "",
        price: "",
        originalPrice: "",
        stock: "",
        description: "",
        shortDescription: "",
        status: "active",
        modelUrl: "",
        sku: "",
        style: "",
        isFeatured: false,
        isNewArrival: false,
        dimensions: { width: "", height: "", depth: "" },
        weight: { value: "", unit: "kg" },
        materials: [],
        colors: [],
      });
      setModelInputType("url");
      setImageFiles([]);
      setImagePreviews([]);
      setModelFiles([]);
      setModelUrls([]);
      setExistingModelFiles([]);
      setNewModelUrl("");
    }
    setActiveTab("basic");
    setShowAllImages(false);
    setUploadProgress({});
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);

    // Create previews for new files with upload progress simulation
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result;
        setImagePreviews((prev) => [
          ...prev,
          { url: previewUrl, existing: false, file },
        ]);

        // Simulate upload progress
        setUploadProgress((prev) => ({ ...prev, [previewUrl]: 0 }));
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 25 + 10;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            // Remove from progress map after a short delay to show completion
            setTimeout(() => {
              setUploadProgress((prev) => {
                const next = { ...prev };
                delete next[previewUrl];
                return next;
              });
            }, 400);
          }
          setUploadProgress((prev) => ({ ...prev, [previewUrl]: Math.min(progress, 100) }));
        }, 200);
      };
      reader.readAsDataURL(file);
    });
  };

  const getFileName = (url) => {
    if (!url) return "";
    try {
      const decodedUrl = decodeURIComponent(url);
      const parts = decodedUrl.split("/");
      return parts[parts.length - 1];
    } catch (e) {
      return url.substring(url.lastIndexOf("/") + 1);
    }
  };

  const handleModelFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    addModelFiles(files);
  };

  const addModelFiles = (files) => {
    const validExtensions = [".glb", ".gltf", ".usdz"];
    const validFiles = [];

    for (const file of files) {
      const fileExtension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        toast.error(
          `Invalid file format: ${file.name}. Please upload .glb, .gltf, or .usdz files`
        );
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File size exceeds 50MB limit: ${file.name}`);
        continue;
      }

      const format = fileExtension.replace(".", "");

      validFiles.push({
        file,
        name: file.name,
        size: file.size,
        format,
        platform: format === "usdz" ? "ios" : "android",
      });
    }

    if (validFiles.length > 0) {
      setModelFiles((prev) => [...prev, ...validFiles]);
      // Clear the URL input when files are uploaded
      setProductForm((prev) => ({ ...prev, modelUrl: "" }));
    }
  };

  const handleModelDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingModel(true);
  };

  const handleModelDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingModel(false);
  };

  const handleModelDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingModel(false);

    const files = Array.from(e.dataTransfer.files || []);
    addModelFiles(files);
  };

  const removeModelFile = (index, isExisting = false, isUrl = false) => {
    if (isExisting) {
      setExistingModelFiles((prev) => prev.filter((_, i) => i !== index));
    } else if (isUrl) {
      setModelUrls((prev) => prev.filter((_, i) => i !== index));
    } else {
      setModelFiles((prev) => prev.filter((_, i) => i !== index));
    }
    if (modelFileInputRef.current) {
      modelFileInputRef.current.value = "";
    }
  };

  const addModelUrl = () => {
    if (!newModelUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Validate URL format
    try {
      new URL(newModelUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    // Detect format from URL
    const url = newModelUrl.toLowerCase();
    let format = "";
    if (url.includes(".glb")) {
      format = "glb";
    } else if (url.includes(".gltf")) {
      format = "gltf";
    } else if (url.includes(".usdz")) {
      format = "usdz";
    } else {
      toast.error("URL must point to a .glb, .gltf, or .usdz file");
      return;
    }

    const platform = format === "usdz" ? "ios" : "android";

    setModelUrls((prev) => [
      ...prev,
      {
        url: newModelUrl.trim(),
        format,
        platform,
        isExternal: true,
      },
    ]);
    setNewModelUrl("");
  };

  const removeImage = (index) => {
    const preview = imagePreviews[index];
    if (preview.existing) {
      // Mark for removal on save
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      // Remove from new files
      setImageFiles((prev) =>
        prev.filter(
          (_, i) => i !== index - imagePreviews.filter((p) => p.existing).length
        )
      );
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.category) {
      toast.error("Please fill in required fields");
      return;
    }

    const formData = {
      name: productForm.name,
      category: productForm.category,
      price: productForm.price,
      stock: productForm.stock || 0,
      status: productForm.status,
    };

    if (productForm.originalPrice)
      formData.originalPrice = productForm.originalPrice;
    if (productForm.description) formData.description = productForm.description;
    if (productForm.shortDescription)
      formData.shortDescription = productForm.shortDescription;
    if (productForm.modelUrl) formData.modelUrl = productForm.modelUrl;
    if (productForm.sku) formData.sku = productForm.sku;
    if (productForm.style) formData.style = productForm.style;
    formData.isFeatured = productForm.isFeatured;
    formData.isNewArrival = productForm.isNewArrival;

    if (
      productForm.dimensions.width ||
      productForm.dimensions.height ||
      productForm.dimensions.depth
    ) {
      formData.dimensions = productForm.dimensions;
    }
    if (productForm.weight.value) {
      formData.weight = productForm.weight;
    }
    formData.materials = productForm.materials;
    formData.colors = productForm.colors;

    // Add new images
    if (imageFiles.length > 0) {
      formData.images = imageFiles;
    }

    // Add 3D model files if uploaded
    if (modelFiles.length > 0) {
      formData.modelFiles = modelFiles.map((m) => m.file);
    }

    // Add 3D model URLs
    if (modelUrls.length > 0) {
      formData.modelUrls = modelUrls.map((m) => ({
        url: m.url,
        format: m.format,
        platform: m.platform,
      }));
    }

    // Track removed images for update
    if (editingProduct) {
      const existingUrls = editingProduct.images?.map((img) => img.url) || [];
      const remainingUrls = imagePreviews
        .filter((p) => p.existing)
        .map((p) => p.originalUrl);
      const removedImages = existingUrls.filter(
        (url) => !remainingUrls.includes(url)
      );
      if (removedImages.length > 0) {
        formData.removeImages = removedImages;
      }

      // Track removed model files for update
      const existingModelUrls =
        editingProduct.modelFiles?.map((m) => m.url) || [];
      const remainingModelUrls = existingModelFiles.map((m) => m.url);
      const removedModelFiles = existingModelUrls.filter(
        (url) => !remainingModelUrls.includes(url)
      );
      if (removedModelFiles.length > 0) {
        formData.removeModelFiles = removedModelFiles;
      }
    }

    try {
      if (editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct._id,
          data: formData,
        });
        toast.success("Product updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Product created successfully");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(formatError(err, "Something went wrong"));
    }
  };

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

  const handleToggle = (field, value) => {
    if (field === "colors" || field === "materials") {
      setProductForm((prev) => ({
        ...prev,
        [field]: prev[field].includes(value)
          ? prev[field].filter((v) => v !== value)
          : [...prev[field], value],
      }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-teal-50 text-teal-700";
      case "out_of_stock":
        return "bg-red-50 text-red-700";
      case "draft":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
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
              <p className="text-sm font-medium text-gray-500 mb-1">Total Catalog</p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{totalProductsCount}</p>
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
              <p className="text-sm font-medium text-gray-500 mb-1">Active Listings</p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{activeProductsCount}</p>
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
              <p className="text-sm font-medium text-gray-500 mb-1">Stock Alerts</p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {outOfStockCount} <span className="text-xs font-semibold text-red-500">Out</span> / {lowStockCount} <span className="text-xs font-semibold text-amber-500">Low</span>
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
              <p className="text-sm font-medium text-gray-500 mb-1">3D Models Ready</p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{modelCount}</p>
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
                <option value="all">Stock Status: All</option>
                <option value="instock">In Stock</option>
                <option value="lowstock">Low Stock (&lt;10)</option>
                <option value="outofstock">Out of Stock</option>
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
                <option value="all">3D Model: All</option>
                <option value="hasmodel">Has 3D Model</option>
                <option value="nomodel">No 3D Model</option>
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
                  <th className="px-6 py-4"><Skeleton className="h-4 w-24" /></th>
                  <th className="px-6 py-4"><Skeleton className="h-4 w-20" /></th>
                  <th className="px-6 py-4"><Skeleton className="h-4 w-16" /></th>
                  <th className="px-6 py-4"><Skeleton className="h-4 w-16" /></th>
                  <th className="px-6 py-4"><Skeleton className="h-4 w-20" /></th>
                  <th className="px-6 py-4"><Skeleton className="h-4 w-16" /></th>
                  <th className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></th>
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
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
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
                            {product.sku || product._id?.slice(-8).toUpperCase()}
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
                          NRs. {product.price?.toLocaleString()}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through ml-2">
                            NRs. {product.originalPrice?.toLocaleString()}
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
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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
        totalItems={filteredProducts.length}
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

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 px-6">
                {[
                  { id: "basic", label: "Basic Info", icon: FileText },
                  { id: "3dmodel", label: "3D Model", icon: Box },
                  { id: "details", label: "Details", icon: Layers },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${activeTab === tab.id
                      ? "border-teal-600 text-teal-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    <tab.icon className="w-4.5 h-4.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {/* Basic Info Tab */}
                {activeTab === "basic" && (
                  <div className="space-y-4">
                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Product Images
                        {imagePreviews.length > 0 && (
                          <span className="ml-1.5 text-xs font-normal text-gray-400">
                            ({imagePreviews.length} {imagePreviews.length === 1 ? 'image' : 'images'})
                          </span>
                        )}
                      </label>
                      {imagePreviews.length === 0 ? (
                        /* ── Empty State: Styled Dashed Dropzone ── */
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-xl py-8 px-6 text-center hover:border-teal-400 transition-all cursor-pointer group bg-gray-50/30 hover:bg-teal-50/20"
                        >
                          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-100 transition-colors">
                            <Image className="w-6 h-6 text-teal-500" />
                          </div>
                          <p className="text-sm font-semibold text-gray-600">
                            <span className="text-teal-600">Click to upload</span>{" "}
                            product images
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            JPG, PNG, WEBP less than 5MB
                          </p>
                        </div>
                      ) : (
                        /* ── Populated State: Max 3 visible + overflow overlay ── */
                        <div className="flex flex-wrap gap-3 items-start">
                          {(() => {
                            const MAX_VISIBLE = 3;
                            const total = imagePreviews.length;
                            const overflowCount = total - MAX_VISIBLE;
                            const hasOverflow = overflowCount > 0 && !showAllImages;
                            const visible = showAllImages
                              ? imagePreviews
                              : imagePreviews.slice(0, MAX_VISIBLE);

                            return (
                              <>
                                {visible.map((preview, index) => {
                                  const isUploading = uploadProgress[preview.url] !== undefined;
                                  const progress = uploadProgress[preview.url] || 0;
                                  const isLastVisible = !showAllImages && index === MAX_VISIBLE - 1 && hasOverflow;

                                  return (
                                    <motion.div
                                      key={preview.url || index}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.9 }}
                                      transition={{ type: "spring", stiffness: 350, damping: 22 }}
                                      className="relative w-[122px] h-[122px] rounded-xl overflow-hidden border border-gray-200 group bg-gray-50 shrink-0"
                                    >
                                      <img
                                        src={preview.url}
                                        alt={`Preview ${index + 1}`}
                                        className={`w-full h-full object-cover transition-all duration-200 ${isUploading ? 'brightness-50 scale-105' : 'group-hover:scale-105'}`}
                                      />

                                      {/* +N More overlay on last visible image */}
                                      {isLastVisible && !isUploading && (
                                        <button
                                          type="button"
                                          onClick={() => setShowAllImages(true)}
                                          className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-black/50 transition-colors hover:bg-black/60"
                                        >
                                          <span className="text-xl font-bold text-white">+{overflowCount}</span>
                                          <span className="text-[10px] font-semibold text-white/80 mt-0.5">more</span>
                                        </button>
                                      )}

                                      {/* Upload Progress Overlay */}
                                      {isUploading && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                                          <span className="text-[10px] font-bold text-white tracking-wide uppercase">
                                            Uploading
                                          </span>
                                          <div className="w-14 h-1.5 bg-white/30 rounded-full overflow-hidden">
                                            <motion.div
                                              className="h-full bg-white rounded-full"
                                              initial={{ width: 0 }}
                                              animate={{ width: `${progress}%` }}
                                              transition={{ ease: "easeOut", duration: 0.2 }}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Remove button — hidden during upload & overlay */}
                                      {!isUploading && !isLastVisible && (
                                        <button
                                          type="button"
                                          onClick={() => removeImage(index)}
                                          className="absolute top-1 right-1 p-0.5 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                          title="Remove image"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </motion.div>
                                  );
                                })}

                                {/* Collapse button when showing all */}
                                {showAllImages && overflowCount > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setShowAllImages(false)}
                                    className="w-[122px] h-[122px] rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all shrink-0 text-xs font-semibold text-gray-400"
                                  >
                                    Show less
                                  </button>
                                )}

                                {/* Add Image Dashed Card */}
                                <div
                                  onClick={() => fileInputRef.current?.click()}
                                  className="w-[122px] h-[122px] rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-400 bg-gray-50/50 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-teal-50/30 group shrink-0"
                                  title="Upload more images"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors mb-1.5">
                                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition-colors" />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-400 group-hover:text-teal-600 transition-colors">
                                    Add Image
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
                        placeholder="Enter product name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          value={productForm.category}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              category: e.target.value,
                            })
                          }
                          className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white"
                        >
                          <option value="">Select Category</option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={productForm.status}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              status: e.target.value,
                            })
                          }
                          className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white"
                        >
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                          <option value="out_of_stock">Out of Stock</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price *
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                            Rs.
                          </span>
                          <input
                            type="number"
                            value={productForm.price}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                price: e.target.value,
                              })
                            }
                            className="w-full pl-12 pr-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Original Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                            Rs.
                          </span>
                          <input
                            type="number"
                            value={productForm.originalPrice}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                originalPrice: e.target.value,
                              })
                            }
                            className="w-full pl-12 pr-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stock
                        </label>
                        <input
                          type="number"
                          value={productForm.stock}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              stock: e.target.value,
                            })
                          }
                          className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SKU
                        </label>
                        <input
                          type="text"
                          value={productForm.sku}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              sku: e.target.value,
                            })
                          }
                          className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
                          placeholder="SKU-001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Style
                        </label>
                        <select
                          value={productForm.style}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              style: e.target.value,
                            })
                          }
                          className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white"
                        >
                          <option value="">Select Style</option>
                          {styleOptions.map((style) => (
                            <option key={style} value={style.toLowerCase()}>
                              {style}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Short Description
                      </label>
                      <input
                        type="text"
                        value={productForm.shortDescription}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            shortDescription: e.target.value,
                          })
                        }
                        className="w-full px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
                        placeholder="Brief description for listings"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={productForm.description}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all resize-none"
                        placeholder="Enter product description"
                      />
                    </div>

                    {/* Featured & New Arrival toggles */}
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.isFeatured}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              isFeatured: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
                        />
                        <span className="text-sm text-gray-700">
                          Featured Product
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.isNewArrival}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              isNewArrival: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-gray-300 text-[#025E5D] focus:ring-[#025E5D]"
                        />
                        <span className="text-sm text-gray-700">
                          New Arrival
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 3D Model Tab */}
                {activeTab === "3dmodel" && (
                  <div className="space-y-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Box className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-purple-800">
                            3D Model for AR/VR Experience
                          </p>
                          <p className="text-sm text-purple-700 mt-0.5">
                            Upload a 3D model to enable customers to view this
                            product in AR on their devices. Supported formats:
                            .glb, .gltf, .usdz (for iOS)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Input Type Toggle */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Add 3D Model
                      </label>
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => setModelInputType("url")}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 h-10 rounded-lg border text-sm font-medium transition-all cursor-pointer ${modelInputType === "url"
                            ? "border-teal-600 bg-teal-50 text-teal-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                          <LinkIcon className="w-4 h-4" />
                          URL / Link
                        </button>
                        <button
                          type="button"
                          onClick={() => setModelInputType("upload")}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 h-10 rounded-lg border text-sm font-medium transition-all cursor-pointer ${modelInputType === "upload"
                            ? "border-teal-600 bg-teal-50 text-teal-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                          <Upload className="w-4 h-4" />
                          Upload File
                        </button>
                      </div>
                    </div>

                    {/* URL Input */}
                    {modelInputType === "url" && (
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">
                          Add 3D Model URL
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={newModelUrl}
                            onChange={(e) => setNewModelUrl(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), addModelUrl())
                            }
                            className="flex-1 px-4 h-10 bg-white rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm font-medium transition-all"
                            placeholder="https://example.com/model.glb"
                          />
                          <button
                            type="button"
                            onClick={addModelUrl}
                            className="px-4 h-10 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Enter URLs to .glb, .gltf, or .usdz files. Format is
                          auto-detected from URL.
                        </p>
                      </div>
                    )}

                    {/* File Upload */}
                    {modelInputType === "upload" && (
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">
                          Upload 3D Model File
                        </label>
                        {existingModelFiles.filter((m) => !m.isExternal).length + modelFiles.length === 0 ? (
                          <div
                            onClick={() => modelFileInputRef.current?.click()}
                            onDragOver={handleModelDragOver}
                            onDragLeave={handleModelDragLeave}
                            onDrop={handleModelDrop}
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDraggingModel
                              ? "border-teal-500 bg-teal-500/5"
                              : "border-gray-200 hover:border-teal-500"
                              }`}
                          >
                            <Box className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-gray-700">
                              Drop your 3D models here
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              or click to browse
                            </p>
                            <p className="text-[10px] text-gray-400 mt-2">
                              Supported: .glb, .gltf, .usdz (max 50MB each)
                            </p>
                          </div>
                        ) : (
                          <div
                            onClick={() => modelFileInputRef.current?.click()}
                            onDragOver={handleModelDragOver}
                            onDragLeave={handleModelDragLeave}
                            onDrop={handleModelDrop}
                            className={`border-2 border-dashed rounded-lg py-3 px-4 text-center transition-colors cursor-pointer flex items-center justify-center gap-2 hover:bg-gray-50/80 ${isDraggingModel
                              ? "border-teal-500 bg-teal-500/5"
                              : "border-gray-200 hover:border-teal-500"
                              }`}
                          >
                            <Upload className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-500">
                              Upload another model file
                            </span>
                          </div>
                        )}
                        <input
                          ref={modelFileInputRef}
                          type="file"
                          accept=".glb,.gltf,.usdz"
                          multiple
                          onChange={handleModelFileChange}
                          className="hidden"
                        />
                      </div>
                    )}

                    {/* Unified 3D Models List (Shown always) */}
                    {(existingModelFiles.length > 0 || modelFiles.length > 0 || modelUrls.length > 0) && (
                      <div className="space-y-3.5 pt-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Current 3D Models ({existingModelFiles.length + modelFiles.length + modelUrls.length})
                        </label>
                        
                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                          {/* 1. Existing Model Files (from Database) */}
                          {existingModelFiles.map((model, index) => (
                            <div key={`existing-${index}`} className="border border-gray-100 bg-white hover:border-teal-200 transition-all rounded-lg p-3 flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                  model.platform === "ios" ? "bg-indigo-50 text-indigo-650" : "bg-blue-55 text-blue-650"
                                }`}>
                                  {model.isExternal ? <LinkIcon className="w-4.5 h-4.5 text-indigo-600" /> : <Box className="w-4.5 h-4.5 text-blue-600" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-800 truncate max-w-[280px] sm:max-w-[380px]" title={model.url}>
                                    {getFileName(model.url)}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100">
                                      {model.format}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100/50">
                                      {model.isExternal ? "URL Link" : "Stored File"}
                                    </span>
                                    {model.fileSize && (
                                      <span className="text-[10px] font-medium text-gray-400">
                                        {(model.fileSize / (1024 * 1024)).toFixed(2)} MB
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeModelFile(existingModelFiles.indexOf(model), true)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}

                          {/* 2. New Uploaded Files */}
                          {modelFiles.map((model, index) => (
                            <div key={`new-file-${index}`} className="border border-gray-100 bg-white hover:border-teal-200 transition-all rounded-lg p-3 flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                  <Box className="w-4.5 h-4.5 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-800 truncate max-w-[280px] sm:max-w-[380px]" title={model.name}>
                                    {model.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100">
                                      {model.format}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100/50">
                                      New File
                                    </span>
                                    <span className="text-[10px] font-medium text-gray-400">
                                      {(model.size / (1024 * 1024)).toFixed(2)} MB
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeModelFile(index, false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}

                          {/* 3. New URL Links */}
                          {modelUrls.map((model, index) => (
                            <div key={`new-url-${index}`} className="border border-gray-100 bg-white hover:border-teal-200 transition-all rounded-lg p-3 flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                  <LinkIcon className="w-4.5 h-4.5 text-indigo-650" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-800 truncate max-w-[280px] sm:max-w-[380px]" title={model.url}>
                                    {getFileName(model.url)}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100">
                                      {model.format}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100/50">
                                      New URL Link
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeModelFile(index, false, true)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cross-platform AR Note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            Cross-Platform AR Support
                          </p>
                          <p className="text-sm text-blue-700 mt-0.5">
                            For the best AR experience across all devices:
                          </p>
                          <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
                            <li>
                              <strong>.glb/.gltf</strong> - For Android devices
                              and web browsers
                            </li>
                            <li>
                              <strong>.usdz</strong> - For iOS devices
                              (iPhone/iPad)
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Details Tab */}
                {activeTab === "details" && (
                  <div className="space-y-4">
                    {/* Dimensions */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Dimensions (Width x Height x Depth cm)
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <Ruler className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="number"
                            value={productForm.dimensions.width}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                dimensions: {
                                  ...productForm.dimensions,
                                  width: e.target.value,
                                },
                              })
                            }
                            className="w-full pl-9 pr-14 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 pointer-events-none select-none">
                            Width
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <Ruler className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="number"
                            value={productForm.dimensions.height}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                dimensions: {
                                  ...productForm.dimensions,
                                  height: e.target.value,
                                },
                              })
                            }
                            className="w-full pl-9 pr-16 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 pointer-events-none select-none">
                            Height
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <Ruler className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="number"
                            value={productForm.dimensions.depth}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                dimensions: {
                                  ...productForm.dimensions,
                                  depth: e.target.value,
                                },
                              })
                            }
                            className="w-full pl-9 pr-14 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 pointer-events-none select-none">
                            Depth
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Weight */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Weight
                      </label>
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <Weight className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="number"
                            value={productForm.weight.value}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                weight: {
                                  ...productForm.weight,
                                  value: e.target.value,
                                },
                              })
                            }
                            className="w-full pl-9 pr-16 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 pointer-events-none select-none">
                            Weight
                          </span>
                        </div>
                        <select
                          value={productForm.weight.unit}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              weight: {
                                ...productForm.weight,
                                unit: e.target.value,
                              },
                            })
                          }
                          className="w-24 px-4 h-10 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none text-sm transition-all bg-white"
                        >
                          <option value="kg">kg</option>
                          <option value="lb">lb</option>
                        </select>
                      </div>
                    </div>

                    {/* Materials */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Materials
                      </label>
                      <div className="w-full min-h-[48px] px-3 py-2.5 rounded-lg border border-gray-200 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/10 bg-white transition-all flex flex-wrap gap-2 items-center">
                        {productForm.materials.map((material, idx) => (
                          <div
                            key={`${material}-${idx}`}
                            className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold"
                          >
                            <span>{material}</span>
                            <button
                              type="button"
                              onClick={() => handleToggle("materials", material)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <input
                          type="text"
                          value={materialInput}
                          onChange={(e) => setMaterialInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && materialInput.trim()) {
                              e.preventDefault();
                              const newMaterial = materialInput.trim();
                              if (!productForm.materials.includes(newMaterial)) {
                                setProductForm(prev => ({
                                  ...prev,
                                  materials: [...prev.materials, newMaterial]
                                }));
                              }
                              setMaterialInput("");
                            } else if (e.key === "Backspace" && !materialInput && productForm.materials.length > 0) {
                              setProductForm(prev => ({
                                ...prev,
                                materials: prev.materials.slice(0, -1)
                              }));
                            }
                          }}
                          placeholder={productForm.materials.length === 0 ? "Type a material and press Enter..." : "Add more..."}
                          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-700"
                        />
                      </div>
                    </div>

                    {/* Colors */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Available Colors
                      </label>
                      <div className="flex flex-wrap gap-2.5 items-center">
                        {/* Add color button */}
                        <button
                          type="button"
                          onClick={handleAddColor}
                          className="w-[154px] h-10 rounded-lg text-sm font-semibold border border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Color
                        </button>

                        {/* Color Cards */}
                        {productForm.colors.map((color) => {
                          const hex = color.startsWith("#")
                            ? color
                            : colorMap[color.toLowerCase()] || "#FFFFFF";

                          return (
                            <div
                              key={color}
                              className="w-[154px] h-10 flex items-center transition-all group shrink-0"
                            >
                              {/* Color square — click to edit */}
                              <button
                                type="button"
                                onClick={() => handleEditColor(color, hex)}
                                className="w-10 h-10 shrink-0 cursor-pointer rounded-l-lg transition-opacity hover:opacity-80"
                                style={{ backgroundColor: hex }}
                                title="Click to change color"
                              />
                              {/* Hex label & Remove wrapper */}
                              <div className="flex-1 h-full flex items-center bg-white border border-l-0 border-gray-200 rounded-r-lg">
                                {/* Hex label */}
                                <span className="flex-1 px-2.5 text-xs font-semibold text-gray-600 select-none tracking-wide text-center">
                                  {hex.toUpperCase()}
                                </span>
                                {/* Remove button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggle("colors", color)}
                                  className="w-8 h-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer border-l border-gray-100 rounded-r-lg"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 p-6 border-t border-gray-100">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProduct}
                  disabled={
                    !productForm.name ||
                    !productForm.price ||
                    !productForm.category ||
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                  className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : editingProduct ? (
                    "Update Product"
                  ) : (
                    "Add Product"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
