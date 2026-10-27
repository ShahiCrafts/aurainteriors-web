// Phase 7 (catalog) — navigation: the desktop popup carries
// subtree product counts without changing link names; the mobile
// menu expands nested categories and links Rooms/Collections to
// their landing pages.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const state = vi.hoisted(() => ({ categories: [], rooms: [], collections: [] }));

vi.mock("../../../src/hooks/product/useCategoryTan", () => ({
  useCategoryTree: () => ({
    data: { data: { categories: state.categories } },
    isLoading: false,
  }),
}));
vi.mock("../../../src/hooks/product/useArCatalogTan", () => ({
  useArCatalogProducts: () => ({ data: undefined }),
}));
vi.mock("../../../src/hooks/catalog/useCatalogTan.js", () => ({
  useRooms: () => ({ data: { data: { rooms: state.rooms } }, isLoading: false }),
  useCollections: () => ({
    data: { data: { collections: state.collections } },
    isLoading: false,
  }),
}));

import CategoryBar from "../../../src/components/navigation/CategoryBar";
import MobileMenu from "../../../src/components/navigation/MobileMenu";

beforeEach(() => {
  state.categories = [
    {
      name: "Living Room",
      slug: "living-room",
      productCount: 9,
      subcategories: [
        {
          name: "Sofas",
          slug: "sofas",
          productCount: 5,
          subcategories: [{ name: "Corner Sofas", slug: "corner-sofas", productCount: 3 }],
        },
        { name: "Chairs", slug: "chairs", productCount: 4 },
      ],
    },
  ];
  state.rooms = [{ slug: "living-room", label: "Living Room" }];
  state.collections = [{ slug: "new-arrivals", label: "New Arrivals" }];
});

describe("CategoryBar All link", () => {
  it("renders an All link to /shop first in the bar", () => {
    render(
      <MemoryRouter>
        <CategoryBar />
      </MemoryRouter>
    );
    const all = screen.getByRole("link", { name: "All" });
    expect(all).toHaveAttribute("href", "/shop");
    const barLinks = screen.getAllByRole("link");
    expect(barLinks[0]).toBe(all);
  });

  it("marks All current only on the bare shop page", () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/shop"]}>
        <CategoryBar />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "All" })).toHaveAttribute("aria-current", "page");
    unmount();
    render(
      <MemoryRouter initialEntries={["/shop?categories=living-room"]}>
        <CategoryBar />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "All" })).not.toHaveAttribute("aria-current");
  });
});

describe("CategoryBar counts (Phase 7)", () => {
  it("popup shows subtree counts on group and descendant links; link names unchanged", () => {
    render(
      <MemoryRouter>
        <CategoryBar />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Living Room subcategories" }));
    expect(screen.getByRole("link", { name: "Sofas" })).toHaveAttribute("href", "/shop?categories=sofas");
    expect(screen.getByRole("link", { name: "Corner Sofas" })).toHaveAttribute("href", "/shop?categories=corner-sofas");
    const popup = document.getElementById("category-subcategories");
    expect(popup.textContent).toContain("5");
    expect(popup.textContent).toContain("3");
    // No "View all {category}" header link (and its root count) anymore —
    // the department link in the bar itself reaches the full listing.
    expect(screen.queryByRole("link", { name: /View all/ })).not.toBeInTheDocument();
  });
});

describe("MobileMenu catalog sections (Phase 7)", () => {
  const mount = () =>
    render(
      <MemoryRouter>
        <MobileMenu isOpen onClose={vi.fn()} />
      </MemoryRouter>
    );

  it("categories expand to nested subcategories", () => {
    mount();
    expect(screen.queryByText("Corner Sofas")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expand Living Room subcategories" }));
    expect(screen.getByRole("link", { name: /Sofas/ })).toHaveAttribute("href", "/shop?categories=sofas");
    fireEvent.click(screen.getByRole("button", { name: "Expand Sofas subcategories" }));
    expect(screen.getByRole("link", { name: /Corner Sofas/ })).toHaveAttribute("href", "/shop?categories=corner-sofas");
  });

  it("Rooms and Collections sections link to their landing pages", () => {
    const { container } = mount();
    expect(screen.getByText("Rooms")).toBeInTheDocument();
    // "Living Room" is also a category name — select by href.
    expect(container.querySelector('a[href="/rooms/living-room"]')).not.toBeNull();
    expect(screen.getByText("Collections")).toBeInTheDocument();
    expect(container.querySelector('a[href="/collections/new-arrivals"]')).not.toBeNull();
  });
});
