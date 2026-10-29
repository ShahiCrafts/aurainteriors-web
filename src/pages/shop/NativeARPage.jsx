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
import productArSofaLifestyle from "../../assets/images/products/product-ar-sofa-lifestyle.webp";

const INTRO_PRODUCT = {
  _id: "intro",
  slug: "intro",
  name: "Aura Signature Sofa",
  description:
    "Experience modern luxury with our signature handcrafted sofa piece.",
  price: 45000,
  modelFiles: [{ format: "glb", url: "/sofa-chair.glb" }],
  modelUrl: "/sofa-chair.glb",
  images: [
    {
      url: productArSofaLifestyle,
    },
  ],
};

export default function NativeARPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialProductSlug = useMemo(
    () => new URLSearchParams(location.search).get("select"),
    [location.search],
  );
  const { isAuthenticated } = useAuthStore(
    useShallow((state) => ({ isAuthenticated: state.isAuthenticated })),
  );
  const { addItem: addGuestItem } = useGuestCartStore(
    useShallow((state) => ({ addItem: state.addItem })),
  );
  const [userSelectedProduct, setUserSelectedProduct] = useState(null);
  const [customization, setCustomization] = useState({});
  const addInFlightRef = useRef(false);
  const wantsLinked = !!initialProductSlug && initialProductSlug !== "intro";
  const {
    data: linkedData,
    isLoading: linkedLoading,
    isError: linkedError,
  } = useProduct(wantsLinked ? initialProductSlug : null);
  const linkedProduct = linkedData?.data?.product || null;

  const { data: catalogData, isLoading: catalogLoading } =
    useArCatalogProducts();
  const { data: categoriesData } = useCategories();

  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

  const categories = categoriesData?.data?.categories || [];

  const arProducts = useMemo(
    () => (catalogData?.data?.products || []).filter(hasArModel),
    [catalogData],
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

  const resolvedProduct = useMemo(() => {
    if (!wantsLinked) return INTRO_PRODUCT;
    if (linkedProduct) {
      return hasArModel(linkedProduct) ? linkedProduct : INTRO_PRODUCT;
    }
    if (linkedLoading) return null;
    const found = arProducts.find(
      (p) => p.slug === initialProductSlug || p._id === initialProductSlug,
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
    if (!product || isIntroProduct(product)) return;
    if (addInFlightRef.current || isAddingToCart) return;
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
      },
    );
  };

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
