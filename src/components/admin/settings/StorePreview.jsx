import { Search, ShoppingCart } from "lucide-react";

// Mini storefront preview (Batch 3d) used by the Store Identity and
// Theme & Branding tabs. Renders a small storefront chrome — header
// with logo + nav + Shop Now, hero with headline and CTA, carousel
// dots — entirely from the LOCAL (unsaved) identity + theme values
// so admins see the effect of their edits before saving.
//
// Header style mirrors the storefront wiring: light = white header,
// navy = the theme's navy colour, black = black; on dark headers the
// dark logo variant is used when one is set.
const RADIUS_CSS = { rounded: "0.5rem", square: "0", pill: "9999px" };

export default function StorePreview({
  identity,
  theme,
  heroImage = "",
  heroHeadline = "",
  testId = "store-preview",
}) {
  const headerStyle = theme?.headerStyle || "light";
  const dark = headerStyle !== "light";
  const headerBg = dark
    ? headerStyle === "black"
      ? "#000000"
      : theme?.navyColor || "#1E2C4A"
    : "#ffffff";
  const logoSrc =
    dark && identity?.logoDarkUrl ? identity.logoDarkUrl : identity?.logoUrl;
  const primary = theme?.primaryColor || "#F27318";
  const radius = RADIUS_CSS[theme?.buttonRadius] || "0.5rem";
  const headline =
    heroHeadline || identity?.tagline || identity?.storeName || "Your store";

  return (
    <div
      data-testid={testId}
      className="border border-gray-200 rounded-2xl overflow-hidden bg-white"
      style={{ fontFamily: theme?.fontFamily || "inherit" }}
    >
      {/* Mini header */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100"
        style={{ backgroundColor: headerBg }}
      >
        <span className="flex items-center min-w-0">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={identity?.storeName || "Store logo"}
              className="h-7 w-auto object-contain"
            />
          ) : (
            <span
              className={`font-semibold text-sm truncate ${dark ? "text-white" : "text-gray-900"}`}
            >
              {identity?.storeName || "Your store"}
            </span>
          )}
        </span>
        <nav
          className={`hidden sm:flex items-center gap-4 text-xs ${dark ? "text-white/85" : "text-gray-600"}`}
        >
          <span>Home</span>
          <span>Products</span>
          <span>About</span>
          <span>Contact</span>
        </nav>
        <span
          className={`flex items-center gap-3 ${dark ? "text-white" : "text-gray-700"}`}
        >
          <Search className="w-4 h-4" />
          <ShoppingCart className="w-4 h-4" />
          <span
            className="text-white text-xs font-medium px-3 py-1.5"
            style={{ backgroundColor: primary, borderRadius: radius }}
          >
            Shop Now
          </span>
        </span>
      </div>
      {/* Mini hero */}
      <div className="relative">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="w-full h-44 object-cover"
          />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-gray-100 to-gray-200" />
        )}
        <div className="absolute inset-0 flex flex-col justify-center px-5 bg-black/25">
          <p className="text-white font-bold text-lg leading-snug max-w-[75%]">
            {headline}
          </p>
          <span
            className="mt-3 inline-flex w-fit text-white text-xs font-medium px-3.5 py-2"
            style={{ backgroundColor: primary, borderRadius: radius }}
          >
            Shop Now →
          </span>
        </div>
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: primary }}
          />
          <span className="w-2 h-2 rounded-full bg-white/60" />
          <span className="w-2 h-2 rounded-full bg-white/60" />
        </div>
      </div>
    </div>
  );
}
