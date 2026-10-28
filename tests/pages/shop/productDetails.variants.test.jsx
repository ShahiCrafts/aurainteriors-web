// Phase 7 (catalog) — ProductDetailsPage variant flow: option
// groups from variantOptionKeys + schema labels; the selected
// variant drives price/compareAt, stock, gallery and the AR
// model; impossible combinations and out-of-stock values are
// disabled with reasons; add-to-cart sends variantId + sku;
// specifications render stored catalogAttributes only.
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { productState, cartState, guestState, authState, schemaState } =
  vi.hoisted(() => ({
    productState: { product: null },
    cartState: { mutate: vi.fn() },
    guestState: { addItem: vi.fn() },
    authState: { isAuthenticated: true },
    schemaState: { definitions: {} },
  }));

vi.mock("../../../src/hooks/product/useProductTan", () => ({
  useProduct: () => ({
    data: { data: { product: productState.product } },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useRelatedProducts: () => ({ data: undefined }),
}));

vi.mock("../../../src/hooks/product/useCategoryTan", () => ({
  useCategoryTree: () => ({
    data: {
      data: {
        categories: [
          {
            name: "Living Room",
            slug: "living-room",
            subcategories: [
              {
                name: "Sofas",
                slug: "sofas",
                subcategories: [{ name: "Corner Sofas", slug: "corner-sofas" }],
              },
            ],
          },
        ],
      },
    },
    isLoading: false,
  }),
}));

vi.mock("../../../src/hooks/catalog/useCatalogTan", () => ({
  // Hook data is the API body: { data: { definitions } }.
  useCatalogSchema: () => ({
    data: { data: { definitions: schemaState.definitions } },
    isLoading: false,
  }),
}));

vi.mock("../../../src/hooks/cart/useWishlistTan", () => ({
  useCheckWishlist: () => ({ data: undefined }),
  useAddToWishlist: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveFromWishlist: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../src/hooks/cart/useCartTan", () => ({
  useAddToCart: () => ({ mutate: cartState.mutate, isPending: false }),
}));

vi.mock("../../../src/hooks/review/useReviewTan", () => ({
  useCanReview: () => ({ data: undefined }),
  useUserReview: () => ({ data: undefined }),
}));

vi.mock("../../../src/store/authStore", () => {
  const store = () => ({ isAuthenticated: authState.isAuthenticated });
  store.getState = () => ({ openAuthModal: vi.fn() });
  return { default: store };
});

vi.mock("../../../src/store/guestCartStore", () => ({
  default: () => ({ addItem: guestState.addItem }),
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../../../src/layouts/customer/Navbar", () => ({
  default: () => <div>NAVBAR</div>,
}));
vi.mock("../../../src/layouts/customer/Footer", () => ({
  default: () => <div>FOOTER</div>,
}));
vi.mock("../../../src/components/navigation/CategoryBar", () => ({
  default: () => <div>CATEGORYBAR</div>,
}));
vi.mock("../../../src/components/shop/ProductCard", () => ({
  default: () => <div>PRODUCTCARD</div>,
}));
vi.mock("../../../src/components/shop/ImageMagnifier", () => ({
  default: ({ src }) => <img alt="main" src={src} />,
}));
vi.mock("../../../src/components/modals/ARViewModal", () => ({
  default: ({ product }) => (
    <div data-testid="ar-model">{product?.modelUrl || ""}</div>
  ),
}));
vi.mock("../../../src/components/modals/ReviewModal", () => ({
  default: () => null,
}));
vi.mock("../../../src/components/shop/ReviewSection", () => ({
  default: () => <div>REVIEWS</div>,
}));

import ProductDetailsPage from "../../../src/pages/shop/ProductDetailsPage.jsx";
import { formatNPR } from "../../../src/utils/formatCurrency.js";

const npr = (value) => formatNPR(value).replace(/ /g, " ");

const variantProduct = {
  _id: "prod-variant-pdp",
  name: "Aria Sofa",
  slug: "aria-sofa",
  price: 60000,
  originalPrice: 75000,
  stock: 12,
  images: [{ url: "https://images.unsplash.com/photo-product-main?w=800" }],
  category: { name: "Corner Sofas", slug: "corner-sofas" },
  hasVariants: true,
  priceFrom: 700,
  variantOptionKeys: ["color", "size"],
  modelUrl: "https://cdn.example/base.glb",
  arAvailable: true,
  catalogVariants: [
    {
      _id: "v1",
      sku: "ARIA-RED-KING",
      options: { color: "red", size: "King" },
      price: 1000,
      compareAtPrice: 1200,
      stock: 3,
      reservedStock: 1,
      enabled: true,
      images: ["https://images.unsplash.com/photo-variant-red?w=800"],
      modelUrl: "https://cdn.example/red.glb",
    },
    {
      _id: "v2",
      sku: "ARIA-BLUE-KING",
      options: { color: "blue", size: "King" },
      price: 900,
      stock: 2,
      reservedStock: 0,
      enabled: true,
    },
    {
      _id: "v3",
      sku: "ARIA-RED-SINGLE",
      options: { color: "red", size: "Single" },
      price: 800,
      stock: 5,
      reservedStock: 0,
      enabled: false,
    },
    {
      _id: "v4",
      sku: "ARIA-BLUE-SINGLE",
      options: { color: "blue", size: "Single" },
      price: 700,
      stock: 5,
      reservedStock: 0,
      enabled: true,
    },
    {
      _id: "v5",
      sku: "ARIA-GREEN-KING",
      options: { color: "green", size: "King" },
      price: 1100,
      stock: 0,
      reservedStock: 0,
      enabled: true,
    },
  ],
  catalogAttributes: {
    seatHeight: { value: 45, unit: "cm" },
    assemblyRequired: true,
  },
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/product/aria-sofa"]}>
      <Routes>
        <Route path="/product/:productSlug" element={<ProductDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authState.isAuthenticated = true;
  productState.product = variantProduct;
  schemaState.definitions = {
    color: {
      label: "Color",
      type: "enum",
      displayGroup: "Specifications",
      storage: "catalogAttributes",
    },
    size: {
      label: "Size",
      type: "enum",
      displayGroup: "Specifications",
      storage: "catalogAttributes",
    },
    seatHeight: {
      label: "Seat height",
      type: "measurement",
      unit: "cm",
      displayGroup: "Dimensions",
      storage: "catalogAttributes",
    },
    assemblyRequired: {
      label: "Assembly required",
      type: "boolean",
      displayGroup: "Dimensions",
      storage: "catalogAttributes",
    },
    warrantyYears: {
      label: "Warranty years",
      type: "integer",
      displayGroup: "Dimensions",
      storage: "catalogAttributes",
    },
  };
});

describe("ProductDetailsPage variant flow (Phase 7)", () => {
  it("lands on the first purchasable variant: its price, compareAt, SKU, stock, gallery and AR model", () => {
    renderPage();
    expect(screen.getByText(npr(1000))).toBeInTheDocument();
    expect(screen.getByText(npr(1200))).toBeInTheDocument();
    expect(screen.getByText("ARIA-RED-KING")).toBeInTheDocument();
    expect(screen.getByText(/In stock — 2 available/)).toBeInTheDocument();
    expect(screen.getByAltText("main").getAttribute("src")).toContain(
      "photo-variant-red",
    );
    expect(screen.getByTestId("ar-model")).toHaveTextContent(
      "https://cdn.example/red.glb",
    );
    // Breadcrumbs walk the full ancestors chain.
    expect(screen.getByRole("link", { name: "Living Room" })).toHaveAttribute(
      "href",
      "/shop?categories=living-room",
    );
    expect(screen.getByRole("link", { name: "Sofas" })).toHaveAttribute(
      "href",
      "/shop?categories=sofas",
    );
  });

  it("disables impossible combinations and out-of-stock values with reasons", () => {
    renderPage();
    // red + Single exists only on a disabled variant.
    const single = screen.getByRole("button", { name: "Single" });
    expect(single).toBeDisabled();
    expect(single).toHaveAttribute("title", "Unavailable in this combination");
    // green exists (King) but carries no stock.
    const green = screen.getByRole("button", { name: "green" });
    expect(green).toBeDisabled();
    expect(green).toHaveAttribute("title", "Out of stock");
    expect(
      screen.getByText(/Some options are out of stock/),
    ).toBeInTheDocument();
  });

  it("switching options moves price + SKU to the matching variant", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "blue" }));
    expect(screen.getByText(npr(900))).toBeInTheDocument();
    expect(screen.getByText("ARIA-BLUE-KING")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Single" }));
    expect(screen.getByText(npr(700))).toBeInTheDocument();
    expect(screen.getByText("ARIA-BLUE-SINGLE")).toBeInTheDocument();
    // v4 carries no images/model: the product gallery + model return.
    expect(screen.getByAltText("main").getAttribute("src")).toContain(
      "photo-product-main",
    );
    expect(screen.getByTestId("ar-model")).toHaveTextContent(
      "https://cdn.example/base.glb",
    );
  });

  it("caps quantity at the selected variant's available stock", () => {
    renderPage();
    const increase = screen.getByRole("button", { name: "Increase quantity" });
    fireEvent.click(increase);
    fireEvent.click(increase);
    fireEvent.click(increase);
    // v1 available = 3 - 1 = 2.
    expect(increase).toBeDisabled();
  });

  it("add-to-cart sends variantId + sku (auth) with an empty legacy triple", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Add to Cart/ }));
    expect(cartState.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "prod-variant-pdp",
        quantity: 1,
        variant: {},
        variantId: "v1",
        sku: "ARIA-RED-KING",
      }),
      expect.anything(),
    );
  });

  it("guest add-to-cart stores the variant identity + unit price", () => {
    authState.isAuthenticated = false;
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Add to Cart/ }));
    expect(guestState.addItem).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "prod-variant-pdp" }),
      1,
      {},
      {
        variantId: "v1",
        sku: "ARIA-RED-KING",
        unitPrice: 1000,
        options: { color: "red", size: "King" },
      },
    );
  });

  it("specifications render stored attributes grouped, and omit unset ones", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Specifications/ }));
    expect(await screen.findByText("Dimensions")).toBeInTheDocument();
    expect(screen.getByText("Seat height:")).toBeInTheDocument();
    expect(screen.getByText("45 cm")).toBeInTheDocument();
    expect(screen.getByText("Assembly required:")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.queryByText("Warranty years:")).not.toBeInTheDocument();
  });
});
