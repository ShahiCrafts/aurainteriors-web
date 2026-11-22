// HomePage (Batch 3b): section order and visibility come from site
// settings; defaults reproduce the original composition and order.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../../src/layouts/customer/TopBar", () => ({
  default: () => <div data-testid="topbar" />,
}));
vi.mock("../../src/layouts/customer/Navbar", () => ({
  default: () => <div data-testid="navbar" />,
}));
vi.mock("../../src/components/navigation/CategoryBar", () => ({
  default: () => <div data-testid="category-bar" />,
}));
vi.mock("../../src/components/sections/Hero", () => ({
  default: () => <div data-testid="hero" />,
}));
vi.mock("../../src/components/sections/TrustBanner", () => ({
  default: () => <div data-testid="trust-banner" />,
}));
vi.mock("../../src/components/sections/ShopByCategory", () => ({
  default: () => <div data-testid="shop-by-category" />,
}));
vi.mock("../../src/components/sections/FeaturedPieces", () => ({
  default: () => <div data-testid="featured-pieces" />,
}));
vi.mock("../../src/components/sections/Testimonials", () => ({
  default: () => <div data-testid="testimonials" />,
}));
vi.mock("../../src/layouts/customer/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));
vi.mock("../../src/utils/prefetchHome", () => ({ prefetchHomeData: vi.fn() }));

import HomePage from "../../src/pages/HomePage.jsx";
import { orderedHomeSections } from "../../src/utils/homeSections.js";
import useSiteSettingsStore, {
  DEFAULT_SITE_SETTINGS,
} from "../../src/store/siteSettingsStore.js";

const renderHome = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <HomePage />
    </QueryClientProvider>,
  );

beforeEach(() => {
  useSiteSettingsStore.getState().resetSettings();
});

describe("HomePage with site settings", () => {
  it("renders sections in the default order", async () => {
    const { container } = renderHome();
    expect(await screen.findByTestId("testimonials")).toBeInTheDocument();
    const order = [...container.querySelectorAll("[data-testid]")].map((el) =>
      el.getAttribute("data-testid"),
    );
    const sectionOrder = order.filter((id) =>
      ["hero", "trust-banner", "shop-by-category", "featured-pieces", "testimonials", "footer"].includes(id),
    );
    expect(sectionOrder).toEqual([
      "hero",
      "trust-banner",
      "shop-by-category",
      "featured-pieces",
      "testimonials",
      "footer",
    ]);
  });

  it("honours an admin-changed section order and a disabled section", async () => {
    const edited = structuredClone(DEFAULT_SITE_SETTINGS);
    edited.homepage.sectionsOrder = [
      "testimonials",
      "featuredPieces",
      "shopByCategory",
      "trustBanner",
      "hero",
    ];
    edited.homepage.sections.shopByCategory = false;
    useSiteSettingsStore.getState().setSettings(edited);
    renderHome();
    expect(await screen.findByTestId("testimonials")).toBeInTheDocument();
    expect(screen.queryByTestId("shop-by-category")).not.toBeInTheDocument();
    expect(orderedHomeSections(edited.homepage)).toEqual([
      "testimonials",
      "featuredPieces",
      "trustBanner",
      "hero",
    ]);
  });

  it("orderedHomeSections falls back to the default order for junk input", () => {
    expect(orderedHomeSections(null)).toEqual([
      "hero",
      "trustBanner",
      "shopByCategory",
      "featuredPieces",
      "testimonials",
    ]);
    expect(orderedHomeSections({ sections: {}, sectionsOrder: ["nope"] })).toEqual([
      "hero",
      "trustBanner",
      "shopByCategory",
      "featuredPieces",
      "testimonials",
    ]);
  });
});
