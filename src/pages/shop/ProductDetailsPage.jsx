import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
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
  ShoppingCart,
  PenLine,
  Edit2,
  MoveRight,
  Maximize2,
  MapPin,
  X,
  Sparkles,
  Layers,
  LayoutGrid,
  MessageCircle,
  FileText,
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

// Simple line-art dimension diagram, driven by the product's dimensions data.
function DimensionDiagram({ dimensions }) {
  const unit = dimensions.unit || "cm";
  const width = dimensions.width || "–";
  const height = dimensions.height || "–";
  const depth = dimensions.depth || "–";

  return (
    <svg viewBox="-20 0 640 380" className="w-full h-auto -mt-2" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sofa silhouette */}
      <rect x="120" y="80" width="360" height="140" rx="16" stroke="#3d3d3d" strokeWidth="1.5" />
      {/* Left armrest */}
      <rect x="120" y="60" width="70" height="50" rx="8" stroke="#3d3d3d" strokeWidth="1.5" />
      {/* Right armrest */}
      <rect x="410" y="60" width="70" height="50" rx="8" stroke="#3d3d3d" strokeWidth="1.5" />
      {/* Legs */}
      <line x1="150" y1="220" x2="150" y2="240" stroke="#3d3d3d" strokeWidth="1.5" />
      <line x1="430" y1="220" x2="430" y2="240" stroke="#3d3d3d" strokeWidth="1.5" />

      {/* HEIGHT dimension (right side) - Orange */}
      <line x1="520" y1="60" x2="520" y2="220" stroke="#F27318" strokeWidth="1.5" />
      <circle cx="520" cy="60" r="5" fill="#F27318" />
      <circle cx="520" cy="220" r="5" fill="#F27318" />
      <text x="560" y="145" fontSize="16" fontWeight="700" fill="#1A1714">{height} cm</text>
      <text x="560" y="170" fontSize="12" fill="#9a9a9a" fontWeight="500">Height</text>

      {/* DEPTH dimension (left side) - Orange dashed */}
      <line x1="80" y1="240" x2="130" y2="240" stroke="#F27318" strokeWidth="1.5" strokeDasharray="5,5" />
      <line x1="80" y1="240" x2="80" y2="270" stroke="#F27318" strokeWidth="1.5" strokeDasharray="5,5" />
      <circle cx="80" cy="240" r="5" fill="#F27318" />
      <circle cx="130" cy="240" r="5" fill="#F27318" />
      <text x="35" y="295" fontSize="16" fontWeight="700" fill="#1A1714">{depth} cm</text>
      <text x="35" y="320" fontSize="12" fill="#9a9a9a" fontWeight="500">Depth</text>

      {/* WIDTH dimension (bottom) - Orange */}
      <line x1="120" y1="300" x2="480" y2="300" stroke="#F27318" strokeWidth="1.5" />
      <circle cx="120" cy="300" r="5" fill="#F27318" />
      <circle cx="480" cy="300" r="5" fill="#F27318" />
      <text x="240" y="355" fontSize="16" fontWeight="700" fill="#1A1714" textAnchor="middle">{width} cm</text>
      <text x="240" y="380" fontSize="12" fill="#9a9a9a" fontWeight="500" textAnchor="middle">Width</text>
    </svg>
  );
}

export default function ProductDetailsPage() {
  const { productSlug } = useParams();
  const { isAuthenticated } = useAuthStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeMainTab, setActiveMainTab] = useState("description");
  const [isARModalOpen, setIsARModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [scrolledPastAction, setScrolledPastAction] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const reviewsSectionRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const mainBtn = document.getElementById("main-add-to-cart");
      if (mainBtn) {
        const rect = mainBtn.getBoundingClientRect();
        setScrolledPastAction(rect.bottom < 0);
      } else {
        setScrolledPastAction(window.scrollY > 800);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll + support Escape/Arrow keys when lightbox is open
  useEffect(() => {
    if (!isLightboxOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowLeft") setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      if (e.key === "ArrowRight") setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen]);

  const { data: productData, isLoading, error } = useProduct(productSlug);
  const product = productData?.data?.product;

  const { data: wishlistCheck } = useCheckWishlist(product?._id, { enabled: isAuthenticated && !!product?._id });
  const { mutate: addToWishlist, isPending: isAddingToWishlist } = useAddToWishlist();
  const { mutate: removeFromWishlist, isPending: isRemovingFromWishlist } = useRemoveFromWishlist();

  const isInWishlist = wishlistCheck?.data?.inWishlist || false;
  const isWishlistLoading = isAddingToWishlist || isRemovingFromWishlist;

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

  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
  const { addItem: addToGuestCart } = useGuestCartStore();

  const handleAddToCart = () => {
    const variant = {};
    if (selectedColor) variant.color = typeof selectedColor === "object" ? selectedColor.name : selectedColor;

    if (!isAuthenticated) {
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
        onError: (err) => toast.error(formatError(err, "Failed to add to cart")),
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
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
        toast.error("Failed to share");
      }
    }
  };

  const { data: relatedData } = useRelatedProducts(product?._id, 4);
  const relatedProducts = relatedData?.data?.products || [];

  useEffect(() => {
    if (product) {
      if (product.colors?.length > 0 && !selectedColor) setSelectedColor(product.colors[0]);
    }
  }, [product]);

  const buildBreadcrumbs = () => {
    const crumbs = [{ name: "Home", path: "/" }];
    if (product?.category) {
      if (product.category.parent) {
        crumbs.push({ name: product.category.parent.name, path: `/shop/${product.category.parent.slug}` });
      }
      crumbs.push({ name: product.category.name, path: `/shop/${product.category.slug}` });
    }
    if (product) crumbs.push({ name: product.name, path: "#" });
    return crumbs;
  };
  const breadcrumbs = buildBreadcrumbs();

  const getImages = () => {
    if (!product?.images?.length) {
      return [{ url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop" }];
    }
    return product.images;
  };
  const images = getImages();
  const getImageUrl = (image) => {
    // Backend returns full Cloudinary URLs, just return them directly
    if (image?.url?.startsWith("http")) {
      return image.url;
    }
    // Fallback for relative paths
    return getImageUrlUtil(image?.url, "products");
  };

  const formatPrice = (price) => new Intl.NumberFormat("en-NP", { minimumFractionDigits: 0 }).format(price);

  const getDiscount = () => {
    if (product?.originalPrice && product?.price) {
      const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      return discount > 0 ? discount : null;
    }
    return null;
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 10)) setQuantity(newQuantity);
  };

  const detailSections = [
    {
      id: "materials",
      title: "Materials & Composition",
      content:
        product?.materials?.length > 0
          ? `This piece is meticulously crafted using ${product.materials.join(", ")} and finished with our signature hand-applied oils for a lasting, premium feel.`
          : "Premium, sustainably sourced materials selected for their durability and natural beauty. Every joint is handcrafted for structural integrity.",
    },
    product?.dimensions &&
    (product.dimensions.width || product.dimensions.height || product.dimensions.depth) && {
      id: "dimensions",
      title: "Dimensions",
      content: `${product.dimensions.width || 0}${product.dimensions.unit || "cm"} (W) x ${product.dimensions.height || 0}${product.dimensions.unit || "cm"} (H) x ${product.dimensions.depth || 0}${product.dimensions.unit || "cm"} (D)`,
    },
    {
      id: "warranty",
      title: "Aura Warranty",
      content:
        product?.warranty ||
        "Aura Interiors provides a 5-Year limited structural warranty on all premium furniture. We stand by our craftsmanship and ensure your investment is protected against any manufacturing defects.",
    },
    {
      id: "shipping",
      title: "Shipping & White-Glove Service",
      content:
        product?.shippingInfo ||
        "Enjoy free white-glove delivery and assembly in Kathmandu. Our professional team will place your piece in the room of your choice and remove all packaging. We offer a 30-day hassle-free return policy.",
    },
    product?.careInstructions && { id: "care", title: "Care Instructions", content: product.careInstructions },
  ].filter(Boolean);

  const colors = product?.colors || [];

  const detailIcons = [Sparkles, Layers, ShieldCheck, LayoutGrid];

  if (isLoading) {
    return (
      <>
        <Navbar />
        <CategoryBar />
        <main className="min-h-screen bg-white pt-4 font-dm-sans pb-24 lg:pb-12">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
            <nav className="flex flex-wrap items-center gap-y-1 gap-x-2 mb-6">
              <div className="h-4 w-32 bg-black/[0.08] rounded animate-pulse"></div>
            </nav>
            <div className="grid grid-cols-1 lg:grid-cols-[1.02fr_0.90fr] gap-8 mb-2">
              <div className="space-y-3">
                <div className="aspect-[6/5] rounded-xl bg-black/[0.08] animate-pulse"></div>
                <div className="flex gap-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg bg-black/[0.08] animate-pulse"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-5">
                <div className="h-4 w-20 bg-black/[0.08] rounded animate-pulse"></div>
                <div className="h-8 w-3/4 bg-black/[0.08] rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-black/[0.08] rounded animate-pulse"></div>
                <div className="h-9 w-56 bg-black/[0.08] rounded animate-pulse"></div>
                <div className="h-16 w-full bg-black/[0.08] rounded animate-pulse"></div>
                <div className="flex gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-black/[0.08] animate-pulse"></div>
                  ))}
                </div>
                <div className="h-14 w-full bg-black/[0.08] rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Navbar />
        <CategoryBar />
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

  return (
    <>
      <Navbar />
      <CategoryBar />
      <main className="min-h-screen bg-white pt-4 font-dm-sans pb-32 lg:pb-28">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
          {/* Breadcrumb */}
          <nav className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[14px] font-medium mb-5">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <ChevronRight size={14} className="text-neutral-400 shrink-0" />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-neutral-500 truncate max-w-[150px] sm:max-w-[300px]">{crumb.name}</span>
                ) : (
                  <Link to={crumb.path} className="text-neutral-500 hover:text-[#F27318] transition-colors whitespace-nowrap">
                    {crumb.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Product Section */}
          <div className="flex gap-10 mb-14">            {/* Image Gallery */}
            <div className="flex-[1.2] flex gap-3 justify-end overflow-hidden">
              {/* Thumbnails - left side */}
              <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar">
                {images.slice(0, 5).map((image, index) => {
                  const isLastVisible = index === 4 && images.length > 5;
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? "border-[#F27318]" : "border-transparent hover:border-black/10"
                        }`}
                    >
                      <img src={getImageUrl(image)} alt={`${product.name} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                      {isLastVisible && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">+{images.length - 5}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Main image and details - right side */}
              <div className="space-y-6 flex-1">
              {/* Main Image */}
              <div className="w-full overflow-hidden">
              <div className="relative rounded-xl overflow-hidden bg-black/[0.02] border border-black/[0.05] w-full h-[444px]">
                {/* Bestseller badge on image */}
                {product.isFeatured && (
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white text-[#1A1714] text-[13px] font-bold px-3 py-1.5 rounded-md shadow-sm">
                    <Star size={13} className="fill-[#F27318] text-[#F27318]" />
                    Bestseller
                  </div>
                )}

                <ImageMagnifier
                  src={getImageUrl(images[selectedImage])}
                  alt={product.name}
                  magnifierSize={180}
                  zoomLevel={2.5}
                  className="w-full h-full object-cover"
                />

                {/* Fullscreen button - top right */}
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute top-4 right-4 z-10 w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-neutral-50 transition-all text-black/50 hover:text-black shadow-sm"
                  title="View fullscreen"
                >
                  <Maximize2 size={16} strokeWidth={2} />
                </button>

                {/* AR button */}
                {product.arAvailable && (
                  <button
                    onClick={() => setIsARModalOpen(true)}
                    className="absolute bottom-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-neutral-50 transition-all shadow-sm"
                    title="View in AR"
                  >
                    <img src={arIcon} alt="AR View" className="w-4 h-4" />
                  </button>
                )}

                {/* Pagination dots - mobile */}
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
              </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="flex-1">              {/* Bestseller badge */}
              {product.isFeatured && (
                <div className="bg-[#F27318] text-white text-[11px] font-bold px-3 py-1 rounded uppercase tracking-widest mb-5 w-fit">
                  Bestseller
                </div>
              )}

              {/* Title */}
              <h1 className="text-[30px] leading-[1.2] font-bold text-[#1A1714] mb-3">{product.name}</h1>

              {/* Rating row - single line */}
              <div className="flex flex-wrap items-center gap-2 text-[14px] mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      className={
                        i < Math.round(product?.rating?.average || 0) ? "fill-[#F27318] text-[#F27318]" : "fill-black/10 text-transparent"
                      }
                    />
                  ))}
                </div>
                <span className="font-bold text-[#1A1714]">{(product?.rating?.average || 0).toFixed(1)}</span>
                <span className="text-black/40 font-medium">({product?.rating?.count || 0} reviews)</span>
                <span className="w-1 h-1 rounded-full bg-black/20"></span>
                <span className="text-black/40 font-medium">{product.soldCount || "200+"} bought in last month</span>
              </div>

              {/* Price - inline */}
              <div className="flex items-baseline gap-2.5 mb-1.5">
                <span className="text-[30px] font-bold text-[#1A1714]">Rs. {formatPrice(product.price)}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-[16px] text-black/35 line-through font-medium">Rs. {formatPrice(product.originalPrice)}</span>
                    <span className="bg-[#F27318]/[0.08] text-[#F27318] px-2.5 py-1 rounded text-[13px] font-bold">{discount}% OFF</span>
                  </>
                )}
              </div>
              <p className="text-[14px] text-black/50 mb-4">Inclusive of all taxes</p>

              {/* Product Description */}
              {product.description && (
                <div className="mb-6">
                  {!isDescriptionExpanded ? (
                    <p className="text-[14px] text-black/60 leading-relaxed text-justify">
                      {product.description.length > 150
                        ? `${product.description.substring(0, 150)}... `
                        : product.description}
                      {product.description.length > 150 && (
                        <button
                          onClick={() => setIsDescriptionExpanded(true)}
                          className="text-[#F27318] font-semibold hover:underline text-[14px] inline"
                        >
                          View More
                        </button>
                      )}
                    </p>
                  ) : (
                    <p className="text-[14px] text-black/60 leading-relaxed text-justify">
                      {product.description}
                      <button
                        onClick={() => setIsDescriptionExpanded(false)}
                        className="text-[#F27318] font-semibold hover:underline text-[14px] inline ml-1"
                      >
                        View Less
                      </button>
                    </p>
                  )}
                </div>
              )}

              {/* Trust Icons - with card background */}
              {/* <div className="bg-[#F27318]/5 rounded-lg px-4 py-6 mb-8 mt-8">
                <div className="grid grid-cols-4 gap-5">
                  <div className="flex items-start gap-3">
                    <Truck size={18} className="text-[#F27318] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[14px] font-bold text-[#1A1714] leading-tight">Free Delivery</h4>
                      <p className="text-[13px] text-black/50 leading-tight mt-0.5">above Rs. 5,000</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Hammer size={18} className="text-[#F27318] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[14px] font-bold text-[#1A1714] leading-tight">Free Installation</h4>
                      <p className="text-[13px] text-black/50 leading-tight mt-0.5">on all orders</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck size={18} className="text-[#F27318] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[14px] font-bold text-[#1A1714] leading-tight">10 Year Warranty</h4>
                      <p className="text-[13px] text-black/50 leading-tight mt-0.5">on frame</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <RotateCcw size={18} className="text-[#F27318] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[14px] font-bold text-[#1A1714] leading-tight">Easy Returns</h4>
                      <p className="text-[13px] text-black/50 leading-tight mt-0.5">within 7 days</p>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Color Selector */}
              {colors.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-[15px] font-semibold text-black/80 mb-3">
                    Select Color:{" "}
                    <span className="font-bold text-[#1A1714]">
                      {selectedColor && typeof selectedColor === "object" ? selectedColor.name : selectedColor}
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color, index) => {
                      const colorValue = typeof color === "object" ? color.hex : color;
                      const isSelected = (selectedColor?.name || selectedColor) === (color.name || color);
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedColor(color)}
                          className={`w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center overflow-hidden ${isSelected ? "border-[#F27318]" : "border-transparent hover:border-black/10"
                            }`}
                          title={typeof color === "object" ? color.name : color}
                        >
                          <div
                            className="w-full h-full rounded-full"
                            style={{ backgroundColor: colorValue }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity + Add to Cart + Buy Now — same row */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-5">
                <div className="flex items-center bg-white border border-black/10 rounded-lg h-[52px] shrink-0 justify-center sm:justify-start">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-10 h-full flex items-center justify-center text-black/40 hover:text-black/90 disabled:opacity-20 transition-all"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-9 text-center font-bold text-[15px] text-[#1A1714]">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.stock || 10)}
                    className="w-10 h-full flex items-center justify-center text-black/40 hover:text-black/90 disabled:opacity-20 transition-all"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <button
                  id="main-add-to-cart"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="flex-2 bg-[#F27318] text-white h-[52px] rounded-lg font-bold text-[16px] hover:bg-[#D9620E] transition-all duration-300 flex items-center justify-center gap-2.5 disabled:bg-neutral-200"
                >
                  {isAddingToCart ? <Loader2 size={20} className="animate-spin" /> : <ShoppingCart size={18} />}
                  {isAddingToCart ? "Adding..." : "Add to Cart"}
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="flex-1 bg-white text-[#1A1714] border border-black/15 h-[52px] rounded-lg font-bold text-[16px] hover:border-black/30 transition-all duration-300 disabled:opacity-50"
                >
                  Buy Now
                </button>
              </div>

              {/* Wishlist / Share — horizontally centered */}
              <div className="flex items-start gap-12 mt-10">
                <button
                  onClick={handleWishlistToggle}
                  disabled={isWishlistLoading}
                  className="flex items-center gap-1.5 text-[14px] font-semibold text-black/60 hover:text-[#F27318] transition-all disabled:opacity-50"
                >
                  <Heart size={16} className={isInWishlist ? "fill-red-500 text-red-500" : ""} />
                  Add to Wishlist
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-[14px] font-semibold text-black/60 hover:text-[#F27318] transition-all"
                >
                  <Share2 size={16} />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Tabs + Content — full width */}
          <div className="mb-16">
            <div className="border-b border-black/[0.08] flex items-center justify-between">
              <div className="flex gap-0 overflow-x-auto min-w-min">
                {[
                  { id: "description", label: "Description", Icon: FileText },
                  { id: "specifications", label: "Specifications", Icon: Edit2 },
                  { id: "materials", label: "Materials", Icon: Layers },
                  { id: "reviews", label: `Reviews (${product?.rating?.count || 0})`, Icon: Star },
                  { id: "delivery", label: "Delivery & Returns", Icon: Truck },
                ].map((tab) => {
                  const { Icon } = tab;
                  const isActive = activeMainTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveMainTab(tab.id)}
                      className={`px-6 py-5 text-[14px] font-semibold transition-all relative bg-transparent border-none cursor-pointer whitespace-nowrap flex items-center gap-2.5 group ${isActive ? "text-[#1A1714]" : "text-black/50 hover:text-black/70"
                        }`}
                    >
                      <Icon 
                        size={16} 
                        strokeWidth={isActive ? 2.5 : 2}
                        className={`transition-all ${isActive ? "text-[#F27318]" : "text-black/40 group-hover:text-black/60"}`} 
                      />
                      {tab.label}
                      {isActive && (
                        <motion.div
                          layoutId="activeMainTabUnderline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F27318]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {activeMainTab === "reviews" && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="ml-auto pl-4">
                  {isAuthenticated ? (
                    hasReviewed ? (
                      <button
                        onClick={() => handleOpenReviewModal(userReview)}
                        className="inline-flex items-center gap-2 text-[#F27318] text-[14px] font-semibold hover:underline underline-offset-4 transition-all cursor-pointer bg-transparent border-none p-0 whitespace-nowrap"
                      >
                        <Edit2 size={14} />
                        Edit Your Review
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenReviewModal()}
                        className="inline-flex items-center gap-2 text-[#F27318] text-[14px] font-semibold hover:underline underline-offset-4 transition-all cursor-pointer bg-transparent border-none p-0 whitespace-nowrap"
                      >
                        <PenLine size={15} />
                        Write a Review
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => useAuthStore.getState().openAuthModal("login")}
                      className="inline-flex items-center gap-2 text-[#F27318] text-[14px] font-semibold hover:underline underline-offset-4 transition-all cursor-pointer bg-transparent border-none p-0 whitespace-nowrap"
                    >
                      <PenLine size={14} />
                      Write a Review
                    </button>
                  )}
                </motion.div>
              )}
            </div>

            <div className="pt-8">
              <AnimatePresence mode="wait">
                {activeMainTab === "description" ? (
                  <motion.div
                    key="description"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                      {/* Left Column - Description & Features */}
                      <div>
                        <h3 className="text-[18px] font-bold text-[#1A1714] mb-6">{product.name}</h3>
                        <div className="text-[15px] text-black/60 leading-[1.8] font-medium space-y-5 mb-8 text-justify">
                          <p>{product.description}</p>
                        </div>

                        {product.materials?.length > 0 && (
                          <ul className="space-y-5 pt-2">
                            {product.materials.map((material, idx) => {
                              const Icon = detailIcons[idx % detailIcons.length];
                              return (
                                <li key={idx} className="flex items-start gap-4">
                                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#F27318]/8 shrink-0">
                                    <Icon size={22} className="text-[#F27318]" />
                                  </div>
                                  <div>
                                    <p className="text-[15px] font-semibold text-[#1A1714] mb-0.5 capitalize">{material.split('-')[0]}</p>
                                    <p className="text-[14px] text-black/50">{material}</p>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      {/* Right Column - Dimensions */}
                      {product?.dimensions &&
                        (product.dimensions.width || product.dimensions.height || product.dimensions.depth) && (
                          <div className="flex flex-col bg-[#F27318]/4 rounded-2xl p-8">
                            <h4 className="text-[15px] font-bold text-[#1A1714] mb-0 flex items-center gap-2.5">
                              <Edit2 size={16} className="text-[#F27318]" />
                              Dimensions
                            </h4>
                            <div className="w-full">
                              <DimensionDiagram dimensions={product.dimensions} />
                            </div>
                          </div>
                        )}
                    </div>
                  </motion.div>
                ) : activeMainTab === "specifications" ? (
                  <motion.div
                    key="specifications"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-7">
                      {detailSections.map((section) => (
                        <div key={section.id}>
                          <h4 className="text-[14px] font-bold text-[#1A1714] mb-2 uppercase tracking-widest">{section.title}</h4>
                          <div className="text-black/55 font-medium text-[15px] leading-[1.8]">{section.content}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : activeMainTab === "materials" ? (
                  <motion.div
                    key="materials"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      {/* Left Column - Materials List */}
                      <div>
                        <h3 className="text-[20px] font-bold text-[#1A1714] mb-2">Premium materials. Built to last.</h3>
                        <p className="text-[14px] text-black/60 leading-relaxed mb-8 text-justify">
                          Thoughtfully selected materials and a sturdy build ensure lasting comfort, durability, and timeless style.
                        </p>

                        {product.materials?.length > 0 ? (
                          <div className="space-y-6">
                            {product.materials.map((material, idx) => {
                              const Icon = detailIcons[idx % detailIcons.length];
                              return (
                                <div key={idx} className="flex gap-4">
                                  {/* Material Image Placeholder */}
                                  <div className="w-28 h-28 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 shrink-0 flex items-center justify-center border border-black/5">
                                    <Icon size={32} className="text-[#F27318]/40" />
                                  </div>
                                  {/* Material Info */}
                                  <div className="flex-1">
                                    <h4 className="text-[15px] font-bold text-[#1A1714] mb-1">{material.split('-')[0]}</h4>
                                    <p className="text-[13px] text-black/50 mb-3">{material}</p>
                                    <div className="flex gap-4 text-[12px]">
                                      {idx === 0 && (
                                        <>
                                          <div className="flex items-center gap-1.5 text-black/60">
                                            <Sparkles size={14} className="text-[#F27318]" />
                                            <span>Breathable</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-black/60">
                                            <ShieldCheck size={14} className="text-[#F27318]" />
                                            <span>Stain-Resistant</span>
                                          </div>
                                        </>
                                      )}
                                      {idx === 1 && (
                                        <>
                                          <div className="flex items-center gap-1.5 text-black/60">
                                            <Hammer size={14} className="text-[#F27318]" />
                                            <span>Solid & Durable</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-black/60">
                                            <Layers size={14} className="text-[#F27318]" />
                                            <span>Sustainably Sourced</span>
                                          </div>
                                        </>
                                      )}
                                      {idx === 2 && (
                                        <>
                                          <div className="flex items-center gap-1.5 text-black/60">
                                            <Sparkles size={14} className="text-[#F27318]" />
                                            <span>High Resilience</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-black/60">
                                            <RotateCcw size={14} className="text-[#F27318]" />
                                            <span>Lasting Comfort</span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[14px] text-black/60">Premium, sustainably sourced materials selected for their durability and natural beauty.</p>
                        )}
                      </div>

                      {/* Right Column - Product Image with Callouts */}
                      <div className="flex flex-col">
                        {/* Product Image */}
                        <div className="mb-8 relative">
                          <img 
                            src={getImageUrl(images[selectedImage])} 
                            alt={product.name}
                            className="w-full h-auto rounded-lg object-cover"
                          />
                          
                          {/* Callout Points */}
                          <div className="absolute top-1/4 right-4 w-48 bg-white rounded-lg p-4 shadow-lg">
                            <p className="text-[13px] font-bold text-[#1A1714] mb-1">Cotton Fabric</p>
                            <p className="text-[12px] text-black/60">Soft-touch cotton fabric for a refined look and everyday comfort.</p>
                          </div>
                          <div className="absolute top-1/2 right-4 w-48 bg-white rounded-lg p-4 shadow-lg">
                            <p className="text-[13px] font-bold text-[#1A1714] mb-1">Pine Wood Frame</p>
                            <p className="text-[12px] text-black/60">Sturdy pine wood frame for reliable strength and stability.</p>
                          </div>
                          <div className="absolute bottom-1/4 right-4 w-48 bg-white rounded-lg p-4 shadow-lg">
                            <p className="text-[13px] font-bold text-[#1A1714] mb-1">High-Density Foam</p>
                            <p className="text-[12px] text-black/60">Plush cushioning that maintains its shape and support over time.</p>
                          </div>
                        </div>

                        {/* Benefits Row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col items-center text-center p-4 bg-black/[0.02] rounded-lg">
                            <ShieldCheck size={24} className="text-[#F27318] mb-2" />
                            <p className="text-[12px] font-bold text-[#1A1714] mb-1">Built to Last</p>
                            <p className="text-[11px] text-black/50">Premium materials for long-lasting durability.</p>
                          </div>
                          <div className="flex flex-col items-center text-center p-4 bg-black/[0.02] rounded-lg">
                            <Sparkles size={24} className="text-[#F27318] mb-2" />
                            <p className="text-[12px] font-bold text-[#1A1714] mb-1">Easy to Maintain</p>
                            <p className="text-[11px] text-black/50">Materials chosen for easy cleaning and care.</p>
                          </div>
                          <div className="flex flex-col items-center text-center p-4 bg-black/[0.02] rounded-lg">
                            <Layers size={24} className="text-[#F27318] mb-2" />
                            <p className="text-[12px] font-bold text-[#1A1714] mb-1">Sustainably Sourced</p>
                            <p className="text-[11px] text-black/50">Responsibly sourced wood for a better future.</p>
                          </div>
                          <div className="flex flex-col items-center text-center p-4 bg-black/[0.02] rounded-lg">
                            <Star size={24} className="text-[#F27318] mb-2" />
                            <p className="text-[12px] font-bold text-[#1A1714] mb-1">Quality Assured</p>
                            <p className="text-[11px] text-black/50">Rigorous quality checks for your peace of mind.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : activeMainTab === "delivery" ? (
                  <motion.div
                    key="delivery"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div className="space-y-6 text-[15px] text-black/55 leading-[1.8] font-medium">
                      <div>
                        <h3 className="text-[16px] font-bold text-[#1A1714] mb-1.5">Free Delivery</h3>
                        <p>Enjoy free white-glove delivery and assembly in Kathmandu. Our professional team will place your piece in the room of your choice and remove all packaging.</p>
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold text-[#1A1714] mb-1.5">Easy Returns</h3>
                        <p>We offer a 30-day hassle-free return policy. If you're not completely satisfied, simply contact us to arrange a return.</p>
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold text-[#1A1714] mb-1.5">Warranty</h3>
                        <p>Aura Interiors provides a 5-Year limited structural warranty on all premium furniture. We stand by our craftsmanship.</p>
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
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[23px] font-bold text-[#1A1714]">You May Also Like</h2>
                <Link
                  to="/shop"
                  className="hidden sm:flex items-center gap-1.5 text-[14px] font-bold text-[#1A1714] hover:text-[#F27318] transition-all group"
                >
                  View all <MoveRight size={16} className="transition-transform group-hover:translate-x-1" />
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
      </main>
      <Footer />

      <ARViewModal isOpen={isARModalOpen} onClose={() => setIsARModalOpen(false)} product={product} />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={handleCloseReviewModal}
        productId={product?._id}
        existingReview={editingReview}
        productName={product?.name}
      />

      {/* Fullscreen Image Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-5 right-5 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10"
              title="Close"
            >
              <X size={22} />
            </button>

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute top-6 left-6 text-white/70 text-[14px] font-medium">
                {selectedImage + 1} / {images.length}
              </div>
            )}

            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                  }}
                  className="absolute left-4 sm:left-8 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-4 sm:right-8 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}

            {/* Full image */}
            <motion.img
              key={selectedImage}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              src={getImageUrl(images[selectedImage])}
              alt={product.name}
              className="max-w-[90vw] max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Thumbnail strip inside lightbox */}
            {images.length > 1 && (
              <div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 bg-white/10 rounded-xl max-w-[90vw] overflow-x-auto no-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                  >
                    <img src={getImageUrl(image)} alt={`${product.name} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sticky Add to Cart Bar — desktop + mobile */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}