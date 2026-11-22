// Hero (Batch 3b): renders from site settings, whose defaults are the
// slides this component always hardcoded — so the default render must
// be the same headlines, copy, CTAs and links, and an admin edit must
// flow through.
//
// The hero renders the same settings content in a desktop bento and
// in mobile carousel/collection variants (CSS picks the visible one;
// jsdom renders both), so shared copy is asserted with getAllByText.
// Role queries stay unique: only the bento CTAs are <button>s — the
// mobile variants use styled spans inside their links.
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Hero from "../../../src/components/sections/Hero.jsx";
import useSiteSettingsStore, {
  DEFAULT_SITE_SETTINGS,
} from "../../../src/store/siteSettingsStore.js";

const renderHero = () =>
  render(
    <MemoryRouter>
      <Hero />
    </MemoryRouter>,
  );

beforeEach(() => {
  useSiteSettingsStore.getState().resetSettings();
});

describe("Hero with site settings", () => {
  it("renders the default slides identically (headlines, copy, CTA links)", () => {
    const { container } = renderHero();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Furniture That Fits You",
    );
    expect(
      screen.getAllByText(/handpicked collection of timeless sofas/).length,
    ).toBeGreaterThan(0);
    const mainCta = screen.getByRole("button", { name: "Explore Now" });
    expect(mainCta.closest("a")).toHaveAttribute(
      "href",
      "/shop?categories=living-room",
    );
    expect(
      screen.getAllByText("Sleep in Pure Comfort").length,
    ).toBeGreaterThan(0);
    const sideCta = screen.getByRole("button", { name: /Shop Beds/ });
    expect(sideCta.closest("a")).toHaveAttribute(
      "href",
      "/shop?categories=bedroom",
    );
    // Promo card (price pair stays in the component).
    expect(screen.getAllByText("Calmora Bed Frame").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Handcrafted solid sheesham wood frame/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Shop Sale/ })).toBeInTheDocument();
    // Default images are the bundled variants with full srcSets.
    const mainImg = container.querySelector('img[fetchpriority="high"]') ||
      container.querySelector("img");
    expect(mainImg.getAttribute("src")).toContain("hero-furniture-living-room-1200w");
    expect(mainImg.getAttribute("srcset")).toContain("600w");
    expect(mainImg.getAttribute("srcset")).toContain("1920w");
  });

  it("renders admin-edited slide copy and links", () => {
    const edited = structuredClone(DEFAULT_SITE_SETTINGS);
    edited.homepage.heroSlides[0] = {
      ...edited.homepage.heroSlides[0],
      headline: "Chairs For Every Corner",
      subtext: "Edited subtext from the admin panel.",
      buttonText: "Browse Chairs",
      buttonLink: "/shop?categories=chairs",
    };
    edited.homepage.promoBanner = {
      ...edited.homepage.promoBanner,
      headline: "Edited Promo",
      buttonText: "Grab It",
    };
    useSiteSettingsStore.getState().setSettings(edited);
    renderHero();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Chairs For Every Corner",
    );
    expect(
      screen.getAllByText("Edited subtext from the admin panel.").length,
    ).toBeGreaterThan(0);
    const cta = screen.getByRole("button", { name: "Browse Chairs" });
    expect(cta.closest("a")).toHaveAttribute("href", "/shop?categories=chairs");
    expect(screen.getAllByText("Edited Promo").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Grab It/ })).toBeInTheDocument();
  });

  it("uses a remote slide image directly when the admin sets one", () => {
    const edited = structuredClone(DEFAULT_SITE_SETTINGS);
    edited.homepage.heroSlides[0] = {
      ...edited.homepage.heroSlides[0],
      imageUrl: "https://res.cloudinary.com/demo/hero.webp",
    };
    useSiteSettingsStore.getState().setSettings(edited);
    const { container } = renderHero();
    const mainImg = container.querySelector("img");
    expect(mainImg.getAttribute("src")).toBe(
      "https://res.cloudinary.com/demo/hero.webp",
    );
    expect(mainImg.getAttribute("srcset")).toBeNull();
  });

  it("hides the promo card when the admin disables it", () => {
    const edited = structuredClone(DEFAULT_SITE_SETTINGS);
    edited.homepage.promoBanner = {
      ...edited.homepage.promoBanner,
      enabled: false,
    };
    useSiteSettingsStore.getState().setSettings(edited);
    renderHero();
    expect(screen.queryByText("Calmora Bed Frame")).not.toBeInTheDocument();
  });
});
