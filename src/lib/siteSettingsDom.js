import { injectAnalytics } from "./analytics";
import { SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from "../seo/site";
import { substituteStoreName } from "../seo/settingsBridge";

// DOM side effects of site settings (Batch 3b), split from the
// SiteSettingsEffects component so this module can be unit-tested and
// imported without React. No-visible-change contract: every function
// below is a no-op when the settings equal the built-in defaults —
// the CSS variables are set to the very values the stylesheet already
// uses, the favicon href already matches, and the title/meta
// alignment only fires while the head still carries the static
// template values (never over a page-specific <Seo> title).

export const RADIUS_TOKENS = {
  rounded: "0.5rem", // = Tailwind rounded-lg, what brand buttons use today
  square: "0rem",
  pill: "9999px",
};

export function applySiteTheme(theme, root) {
  if (!theme || typeof document === "undefined") return;
  const el = root || document.documentElement;
  const set = (name, value) => {
    if (typeof value === "string" && value.trim()) {
      el.style.setProperty(name, value.trim());
    }
  };
  set("--brand-primary", theme.primaryColor);
  set("--brand-primary-hover", theme.primaryHoverColor);
  set("--brand-navy", theme.navyColor);
  // Tailwind v4 emits utilities as var(--color-brand) etc., so setting
  // the theme variables themselves re-skins every bg-brand / text-brand
  // / border-brand / ring-brand surface without touching markup.
  set("--color-brand", theme.primaryColor);
  set("--color-brand-hover", theme.primaryHoverColor);
  if (typeof theme.fontFamily === "string" && theme.fontFamily.trim()) {
    const stack = `"${theme.fontFamily.trim()}", sans-serif`;
    set("--brand-font", stack);
    set("--font-dm-sans", stack);
  }
  if (theme.buttonRadius && RADIUS_TOKENS[theme.buttonRadius]) {
    set("--brand-radius", RADIUS_TOKENS[theme.buttonRadius]);
  }
  // Batch 3d additions. Every default reproduces the current look:
  // --brand-bg #f3f4f6 is the page background index.html ships,
  // header-style "light" is the white navbar, dark mode off.
  set("--brand-bg", theme.backgroundColor);
  if (theme.headerStyle) {
    el.setAttribute("data-header-style", theme.headerStyle);
  }
  if (theme.darkMode) {
    el.setAttribute("data-theme-mode", "dark");
  } else {
    el.removeAttribute("data-theme-mode");
  }
  // Card radius/shadow vars: consumed by the appended CSS layer's
  // card rules and the admin previews. Defaults = today's values.
  set(
    "--brand-card-radius",
    theme.roundedCards === false ? "0rem" : "0.5rem",
  );
  set(
    "--brand-card-shadow",
    theme.showShadows === false
      ? "none"
      : "0 1px 3px rgb(0 0 0 / 0.08)",
  );
}

// Batch 3d: admin Custom CSS (Settings → Advanced) is injected as a
// single managed <style id="site-custom-css"> element. Empty text
// (the default) removes the element entirely — nothing is injected
// on the site as it ships today.
export function applyCustomCss(theme) {
  if (typeof document === "undefined") return;
  const css =
    typeof theme?.customCss === "string" ? theme.customCss.trim() : "";
  let style = document.getElementById("site-custom-css");
  if (!css) {
    if (style) style.remove();
    return;
  }
  if (!style) {
    style = document.createElement("style");
    style.id = "site-custom-css";
    document.head.appendChild(style);
  }
  if (style.textContent !== css) style.textContent = css;
}

// Batch 3d: Settings → SEO Default Language drives <html lang>.
// The server default is "en-NP" (the store's locale).
export function applyDocumentLanguage(seo) {
  if (typeof document === "undefined") return;
  const lang = seo?.defaultLanguage;
  if (typeof lang === "string" && lang.trim()) {
    document.documentElement.lang = lang.trim();
  }
}

export function applyFavicon(identity) {
  if (typeof document === "undefined") return;
  const href = identity?.faviconUrl;
  if (!href) return;
  let link = document.head.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "icon");
    document.head.appendChild(link);
  }
  if (link.getAttribute("href") !== href) link.setAttribute("href", href);
}

const STATIC_TEMPLATE_TITLE = "Aura Interiors – Redefine Your Space";
const BUILT_IN_META_DESCRIPTION =
  "Aura Interiors – Discover handcrafted furniture and home décor that transforms your living space. Shop sofas, beds, dining sets, wardrobes and more.";

// Aligns ONLY the static template's head values with the settings SEO
// defaults. If a page's <Seo> component has already applied its own
// title/description (anything other than the template/fallback
// values), this leaves it alone.
export function applySeoHeadAlignment(seo) {
  if (typeof document === "undefined" || !seo) return;
  if (
    seo.defaultTitle &&
    document.title === STATIC_TEMPLATE_TITLE &&
    seo.defaultTitle !== document.title
  ) {
    document.title = seo.defaultTitle;
  }
  const desc = document.head.querySelector('meta[name="description"]');
  if (
    desc &&
    seo.metaDescription &&
    (desc.getAttribute("content") === SITE_DESCRIPTION ||
      desc.getAttribute("content") === BUILT_IN_META_DESCRIPTION) &&
    desc.getAttribute("content") !== seo.metaDescription
  ) {
    desc.setAttribute("content", seo.metaDescription);
  }
  const og = document.head.querySelector('meta[property="og:image"]');
  if (
    og &&
    seo.ogImage &&
    og.getAttribute("content") === DEFAULT_OG_IMAGE &&
    seo.ogImage !== DEFAULT_OG_IMAGE
  ) {
    og.setAttribute("content", seo.ogImage);
  }
}

export function applySiteSettingsDom(settings) {
  if (!settings) return;
  applySiteTheme(settings.theme);
  applyCustomCss(settings.theme);
  applyFavicon(settings.identity);
  // The Default Title Pattern may carry a {store_name} token —
  // substitute the current store name before aligning the head.
  const seo = settings.seo
    ? {
        ...settings.seo,
        defaultTitle: substituteStoreName(
          settings.seo.defaultTitle,
          settings.identity?.storeName,
        ),
      }
    : settings.seo;
  applySeoHeadAlignment(seo);
  applyDocumentLanguage(settings.seo);
  injectAnalytics(settings.seo);
}
