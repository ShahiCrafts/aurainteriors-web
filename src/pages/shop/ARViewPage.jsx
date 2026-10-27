import { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Skeleton from "../../components/common/Skeleton";
import { Link } from "react-router-dom";
import { useProduct } from "../../hooks/product/useProductTan";
import { useArCatalogProducts } from "../../hooks/product/useArCatalogTan";
import { useCategories } from "../../hooks/product/useCategoryTan";
import NativeARView from "../../components/ar/NativeARView";
import { useAddToCart } from "../../hooks/cart/useCartTan";
import useAuthStore from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";
import useGuestCartStore from "../../store/guestCartStore";
import { hasArModel, isIntroProduct } from "../../utils/arProducts";

const INTRO_PRODUCT = {
  _id: "intro",
  slug: "intro",
  name: "Aura Signature Sofa",
  description: "Experience modern luxury with our signature handcrafted sofa piece.",
  price: 45000,
  modelFiles: [{ format: "glb", url: "https://fabritor.s3.ap-southeast-1.amazonaws.com/models/sofa_chair.glb" }],
  modelUrl: "https://fabritor.s3.ap-southeast-1.amazonaws.com/models/sofa_chair.glb",
  images: [{ url: "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=800" }]
};

export default function ARViewPage() {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore(useShallow((state) => ({ isAuthenticated: state.isAuthenticated })));
  const { addItem: addGuestItem } = useGuestCartStore(useShallow((state) => ({ addItem: state.addItem })));
  const [customization, setCustomization] = useState({});
  const addInFlightRef = useRef(false);

  const { data: productData, isLoading: productLoading, error: productError } = useProduct(productSlug === "intro" ? null : productSlug, {
    enabled: productSlug !== "intro"
  });

  // FE-30: the picker catalog (page-walking, see useArCatalogProducts)
  // and the category tree stream in behind the AR experience. They
  // used to be part of isLoading, so AR blocked on a limit:100
  // catalog fetch plus the full category tree even though only the
  // linked product is needed to start.
  const { data: catalogData } = useArCatalogProducts();
  const { data: categoriesData } = useCategories();

  const product = productSlug === "intro" ? INTRO_PRODUCT : productData?.data?.product;
  const categories = categoriesData?.data?.categories || [];

  // Filter products for AR compatibility and include intro if needed
  const arProducts = useMemo(
    () =>
      (catalogData?.data?.products || []).filter(
        (p) => hasArModel(p) && p.slug !== productSlug
      ),
    [catalogData, productSlug]
  );

  // Combine selected product with others for the catalog
  const fullProducts = product ? [product, ...arProducts] : arProducts;

  // FE-30: only the selected product blocks rendering.
  const isLoading = productSlug !== "intro" && productLoading;

  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`/product/${encodeURIComponent(productSlug)}`);
    }
  };

  const handleProductSelect = (p) => {
    setCustomization({});
    if (p.slug !== productSlug) {
      navigate(`/ar/${encodeURIComponent(p.slug)}`, { replace: true });
    }
  };

  const handleCustomize = (newCustomization) => {
    setCustomization(newCustomization);
  };

  const handleAddToCart = (p) => {
    // FE-30: the synthetic intro product is not purchasable, and a
    // rapid double-tap must submit at most one mutation.
    if (!p || isIntroProduct(p)) return;
    if (addInFlightRef.current || isAddingToCart) return;
    // FE-30: guests use the guest cart (the same path the product
    // page offers) instead of being silently bounced to /shop.
    if (!isAuthenticated) {
      addGuestItem(p, 1);
      return;
    }
    addInFlightRef.current = true;
    addToCart(
      {
        productId: p._id,
        quantity: 1,
      },
      {
        onSettled: () => {
          addInFlightRef.current = false;
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center font-dm-sans p-6">
        <div className="w-full max-w-md p-8 bg-neutral-800 rounded-3xl border border-neutral-700 space-y-6 text-center">
          <Skeleton className="w-24 h-24 rounded-full mx-auto" />
          <Skeleton className="w-3/4 h-6 rounded mx-auto" />
          <Skeleton className="w-1/2 h-4 rounded mx-auto" />
          <p className="text-neutral-400 text-sm">Preparing 3D AR Experience...</p>
        </div>
      </div>
    );
  }

  if (productError || (!product && !isLoading)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-dm-sans">
        <div className="text-center">
          <AlertCircle size={48} className="text-neutral-400 mx-auto mb-4" />
          <h1 className="text-xl font-playfair text-neutral-900 mb-2">Product Not Found</h1>
          <p className="text-neutral-500 mb-6">The product you're looking for doesn't exist.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-teal-700 font-semibold hover:underline"
          >
            <ArrowLeft size={18} />
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <NativeARView
      products={fullProducts}
      categories={categories}
      selectedProduct={product}
      onProductSelect={handleProductSelect}
      customization={customization}
      onCustomize={handleCustomize}
      onClose={handleClose}
      onAddToCart={handleAddToCart}
      isLoading={isLoading}
    />
  );
}
