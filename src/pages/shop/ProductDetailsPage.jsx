import { shopCategoryUrl, findCategoryChain } from "../../utils/shopFilters";
import { ProductDetailsSkeleton } from "../../components/common/Skeleton";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";
import { useProduct } from "../../hooks/product/useProductTan";
import { useCategoryTree } from "../../hooks/product/useCategoryTan";
import { useCatalogSchema } from "../../hooks/catalog/useCatalogTan";
import {
  variantGalleryImages,
  effectiveModelUrl,
} from "../../utils/variantSelection";
import { useAddToWishlist, useRemoveFromWishlist, useCheckWishlist } from "../../hooks/cart/useWishlistTan";
import useAuthStore from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";
import { toast } from "../../lib/toast";
import ARViewModal from "../../components/modals/ARViewModal";
import ReviewModal from "../../components/modals/ReviewModal";
import ReviewSection from "../../components/shop/ReviewSection";
import { getImageUrl as getImageUrlUtil, buildImageSrcSet } from "../../utils/imageUrl";
import formatError from "../../utils/errorHandler";
import CategoryBar from "../../components/navigation/CategoryBar";
import { useCanReview, useUserReview } from "../../hooks/review/useReviewTan";
import Gallery, { GalleryLightbox } from "./product-details/Gallery";
import PurchasePanel from "./product-details/PurchasePanel";
import FeatureHighlights from "./product-details/FeatureHighlights";
import ProductDescription from "./product-details/ProductDescription";
import KeySpecifications from "./product-details/KeySpecifications";
import useVariantPurchase from "./product-details/hooks/useVariantPurchase";

export default function ProductDetailsPage() {
  const { productSlug } = useParams();
  const { isAuthenticated } = useAuthStore(useShallow((state) => ({ isAuthenticated: state.isAuthenticated })));

  const [selectedImage, setSelectedImage] = useState(0);
  const [isARModalOpen, setIsARModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      if (e.key === "ArrowRight") setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen]);

  const { data: productData, isLoading, error, refetch } = useProduct(productSlug);
  const product = productData?.data?.product;

  const { data: wishlistCheck } = useCheckWishlist(product?._id, { enabled: isAuthenticated && !!product?._id });
  const { mutate: addToWishlist, isPending: isAddingToWishlist } = useAddToWishlist();
  const { mutate: removeFromWishlist, isPending: isRemovingFromWishlist } = useRemoveFromWishlist();

  const isInWishlist = wishlistCheck?.data?.inWishlist || false;
  const isWishlistLoading = isAddingToWishlist || isRemovingFromWishlist;

  // Review state: can the user review, and have they already?
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

  const purchase = useVariantPurchase(product);
  const { isVariantProduct, selectedVariant } = purchase;

  const { data: schemaData } = useCatalogSchema();
  const definitions = schemaData?.data?.definitions || {};

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

  useEffect(() => {
    if (!product?._id) return;
    setSelectedImage(0);
  }, [product?._id]);

  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariant?._id]);

  const { data: categoryTreeData } = useCategoryTree();
  const buildBreadcrumbs = () => {
    const crumbs = [{ name: "Home", path: "/" }];
    if (product?.category) {
      const chain = findCategoryChain(
        categoryTreeData?.data?.categories || [],
        product.category.slug
      );
      if (chain.length > 0) {
        for (const ancestor of chain) {
          crumbs.push({ name: ancestor.name, path: shopCategoryUrl(ancestor.slug) });
        }
      } else {
        if (product.category.parent) {
          crumbs.push({ name: product.category.parent.name, path: shopCategoryUrl(product.category.parent.slug) });
        }
        crumbs.push({ name: product.category.name, path: shopCategoryUrl(product.category.slug) });
      }
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
  const images = variantGalleryImages(selectedVariant) || getImages();
  const getImageUrl = (image) => {
    return getImageUrlUtil(image?.url, "products");
  };
  const getImageSrcSet = (image, widths) =>
    buildImageSrcSet(image?.url, widths, { type: "products" });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <CategoryBar />
        <ProductDetailsSkeleton />
        <Footer />
      </>
    );
  }

  if (error && error.response?.status !== 404) {
    return (
      <>
        <Navbar />
        <CategoryBar />
        <main className="min-h-screen bg-white pt-20 font-dm-sans">
          <div className="max-w-7xl mx-auto px-6 py-16 text-center" role="alert">
            <h1 className="text-2xl font-playfair text-neutral-900 mb-4">Unable to load product</h1>
            <p className="text-neutral-500 mb-6">We couldn’t load this product right now. Please try again.</p>
            <button type="button" onClick={() => refetch()} className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-hover">Try again</button>
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
              className="inline-block bg-brand text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-hover transition-colors font-dm-sans"
            >
              Browse Products
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const descriptionImage = images[1] || images[0];
  const resolvedModelUrl = effectiveModelUrl(product, selectedVariant);

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
                  <Link to={crumb.path} className="text-neutral-500 hover:text-brand transition-colors whitespace-nowrap">
                    {crumb.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Product Section */}
          <div className="flex gap-10 mb-8">
            {/* Image Gallery */}
            <Gallery
              product={product}
              images={images}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              getImageUrl={getImageUrl}
              getImageSrcSet={getImageSrcSet}
              setIsLightboxOpen={setIsLightboxOpen}
              setIsARModalOpen={setIsARModalOpen}
            />

            {/* Product Info */}
            <PurchasePanel
              product={product}
              definitions={definitions}
              {...purchase}
              isInWishlist={isInWishlist}
              isWishlistLoading={isWishlistLoading}
              onWishlistToggle={handleWishlistToggle}
              onShare={handleShare}
            />
          </div>

          {/* Designed for Growing Spaces */}
          <FeatureHighlights productName={product.name} />

          {/* Product Description */}
          <ProductDescription
            product={product}
            image={descriptionImage}
            getImageUrl={getImageUrl}
            getImageSrcSet={getImageSrcSet}
            canViewInAR={!!resolvedModelUrl}
            onViewInAR={() => setIsARModalOpen(true)}
          />

          {/* Key Specifications */}
          <KeySpecifications product={product} selectedVariant={selectedVariant} />

          {/* Reviews */}
          <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-28">
            <div className="mb-6 flex items-center justify-between">
              <h2
                id="reviews-heading"
                className="font-dm-sans text-3xl font-bold tracking-tight text-neutral-900"
              >
                Customer Reviews
              </h2>

              {/* Placeholder write-review button — swap in the original
                  markup from ProductTabs if you want it pixel-identical. */}
              {isAuthenticated && !hasReviewed && (
                <button
                  type="button"
                  onClick={() => handleOpenReviewModal()}
                  className="rounded-lg bg-brand px-5 py-2.5 font-dm-sans text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  Write a review
                </button>
              )}
              {isAuthenticated && hasReviewed && userReview && (
                <button
                  type="button"
                  onClick={() => handleOpenReviewModal(userReview)}
                  className="rounded-lg border border-neutral-300 px-5 py-2.5 font-dm-sans text-sm font-semibold text-neutral-900 transition-colors hover:border-brand hover:text-brand"
                >
                  Edit your review
                </button>
              )}
            </div>

            <ReviewSection
              productId={product._id}
              productName={product.name}
              onEditReview={handleOpenReviewModal}
            />
          </section>
        </div>
      </main>
      <Footer />

      {/* The selected variant's modelUrl overrides the product model
          for AR when the variant carries one. */}
      <ARViewModal
        isOpen={isARModalOpen}
        onClose={() => setIsARModalOpen(false)}
        product={
          isVariantProduct
            ? { ...product, modelUrl: resolvedModelUrl }
            : product
        }
      />

      <ReviewModal
        key={editingReview?._id ?? "new"}
        isOpen={isReviewModalOpen}
        onClose={handleCloseReviewModal}
        productId={product?._id}
        existingReview={editingReview}
        productName={product?.name}
      />

      <GalleryLightbox
        isLightboxOpen={isLightboxOpen}
        setIsLightboxOpen={setIsLightboxOpen}
        images={images}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        product={product}
        getImageUrl={getImageUrl}
        getImageSrcSet={getImageSrcSet}
      />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}