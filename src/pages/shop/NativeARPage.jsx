import { useState, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NativeARView from "../../components/ar/NativeARView";
import { useProduct } from "../../hooks/product/useProductTan";
import { useArCatalogProducts } from "../../hooks/product/useArCatalogTan";
import { useCategories } from "../../hooks/product/useCategoryTan";
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
  modelFiles: [{ format: "glb", url: "/sofa_chair.glb" }],
  modelUrl: "/sofa_chair.glb",
  images: [{ url: "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=800" }]
};

export default function NativeARPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialProductSlug = useMemo(
    () => new URLSearchParams(location.search).get("select"),
    [location.search]
  );
  const { isAuthenticated } = useAuthStore(useShallow((state) => ({ isAuthenticated: state.isAuthenticated })));
  const { addItem: addGuestItem } = useGuestCartStore(useShallow((state) => ({ addItem: state.addItem })));
  const [userSelectedProduct, setUserSelectedProduct] = useState(null);
  const [customization, setCustomization] = useState({});
  const addInFlightRef = useRef(false);

  // FE-30: a deep link (?select=<slug>) is resolved by fetching THAT
  // product directly. Previously the page waited for a limit:100
  // catalog fetch and ran a selection effect over an array rebuilt on
  // every render: the effect selected the intro product before the
  // data arrived and the !selectedProduct guard then blocked the real
  // target forever, so QR/deep links always opened the demo sofa.
  const wantsLinked = !!initialProductSlug && initialProductSlug !== "intro";
  const {
    data: linkedData,
    isLoading: linkedLoading,
    isError: linkedError,
  } = useProduct(wantsLinked ? initialProductSlug : null);
  const linkedProduct = linkedData?.data?.product || null;

  // The picker catalog (walks every server page — see
  // useArCatalogProducts) and the category tree stream in behind the
  // AR experience; neither gates rendering or session start.
  const { data: catalogData, isLoading: catalogLoading } = useArCatalogProducts();
  const { data: categoriesData } = useCategories();

  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

  const categories = categoriesData?.data?.categories || [];

  const arProducts = useMemo(
    () => (catalogData?.data?.products || []).filter(hasArModel),
    [catalogData]
  );

  const allArProducts = useMemo(() => {
    if (
      linkedProduct &&
      hasArModel(linkedProduct) &&
      !arProducts.some((p) => p._id === linkedProduct._id)
    ) {
      return [INTRO_PRODUCT, linkedProduct, ...arProducts];
    }
    return [INTRO_PRODUCT, ...arProducts];
  }, [arProducts, linkedProduct]);

  // FE-30: the initial selection is DERIVED, not set by an effect.
  // An effect over a rebuilt-every-render array was the original bug:
  // it fired with only the intro product present and latched it. The
  // derived value tracks the deep-link fetch as it settles; an
  // explicit user pick (catalog tap, or an FE-21 rollback) wins.
  const resolvedProduct = useMemo(() => {
    if (!wantsLinked) return INTRO_PRODUCT;
    if (linkedProduct) {
      // A linked product with no AR model is absent from the AR
      // catalog by definition; fall back to the intro.
      return hasArModel(linkedProduct) ? linkedProduct : INTRO_PRODUCT;
    }
    if (linkedLoading) return null; // Wait for the direct fetch to settle.
    // The direct lookup settled without a product (e.g. 404): the
    // catalog may still know the slug; otherwise fall back to intro.
    const found = arProducts.find(
      (p) => p.slug === initialProductSlug || p._id === initialProductSlug
    );
    if (found) return found;
    if (!catalogLoading || linkedError) return INTRO_PRODUCT;
    return null;
  }, [
    wantsLinked,
    linkedProduct,
    linkedLoading,
    linkedError,
    arProducts,
    catalogLoading,
    initialProductSlug,
  ]);
  const selectedProduct = userSelectedProduct || resolvedProduct;

  const handleClose = () => {
    navigate(-1);
  };

  const handleProductSelect = (product) => {
    setUserSelectedProduct(product);
    setCustomization({});
  };

  const handleCustomize = (newCustomization) => {
    setCustomization(newCustomization);
  };

  const handleAddToCart = (product) => {
    // FE-30: the synthetic intro product is not purchasable, and a
    // rapid double-tap must submit at most one mutation.
    if (!product || isIntroProduct(product)) return;
    if (addInFlightRef.current || isAddingToCart) return;
    // FE-30: guests use the guest cart (the same path the product
    // page offers) instead of being silently bounced to /shop.
    if (!isAuthenticated) {
      addGuestItem(product, 1);
      return;
    }
    addInFlightRef.current = true;
    addToCart(
      {
        productId: product._id,
        quantity: 1,
      },
      {
        onSettled: () => {
          addInFlightRef.current = false;
        },
      }
    );
  };

  // FE-30: only the deep-linked product's own fetch may block the AR
  // entry; the catalog and categories load in the background.
  const isLoading = wantsLinked && linkedLoading;

  return (
    <NativeARView
      products={allArProducts}
      categories={categories}
      selectedProduct={selectedProduct}
      onProductSelect={handleProductSelect}
      customization={customization}
      onCustomize={handleCustomize}
      onClose={handleClose}
      onAddToCart={handleAddToCart}
      isLoading={isLoading}
    />
  );
}
