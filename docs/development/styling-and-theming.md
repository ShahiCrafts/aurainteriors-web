# Styling & Theming

## Stack

- **Tailwind CSS v4** (via `@tailwindcss/vite`) with the theme defined in CSS
  in `src/styles/index.css` — there is no `tailwind.config.js`.
- Brand defaults: primary orange `#F27318`, hover `#D9620E`, navy `#1E2C4A`,
  font **DM Sans** (`font-dm-sans`).
- Icons: `lucide-react`. Motion: `framer-motion`. Charts (admin): `recharts`.

## Brand tokens

Components should use the semantic tokens, not raw hex values:

| Token / class | Meaning |
| --- | --- |
| `bg-brand`, `text-brand`, `border-brand` | Primary brand colour (`--brand-primary`, default `#F27318`) |
| `bg-brand-hover` | Hover state (`--brand-primary-hover`, default `#D9620E`) |
| `--brand-navy` | Deep navy used for the splash/header accents (`#1E2C4A`) |
| `--brand-radius` | Corner radius for brand buttons (admin-themeable: square / default / pill) |
| `--brand-bg`, `--brand-card-radius`, `--brand-card-shadow` | Page background and card styling from settings |

At runtime, `siteSettingsStore` overwrites these CSS variables from
`/api/v1/settings/public`, so **token-driven components re-theme live** when
the owner changes colours in Store Settings. Hard-coded hex values do not —
the codebase has been progressively migrated to tokens; keep new code on
tokens.

Two deliberate exceptions exist in the shared chat components
(`src/components/chat/`), which keep a neutral stone palette in both apps.

## Responsive conventions

- Breakpoints are Tailwind defaults: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- **Mobile design mirrors the desktop design** — same roundedness, backgrounds
  and strokes — unless a mobile-specific pattern is clearly better (e.g. the
  bottom navigation). Mobile-only adjustments should use `max-md:` overrides
  or mobile-scoped base classes so desktop rendering never changes by accident.
- Page sections share the container rhythm `px-4 md:px-6 lg:px-8` with a
  `max-w-360` (1440px) inner column on the storefront.
- The customer app reserves bottom space on mobile for the fixed bottom nav
  (`padding-bottom: calc(66px + env(safe-area-inset-bottom))` on `body` below
  `md`, set in `index.css`); fixed-position elements (chat FAB, chat window)
  offset by the same 76px + safe-area rule.
- The admin uses an `.admin-theme` scope on `body` so customer theme rules
  (including dark-mode and header-style variants) never leak into the panel.

## Header styles & dark mode (settings-driven)

`data-header-style` on `<html>` can restyle the customer navbar (`light`
default, `navy`, `black`); `data-theme-mode="dark"` swaps the page background
and base text colour. Both are owner settings (Store Settings → Theme),
implemented as scoped CSS blocks at the end of `index.css`.

## Rules for new styles

1. Use brand tokens for anything owner-themeable.
2. Match the desktop component's radius/background/stroke on mobile.
3. Add a matching skeleton in `src/components/common/Skeleton.jsx` for new
   data-driven blocks.
4. Never hard-code the API or app URL in styles or markup — configuration
   comes from env/settings.
