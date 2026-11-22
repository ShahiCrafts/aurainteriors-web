// SiteSettingsEffects (Batch 3b): theme CSS variables, favicon and
// head alignment follow site settings; with defaults every value set
// is identical to what the site already ships.
import { beforeEach, describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";

import SiteSettingsEffects from "../../../src/components/common/SiteSettingsEffects.jsx";
import {
  applySiteTheme,
  applyFavicon,
  applySeoHeadAlignment,
  applyCustomCss,
  applyDocumentLanguage,
} from "../../../src/lib/siteSettingsDom.js";
import useSiteSettingsStore, {
  DEFAULT_SITE_SETTINGS,
} from "../../../src/store/siteSettingsStore.js";
import { __resetAnalytics } from "../../../src/lib/analytics.js";

beforeEach(() => {
  useSiteSettingsStore.getState().resetSettings();
  __resetAnalytics();
  document.documentElement.removeAttribute("style");
  document.head.innerHTML = "";
  document.title = "";
});

describe("SiteSettingsEffects", () => {
  it("sets the theme CSS variables from settings", () => {
    render(<SiteSettingsEffects />);
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--brand-primary")).toBe("#F27318");
    expect(style.getPropertyValue("--brand-primary-hover")).toBe("#D9620E");
    expect(style.getPropertyValue("--brand-navy")).toBe("#1E2C4A");
    expect(style.getPropertyValue("--color-brand")).toBe("#F27318");
    expect(style.getPropertyValue("--color-brand-hover")).toBe("#D9620E");
    expect(style.getPropertyValue("--brand-radius")).toBe("0.5rem");
    expect(style.getPropertyValue("--brand-font")).toContain("DM Sans");
  });

  it("applySiteTheme maps the radius tokens", () => {
    const root = document.createElement("div");
    applySiteTheme({ ...DEFAULT_SITE_SETTINGS.theme, buttonRadius: "pill" }, root);
    expect(root.style.getPropertyValue("--brand-radius")).toBe("9999px");
    applySiteTheme({ ...DEFAULT_SITE_SETTINGS.theme, buttonRadius: "square" }, root);
    expect(root.style.getPropertyValue("--brand-radius")).toBe("0rem");
    applySiteTheme(
      { ...DEFAULT_SITE_SETTINGS.theme, primaryColor: "#123456", fontFamily: "Lato" },
      root,
    );
    expect(root.style.getPropertyValue("--brand-primary")).toBe("#123456");
    expect(root.style.getPropertyValue("--color-brand")).toBe("#123456");
    expect(root.style.getPropertyValue("--font-dm-sans")).toContain("Lato");
  });

  it("applyFavicon only rewrites the icon link when it differs", () => {
    const link = document.createElement("link");
    link.setAttribute("rel", "icon");
    link.setAttribute("href", "/favicon.png");
    document.head.appendChild(link);
    applyFavicon({ faviconUrl: "/favicon.png" });
    expect(link.getAttribute("href")).toBe("/favicon.png");
    applyFavicon({ faviconUrl: "https://cdn.example/icon.png" });
    expect(link.getAttribute("href")).toBe("https://cdn.example/icon.png");
  });

  it("head alignment updates the static template title/meta but never a page title", () => {
    document.title = "Aura Interiors – Redefine Your Space";
    const meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute(
      "content",
      "Aura Interiors – Discover handcrafted furniture and home décor that transforms your living space. Shop sofas, beds, dining sets, wardrobes and more.",
    );
    document.head.appendChild(meta);
    applySeoHeadAlignment({
      defaultTitle: "New Store – New Title",
      metaDescription: "New description",
      ogImage: "",
    });
    expect(document.title).toBe("New Store – New Title");
    expect(meta.getAttribute("content")).toBe("New description");

    // A page-specific Seo title is left alone.
    document.title = "FAQs – Delivery, Returns & Warranty | Aura Interiors Nepal";
    applySeoHeadAlignment({
      defaultTitle: "Another Title",
      metaDescription: "New description",
      ogImage: "",
    });
    expect(document.title).toBe(
      "FAQs – Delivery, Returns & Warranty | Aura Interiors Nepal",
    );
  });

  it("Batch 3d defaults: background var, light header, no dark mode, no custom CSS, en-NP lang", () => {
    render(<SiteSettingsEffects />);
    const style = document.documentElement.style;
    const root = document.documentElement;
    expect(style.getPropertyValue("--brand-bg")).toBe("#f3f4f6");
    expect(style.getPropertyValue("--brand-card-radius")).toBe("0.5rem");
    expect(style.getPropertyValue("--brand-card-shadow")).toBe(
      "0 1px 3px rgb(0 0 0 / 0.08)",
    );
    expect(root.getAttribute("data-header-style")).toBe("light");
    expect(root.hasAttribute("data-theme-mode")).toBe(false);
    expect(root.getAttribute("lang")).toBe("en-NP");
    expect(document.getElementById("site-custom-css")).toBeNull();
  });

  it("applySiteTheme maps header style, dark mode and card toggles", () => {
    const root = document.createElement("div");
    applySiteTheme(
      {
        ...DEFAULT_SITE_SETTINGS.theme,
        headerStyle: "navy",
        darkMode: true,
        roundedCards: false,
        showShadows: false,
        backgroundColor: "#ABCDEF",
      },
      root,
    );
    expect(root.getAttribute("data-header-style")).toBe("navy");
    expect(root.getAttribute("data-theme-mode")).toBe("dark");
    // The configured background colour is still published as the
    // var; the appended CSS layer performs the dark visual swap
    // under html[data-theme-mode="dark"].
    expect(root.style.getPropertyValue("--brand-bg")).toBe("#ABCDEF");
    expect(root.style.getPropertyValue("--brand-card-radius")).toBe("0rem");
    expect(root.style.getPropertyValue("--brand-card-shadow")).toBe("none");

    applySiteTheme(
      { ...DEFAULT_SITE_SETTINGS.theme, backgroundColor: "#ABCDEF" },
      root,
    );
    expect(root.style.getPropertyValue("--brand-bg")).toBe("#ABCDEF");
    expect(root.hasAttribute("data-theme-mode")).toBe(false);
  });

  it("applyCustomCss injects, updates and removes the single style element", () => {
    applyCustomCss({ customCss: ".foo { color: red; }" });
    const el = document.getElementById("site-custom-css");
    expect(el).not.toBeNull();
    expect(el.textContent).toBe(".foo { color: red; }");
    applyCustomCss({ customCss: ".bar { color: blue; }" });
    expect(document.querySelectorAll("#site-custom-css")).toHaveLength(1);
    expect(
      document.getElementById("site-custom-css").textContent,
    ).toBe(".bar { color: blue; }");
    applyCustomCss({ customCss: "" });
    expect(document.getElementById("site-custom-css")).toBeNull();
    applyCustomCss({ customCss: "   " });
    expect(document.getElementById("site-custom-css")).toBeNull();
    applyCustomCss({});
    expect(document.getElementById("site-custom-css")).toBeNull();
  });

  it("applyDocumentLanguage sets the html lang from the seo section", () => {
    applyDocumentLanguage({ defaultLanguage: "ne" });
    expect(document.documentElement.lang).toBe("ne");
    applyDocumentLanguage({ defaultLanguage: "" });
    expect(document.documentElement.lang).toBe("ne");
    applyDocumentLanguage({});
    expect(document.documentElement.lang).toBe("ne");
  });

  it("effects inject custom CSS from settings when present", () => {
    const edited = structuredClone(DEFAULT_SITE_SETTINGS);
    edited.theme.customCss = ".promo { display: none; }";
    act(() => {
      useSiteSettingsStore.getState().setSettings(edited);
    });
    render(<SiteSettingsEffects />);
    expect(
      document.getElementById("site-custom-css")?.textContent,
    ).toBe(".promo { display: none; }");
  });

  it("injects analytics only when IDs are configured (defaults inject nothing)", () => {
    render(<SiteSettingsEffects />);
    expect(document.querySelector("script[data-analytics]")).toBeNull();

    const edited = structuredClone(DEFAULT_SITE_SETTINGS);
    edited.seo.googleAnalyticsId = "G-ABC123";
    act(() => {
      useSiteSettingsStore.getState().setSettings(edited);
    });
    render(<SiteSettingsEffects />);
    expect(
      document.querySelector('script[data-analytics="ga4"]'),
    ).not.toBeNull();
  });
});
