// Stacking contract: the header (Navbar) must layer ABOVE the
// CategoryBar. Both bars are sticky; the profile dropdown and the
// search dropdown live inside the Navbar's stacking context, while
// the mega-menu popup lives inside the CategoryBar's. When the two
// contexts tie, DOM order decides and the later CategoryBar paints
// over the profile menu — the bug this pins against.
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../../src/store/authStore", () => ({
  default: () => ({
    isAuthenticated: false,
    logout: vi.fn(),
    openAuthModal: vi.fn(),
    user: null,
  }),
}));
vi.mock("../../src/store/guestCartStore", () => ({
  default: (selector) => selector({ items: [] }),
}));
vi.mock("../../src/hooks/cart/useCartTan", () => ({
  useCart: () => ({ data: undefined }),
}));
vi.mock("../../src/hooks/cart/useWishlistTan", () => ({
  useWishlist: () => ({ data: undefined }),
}));
vi.mock("../../src/hooks/product/useProductTan", () => ({
  useProducts: () => ({ data: undefined, isLoading: false }),
}));
vi.mock("../../src/hooks/product/useCategoryTan", () => ({
  useCategoryTree: () => ({
    data: { data: { categories: [] } },
    isLoading: false,
  }),
}));
vi.mock("../../src/hooks/product/useArCatalogTan", () => ({
  useArCatalogProducts: () => ({ data: undefined }),
}));

import Navbar from "../../src/layouts/customer/Navbar";
import CategoryBar from "../../src/components/navigation/CategoryBar";

const zIndexOf = (element) => {
  const match = element.className.match(/(?:^|\s)z-(\d+)(?:\s|$)/);
  return match ? Number(match[1]) : 0;
};

describe("Navbar / CategoryBar stacking", () => {
  it("header stacking context sits above the CategoryBar context", () => {
    const queryClient = new QueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Navbar />
          <CategoryBar />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const header = container.querySelector("nav.sticky");
    const categoryBar = container.querySelector("div.sticky");
    expect(header).not.toBeNull();
    expect(categoryBar).not.toBeNull();
    expect(zIndexOf(header)).toBeGreaterThan(zIndexOf(categoryBar));
  });
});
