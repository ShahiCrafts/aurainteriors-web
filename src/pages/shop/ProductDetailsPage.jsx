import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  Star,
  Minus,
  Plus,
  RotateCcw,
  Truck,
  ShieldCheck,
  Loader2,
  Heart,
  Share2,
  Hammer,
  Leaf,
  ShoppingBag,
  PenLine,
  Edit2,
  MoveRight,
} from "lucide-react";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";
import { useProduct, useRelatedProducts } from "../../hooks/product/useProductTan";
import { useAddToWishlist, useRemoveFromWishlist, useCheckWishlist } from "../../hooks/cart/useWishlistTan";
import { useAddToCart } from "../../hooks/cart/useCartTan";
import useAuthStore from "../../store/authStore";
import useGuestCartStore from "../../store/guestCartStore";
import { toast } from "react-toastify";
import ProductCard from "../../components/shop/ProductCard";
import ImageMagnifier from "../../components/shop/ImageMagnifier";
import ARViewModal from "../../components/modals/ARViewModal";
import ReviewModal from "../../components/modals/ReviewModal";
import ReviewSection from "../../components/shop/ReviewSection";
import arIcon from "../../assets/icons/ar_icon.png";
import { getImageUrl as getImageUrlUtil } from "../../utils/imageUrl";
import formatError from "../../utils/errorHandler";
import CategoryBar from "../../components/navigation/CategoryBar";
import { useCanReview, useUserReview } from "../../hooks/review/useReviewTan";

export default function ProductDetailsPage() {
  const { productSlug } = useParams();
  const { isAuthenticated } = useAuthStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [expandedSections, setExpandedSections] = useState({});
  const [activeTab, setActiveTab] = useState("materials");
  const [activeMainTab, setActiveMainTab] = useState("specifications");
  const [isARModalOpen, setIsARModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [scrolledPastAction, setScrolledPastAction] = useState(false);
  const reviewsSectionRef = useRef(null);

  // Check scroll position to toggle sticky "Add to Cart"
  useEffect(() => {
    const handleScroll = () => {
      const mainBtn = document.getElementById("main-add-to-cart");
      if (mainBtn) {
        const rect = mainBtn.getBoundingClientRect();
        // Hide sticky when main button is in view
        setScrolledPastAction(rect.bottom < 0);
      } else {
        // Fallback to fixed scroll position if button not found
        setScrolledPastAction(window.scrollY > 800);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch product data
  const { data: productData, isLoading, error } = useProduct(productSlug);
  const product = productData?.data?.product;

  // Wishlist hooks
  const { data: wishlistCheck } = useCheckWishlist(product?._id, { enabled: isAuthenticated && !!product?._id });
  const { mutate: addToWishlist, isPending: isAddingToWishlist } = useAddToWishlist();
  const { mutate: removeFromWishlist, isPending: isRemovingFromWishlist } = useRemoveFromWishlist();

  const isInWishlist = wishlistCheck?.data?.inWishlist || false;
  const isWishlistLoading = isAddingToWishlist || isRemovingFromWishlist;

  // Review permission hooks
  const { data: canReviewData } = useCanReview(product?._id, { enabled: isAuthenticated && !!product?._id });
  const { data: userReviewData } = useUserReview(product?._id);
  const hasReviewed = canReviewData?.data?.hasReviewed;
  const userReview = userReviewData?.data?.review;

  const handleOpenReviewModal = (review = null) => {
    setEditingReview(review);
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
    setEditingReview(null);
  };

  // Cart hooks
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
  const { addItem: addToGuestCart } = useGuestCartStore();

  const handleAddToCart = () => {
    const variant = {};
    if (selectedColor) {
      variant.color = typeof selectedColor === "object" ? selectedColor.name : selectedColor;
    }
    if (selectedSize) {
      variant.size = typeof selectedSize === "object" ? selectedSize.name : selectedSize;
    }

    if (!isAuthenticated) {
      // Use guest cart for unauthenticated users
      addToGuestCart(product, quantity, variant);
      toast.success("Added to cart");
      setQuantity(1);
      return;
    }

    addToCart(
      { productId: product._id, quantity, variant },
      {
        onSuccess: () => {
          toast.success("Added to cart");
          setQuantity(1);
        },
        onError: (err) => {
          toast.error(formatError(err, "Failed to add to cart"));
        },
      }
    );
  };

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to wishlist");
      return;
    }

    if (isInWishlist) {
      removeFromWishlist(product._id, {
        onSuccess: () => toast.success("Removed from wishlist"),
        onError: (err) => toast.error(formatError(err, "Failed to remove from wishlist")),
      });
    } else {
      addToWishlist(product._id, {
        onSuccess: () => toast.success("Added to wishlist"),
        onError: (err) => toast.error(formatError(err, "Failed to add to wishlist")),
      });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Aura Interiors`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      // Ignore abort errors from user cancelling share
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
        toast.error("Failed to share");
      }
    }
  };

  // Fetch related products
  const { data: relatedData } = useRelatedProducts(product?._id, 4);
  const relatedProducts = relatedData?.data?.products || [];

  // Set default selections when product loads
  useEffect(() => {
    if (product) {
      if (product.colors?.length > 0 && !selectedColor) {
        setSelectedColor(product.colors[0]);
      }
      if (product.sizes?.length > 0 && !selectedSize) {
        setSelectedSize(product.sizes[0]);
      }
    }
  }, [product]);

  // Build breadcrumbs
  const buildBreadcrumbs = () => {
    const crumbs = [{ name: "Home", path: "/" }];
    if (product?.category) {
      if (product.category.parent) {
        crumbs.push({
          name: product.category.parent.name,
          path: `/shop/${product.category.parent.slug}`,
        });
      }
      crumbs.push({
        name: product.category.name,
        path: `/shop/${product.category.slug}`,
      });
    }
    if (product) {
      crumbs.push({ name: product.name, path: "#" });
    }
    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  // Get product images
  const getImages = () => {
    if (!product?.images?.length) {
      return [{ url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop" }];
    }
    return product.images;
  };

  const images = getImages();

  const getImageUrl = (image) => getImageUrlUtil(image?.url, "products");

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-NP", {
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Calculate discount
  const getDiscount = () => {
    if (product?.originalPrice && product?.price) {
      const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      return discount > 0 ? discount : null;
    }
    return null;
  };

  // Calculate savings
  const getSavings = () => {
    if (product?.originalPrice && product?.price) {
      return product.originalPrice - product.price;
    }
    return 0;
  };

  // Toggle accordion section
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle quantity change
  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 10)) {
      setQuantity(newQuantity);
    }
  };

  // Product details sections - handle missing data gracefully with brand fallbacks
  const detailSections = [
    {
      id: "materials",
      title: "Materials & Composition",
      content: product?.materials?.length > 0
        ? `This piece is meticulously crafted using ${product.materials.join(", ")} and finished with our signature hand-applied oils for a lasting, premium feel.`
        : "Premium, sustainably sourced materials selected for their durability and natural beauty. Every joint is handcrafted for structural integrity."
    },
    product?.dimensions && (product.dimensions.width || product.dimensions.height || product.dimensions.depth) && {
      id: "dimensions",
      title: "Dimensions",
      content: `${product.dimensions.width || 0}${product.dimensions.unit || 'cm'} (W) x ${product.dimensions.height || 0}${product.dimensions.unit || 'cm'} (H) x ${product.dimensions.depth || 0}${product.dimensions.unit || 'cm'} (D)`
    },
    {
      id: "warranty",
      title: "Aura Warranty",
      content: product?.warranty || "Aura Interiors provides a 5-Year limited structural warranty on all premium furniture. We stand by our craftsmanship and ensure your investment is protected against any manufacturing defects."
    },
    {
      id: "shipping",
      title: "Shipping & White-Glove Service",
      content: product?.shippingInfo || "Enjoy free white-glove delivery and assembly in Kathmandu. Our professional team will place your piece in the room of your choice and remove all packaging. We offer a 30-day hassle-free return policy."
    },
    product?.careInstructions && { id: "care", title: "Care Instructions", content: product.careInstructions },
  ].filter(Boolean);

  const colors = product?.colors || [];
  const sizes = product?.sizes || [];

  if (isLoading) {
    return (
      <>
        <Navbar /><CategoryBar />
        <main className="min-h-screen bg-white pt-20 font-dm-sans">
          <div className="flex items-center justify-center h-96">
            <Loader2 size={40} className="text-[#F27318] animate-spin" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Navbar /><CategoryBar />
        <main className="min-h-screen bg-white pt-20 font-dm-sans">
          <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-playfair text-neutral-900 mb-4">Product Not Found</h1>
            <p className="text-neutral-500 font-dm-sans mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Link
              to="/shop"
              className="inline-block bg-[#F27318] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#D9620E] transition-colors font-dm-sans"
            >
              Browse Products
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const discount = getDiscount();
  const savings = getSavings();

  return (
    <>
      <Navbar />
      <CategoryBar />
      <main className="min-h-screen bg-white pt-4 font-dm-sans pb-24 lg:pb-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
          {/* Breadcrumb */}
          <nav className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[14px] font-medium mb-8">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <ChevronRight size={14} className="text-neutral-400 shrink-0" />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-neutral-500 truncate max-w-[150px] sm:max-w-[300px]">{crumb.name}</span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="text-neutral-600 hover:text-[#F27318] transition-colors whitespace-nowrap"
                  >
                    {crumb.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mb-2">
            {/* Image Gallery */}
            <div className="lg:col-span-6 space-y-6">
              {/* Main Image */}
              <div className="relative rounded-xl overflow-hidden bg-black/[0.02] border border-black/[0.05]">
                <ImageMagnifier
                  src={getImageUrl(images[selectedImage])}
                  alt={product.name}
                  magnifierSize={180}
                  zoomLevel={2.5}
                  className="aspect-[4/3] w-full"
                />

                {/* Bestseller Badge */}
                {product.isFeatured && (
                  <div className="absolute top-4 left-4 bg-[#F27318] text-white text-[11px] font-bold px-4 py-1.5 rounded-md uppercase tracking-widest font-dm-sans shadow-lg">
                    Bestseller
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button
                    onClick={handleWishlistToggle}
                    disabled={isWishlistLoading}
                    className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-sm flex items-center justify-center hover:bg-white transition-all disabled:opacity-50"
                  >
                    <Heart
                      size={18}
                      className={isInWishlist ? "fill-red-500 text-red-500" : "text-black/40"}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-sm flex items-center justify-center hover:bg-white transition-all text-black/40"
                  >
                    <Share2 size={18} />
                  </button>
                </div>

                {/* 3D/AR View Button */}
                <button
                  onClick={() => setIsARModalOpen(true)}
                  className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-xl border border-neutral-100 flex items-center justify-center hover:bg-neutral-50 transition-colors shadow-sm"
                >
                  <img src={arIcon} alt="AR View" className="w-5 h-5" />
                </button>

                {/* Pagination Dots - Mobile Only */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full transition-all duration-300 ${selectedImage === index ? "w-5 bg-[#F27318]" : "w-1.5 bg-neutral-300/60"
                        }`}
                    />
                  ))}
                </div>
              </div>

              {/* Thumbnails - Horizontal */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`shrink-0 w-16 sm:w-20 h-16 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                      ? "border-[#F27318]"
                      : "border-transparent hover:border-black/10"
                      }`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:col-span-6">
              {/* Category */}
              {product.category?.name && (
                <span className="text-[12px] font-bold text-[#F27318] uppercase tracking-[0.1rem] mb-3 block">
                  {product.category.name}
                </span>
              )}

              {/* Product Title */}
              <h1 className="text-[34px] font-bold text-[#1A1714] mb-4 font-dm-sans leading-[1.1]">
                {product.name}
              </h1>

              {/* Rating & Sold Info */}
              <div className="flex items-center gap-6 mb-5">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={
                          i < Math.round(product?.rating?.average || 0)
                            ? "fill-[#F27318] text-[#F27318]"
                            : "fill-black/10 text-transparent"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-[14px] font-bold text-[#1A1714] font-dm-sans">
                    {(product?.rating?.average || 0).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[13px] font-bold text-black/30 font-dm-sans tracking-wide">
                  <span>{product?.rating?.count || 0} Reviews</span>
                  <span className="w-1 h-1 rounded-full bg-black/10"></span>
                  <span>{product.soldCount || "2.5k"} sold</span>
                </div>
              </div>

              {/* Price Display Card */}
              <div className="bg-[#F27318]/[0.03] border border-[#F27318]/[0.08] rounded-xl p-6 mb-5 w-fit">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-[28px] font-bold text-[#1A1714] font-dm-sans tracking-tight">
                    NRs. {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="flex items-center gap-3">
                      <span className="text-[16px] text-black/20 line-through font-dm-sans font-medium">
                        NRs. {formatPrice(product.originalPrice)}
                      </span>
                      <span className="bg-[#F27318]/10 text-[#F27318] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        SAVE {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[13px] font-bold">
                  {product.originalPrice > product.price && (
                    <span className="text-[#F27318] font-dm-sans">
                      You Save NRs. {formatPrice(product.originalPrice - product.price)}
                    </span>
                  )}
                  <span className="text-black/30 font-dm-sans font-medium">
                    Incl. all taxes <span className="mx-1.5 opacity-50">•</span> EMI from NRs. {formatPrice(Math.round(product.price / 12))}/mo
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[15px] text-black/60 mb-6 leading-[1.8] font-medium font-dm-sans">
                {product.description}
              </p>

              {/* Color Selector */}
              {colors.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[16px] font-semibold text-black/90 font-dm-sans">Selected Color</h3>
                    <span className="text-[14px] text-[#F27318] font-bold font-dm-sans">
                      {selectedColor && typeof selectedColor === "object" ? selectedColor.name : selectedColor}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {colors.map((color, index) => {
                      const colorValue = typeof color === "object" ? color.hex : color;
                      const isSelected = (selectedColor?.name || selectedColor) === (color.name || color);
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedColor(color)}
                          className={`group relative w-12 h-12 rounded-full border-2 transition-all duration-300 ${isSelected
                            ? "border-[#F27318] p-1 scale-110"
                            : "border-transparent hover:border-black/10"
                            }`}
                          title={typeof color === "object" ? color.name : color}
                        >
                          <div
                            className="w-full h-full rounded-full border border-black/5"
                            style={{ backgroundColor: colorValue }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[13px] font-bold text-black/90 uppercase tracking-widest font-dm-sans">Select Size</h3>
                    <button className="text-[12px] font-bold text-[#F27318] underline tracking-wider uppercase">Size Guide</button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {sizes.map((size, index) => {
                      const sizeName = typeof size === "object" ? size.name : size;
                      const sizeDimensions = typeof size === "object" ? size.dimensions : null;
                      const isSelected = (selectedSize?.name || selectedSize) === (sizeName);
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedSize(size)}
                          className={`py-5 px-3 rounded-2xl border-2 font-bold text-[14px] transition-all duration-300 ${isSelected
                            ? "border-[#F27318] bg-[#F27318]/5 text-[#F27318] shadow-lg shadow-[#F27318]/5"
                            : "border-black/[0.05] text-black/40 hover:border-black/20 bg-white"
                            }`}
                        >
                          <span className="block mb-1">{sizeName}</span>
                          {sizeDimensions && (
                            <span className="block text-[11px] font-medium opacity-50">
                              {sizeDimensions}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity and Cart */}
              <div className="flex flex-col sm:flex-row items-center gap-5 mb-10">
                {/* Quantity Selector */}
                <div className="flex items-center bg-white border border-black/[0.08] rounded-lg h-14 px-4 shadow-sm shadow-black/[0.02] w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center text-black/40 hover:text-black/90 hover:bg-black/[0.05] rounded-xl disabled:opacity-20 transition-all"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="mx-6 font-bold text-[18px] w-8 text-center font-dm-sans text-[#1A1714]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.stock || 10)}
                    className="w-10 h-10 flex items-center justify-center text-black/40 hover:text-black/90 hover:bg-black/[0.05] rounded-xl disabled:opacity-20 transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  id="main-add-to-cart"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="flex-1 bg-[#F27318] text-white h-14 px-10 rounded-lg font-bold text-[16px] hover:shadow-2xl hover:shadow-[#F27318]/30 transition-all duration-300 flex items-center justify-center gap-3 disabled:bg-neutral-200"
                >
                  {isAddingToCart ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <ShoppingBag size={20} />
                  )}
                  {isAddingToCart ? "Adding to Bag..." : "Add to Shopping Bag"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* High-Fidelity Trust Matrix - Edge to Edge */}
        <div className="bg-white border-t border-black/[0.06] py-8 mt-0 mb-0 overflow-hidden">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Grid with proper internal spacing */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
              {/* Promise 1 */}
              <div className="group relative transition-all duration-700">
                <span className="absolute top-0 left-0 text-[120px] font-bold text-black/[0.03] leading-none select-none group-hover:text-[#F27318]/5 transition-colors duration-700 pointer-events-none">01</span>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#F27318] mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <Hammer size={28} strokeWidth={1.5} />
                  </div>
                  <h4 className="text-[20px] font-bold text-[#1A1714] mb-3 tracking-tight">Artisanal Mastery</h4>
                  <p className="text-black/40 text-[15px] leading-relaxed font-medium">Every joint and finish is meticulously handcrafted by masters of the trade, ensuring your piece is truly unique.</p>
                </div>
              </div>

              {/* Promise 2 */}
              <div className="group relative transition-all duration-700">
                <span className="absolute top-0 left-0 text-[120px] font-bold text-black/[0.03] leading-none select-none group-hover:text-[#F27318]/5 transition-colors duration-700 pointer-events-none">02</span>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#F27318] mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <ShieldCheck size={28} strokeWidth={1.5} />
                  </div>
                  <h4 className="text-[20px] font-bold text-[#1A1714] mb-3 tracking-tight">Life-Long Quality</h4>
                  <p className="text-black/40 text-[15px] leading-relaxed font-medium">A 5-Year limited structural warranty ensures your investment remains pristine and functional through the years.</p>
                </div>
              </div>

              {/* Promise 3 */}
              <div className="group relative transition-all duration-700">
                <span className="absolute top-0 left-0 text-[120px] font-bold text-black/[0.03] leading-none select-none group-hover:text-[#F27318]/5 transition-colors duration-700 pointer-events-none">03</span>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#F27318] mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <Truck size={28} strokeWidth={1.5} />
                  </div>
                  <h4 className="text-[20px] font-bold text-[#1A1714] mb-3 tracking-tight">Concierge Service</h4>
                  <p className="text-black/40 text-[15px] leading-relaxed font-medium">Experience true white-glove service with professional room-of-choice placement and complimentary assembly.</p>
                </div>
              </div>

              {/* Promise 4 */}
              <div className="group relative transition-all duration-700">
                <span className="absolute top-0 left-0 text-[120px] font-bold text-black/[0.03] leading-none select-none group-hover:text-[#F27318]/5 transition-colors duration-700 pointer-events-none">04</span>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#F27318] mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <Leaf size={28} strokeWidth={1.5} />
                  </div>
                  <h4 className="text-[20px] font-bold text-[#1A1714] mb-3 tracking-tight">Ethical Sourcing</h4>
                  <p className="text-black/40 text-[15px] leading-relaxed font-medium">We prioritize FSC-certified hardwoods and premium textiles, ensuring our footprint is as light as our designs.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher - Edge to Edge like Trust Matrix */}
        <div className="border-y border-black/[0.05] shadow-[0_8px_32px_-10px_rgba(0,0,0,0.07)] bg-white/50 backdrop-blur-sm">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex gap-12">
              {[
                { id: "specifications", label: "Product Specifications" },
                { id: "reviews", label: `Customer Reviews (${product?.rating?.count || 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainTab(tab.id)}
                  className={`py-6 text-[16px] font-semibold transition-all relative bg-transparent border-none cursor-pointer ${activeMainTab === tab.id ? "text-[#F27318]" : "text-black/30 hover:text-black/60"}`}
                >
                  {tab.label}
                  {activeMainTab === tab.id && (
                    <motion.div
                      layoutId="activeMainTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F27318]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {activeMainTab === "reviews" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {isAuthenticated ? (
                  hasReviewed ? (
                    <button
                      onClick={() => handleOpenReviewModal(userReview)}
                      className="inline-flex items-center gap-2 text-[#F27318] text-[15px] font-semibold hover:underline underline-offset-4 transition-all cursor-pointer bg-transparent border-none p-0"
                    >
                      <Edit2 size={14} />
                      Edit Your Review
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenReviewModal()}
                      className="inline-flex items-center gap-2 text-[#F27318] text-[15px] font-semibold hover:underline underline-offset-4 transition-all cursor-pointer bg-transparent border-none p-0"
                    >
                      <PenLine size={16} />
                      Write a Review
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => useAuthStore.getState().openAuthModal("login")}
                    className="inline-flex items-center gap-2 text-[#F27318] text-[15px] font-semibold hover:underline underline-offset-4 transition-all cursor-pointer bg-transparent border-none p-0"
                  >
                    <PenLine size={14} />
                    Write a Review
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Tab Content + Related Products */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-16 pt-12">
            <AnimatePresence mode="wait">
              {activeMainTab === "specifications" ? (
                <motion.div
                  key="specifications"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4">
                      <h2 className="text-[32px] font-bold text-[#1A1714] tracking-[-0.03em] mb-6 leading-tight font-dm-sans whitespace-nowrap">
                        Product Specifications
                      </h2>
                      <p className="text-[#1A1714]/50 font-medium text-[14px] leading-[1.7] max-w-[300px]">
                        Deep-dive into the materials, dimensions, and care details that make this piece an enduring masterpiece.
                      </p>
                    </div>

                    <div className="lg:col-span-8">
                      <div className="space-y-16">
                        {detailSections.map((section) => (
                          <div key={section.id} className="group">
                            <h4 className="text-[14px] font-bold text-[#1A1714] mb-4 uppercase tracking-widest">{section.title}</h4>
                            <div className="text-black/60 font-medium text-[16px] leading-[1.8] max-w-[700px]">
                              {section.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  ref={reviewsSectionRef}
                >
                  <ReviewSection productId={product._id} productName={product.name} onEditReview={handleOpenReviewModal} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Related Products - Editorial Redesign */}
            {relatedProducts.length > 0 && (
              <div className="mb-20">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-[28px] sm:text-[36px] font-black text-[#1A1714] tracking-tight">
                      Complete your sanctuary
                    </h2>
                    <p className="text-black/40 text-[15px] mt-1 font-medium max-w-[500px]">
                      Handpicked items that perfectly match the {product.style || product.category?.name} aesthetic.
                    </p>
                  </div>
                  <Link to="/shop" className="hidden sm:flex items-center gap-2 text-[14px] font-bold text-[#1A1714] hover:text-[#F27318] transition-all group pb-1.5 border-b-2 border-black/5 hover:border-[#F27318]">
                    View All <MoveRight size={18} className="transition-transform group-hover:translate-x-2" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {relatedProducts.slice(0, 5).map((relatedProduct) => (
                    <ProductCard key={relatedProduct._id} product={relatedProduct} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* AR View Modal */}
      <ARViewModal
        isOpen={isARModalOpen}
        onClose={() => setIsARModalOpen(false)}
        product={product}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={handleCloseReviewModal}
        productId={product?._id}
        existingReview={editingReview}
        productName={product?.name}
      />

      {/* Mobile Sticky Add to Cart */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 bg-linear-to-t from-white via-white/95 to-transparent transition-all duration-300 ${scrolledPastAction ? "translate-y-0 opacity-100 visible" : "translate-y-full opacity-0 invisible"
          }`}
      >
        <div className="bg-white rounded-2xl border border-black/[0.05] p-4 shadow-2xl flex items-center gap-4 pointer-events-auto">
          {/* Main Price Mini Info */}
          <div className="flex-1">
            <p className="text-[10px] text-black/40 uppercase tracking-widest font-bold mb-1">Total</p>
            <p className="text-[20px] font-bold text-[#1A1714]">
              NRs. {formatPrice(product.price * quantity)}
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="flex-3 bg-[#1A1714] text-white h-[56px] px-8 rounded-xl font-bold text-[15px] hover:bg-[#F27318] transition-all flex items-center justify-center shadow-lg"
          >
            {isAddingToCart ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Add to Bag"
            )}
          </button>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
