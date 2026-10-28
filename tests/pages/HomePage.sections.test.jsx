// HomePage composition: the Blog section no longer appears on the
// landing page (the /blogs pages themselves are untouched).
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
vi.mock("../../src/components/sections/BlogSection", () => ({
  default: () => <div data-testid="blog-section" />,
}));
vi.mock("../../src/components/sections/Testimonials", () => ({
  default: () => <div data-testid="testimonials" />,
}));
vi.mock("../../src/layouts/customer/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));
vi.mock("../../src/utils/prefetchHome", () => ({ prefetchHomeData: vi.fn() }));

import HomePage from "../../src/pages/HomePage.jsx";

describe("HomePage sections", () => {
  it("renders the landing sections without a Blog section", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <HomePage />
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId("featured-pieces")).toBeInTheDocument();
    expect(await screen.findByTestId("testimonials")).toBeInTheDocument();
    expect(screen.queryByTestId("blog-section")).not.toBeInTheDocument();
  });
});
