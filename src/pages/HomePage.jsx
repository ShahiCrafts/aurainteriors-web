import { Suspense, lazy, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchHomeData } from "../utils/prefetchHome";

// Above-the-fold — always eager, needed for first paint
import TopBar from "../layouts/customer/TopBar";
import Navbar from "../layouts/customer/Navbar";
import CategoryBar from "../components/navigation/CategoryBar";
import Hero from "../components/sections/Hero";

// Below-the-fold — lazy loaded; each in its own Suspense with a height-matched skeleton
const TrustBanner = lazy(() => import("../components/sections/TrustBanner"));
const ShopByCategory = lazy(
  () => import("../components/sections/ShopByCategory"),
);
const FeaturedPieces = lazy(
  () => import("../components/sections/FeaturedPieces"),
);
const Testimonials = lazy(() => import("../components/sections/Testimonials"));
const Footer = lazy(() => import("../layouts/customer/Footer"));

// ─── Skeleton helpers ───────────────────────────────────────────────────────
// Heights are approximate section heights; they keep the page layout stable
// while the lazy chunk downloads (avoiding cumulative layout shift).

function SectionSkeleton({ minHeight, className = "" }) {
  return (
    <div
      className={`animate-pulse bg-neutral-100 w-full ${className}`}
      style={{ minHeight }}
    />
  );
}

// ─── HomePage ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const queryClient = useQueryClient();

  // OPTIMIZATION: Phase 2c - Prefetch home page data on component mount
  // This starts the data fetch immediately instead of waiting for useInView
  // Result: Data arrives faster (parallel fetch with other page loads)
  useEffect(() => {
    prefetchHomeData(queryClient);
  }, [queryClient]);

  // FE-16: admins previously bounced to the /admin path, a route that does not
  // exist in the customer app (404 catch-all), and no admin-origin config
  // exists in this codebase. The homepage now renders normally for admins.

  return (
    <>
      {/* ── ABOVE THE FOLD (eager) ─────────────────────────────────────── */}
      <TopBar />
      <Navbar />
      <CategoryBar />

      <main className="min-h-screen">
        {/* Hero is above the fold — always eager */}
        <Hero />

        {/* ── BELOW THE FOLD (lazy, each in its own Suspense) ─────────── */}

        {/*
          TrustBanner: sale countdown card + value-props strip. The
          countdown was removed under FE-14 as a hardcoded fake and
          restored at the owner's request; it now takes a saleEndsAt
          target (end of day until the sale feature supplies one).
          No API calls; skeleton ~120px to match its compact height.
        */}
        <Suspense fallback={<SectionSkeleton minHeight="120px" />}>
          <TrustBanner />
        </Suspense>

        {/*
          ShopByCategory: category grid display.
          Skeleton ~300px to match the category card grid height.
        */}
        <Suspense fallback={<SectionSkeleton minHeight="300px" />}>
          <ShopByCategory />
        </Suspense>

        {/*
          FeaturedPieces: product grid.
          The useProducts() fetch inside is gated behind useInView,
          so the API call is deferred until this section nears the viewport.
          Skeleton ~400px matches the product card grid height.
        */}
        <Suspense fallback={<SectionSkeleton minHeight="400px" />}>
          <FeaturedPieces />
        </Suspense>

        {/*
          Testimonials: static hardcoded data — no API calls.
          Skeleton ~400px matches the carousel + header height.
        */}
        <Suspense fallback={<SectionSkeleton minHeight="400px" />}>
          <Testimonials />
        </Suspense>

        {/*
          Footer: static links + newsletter form + BrandMarquee (also static).
          No API calls. Skeleton ~360px.
        */}
        <Suspense fallback={<SectionSkeleton minHeight="360px" />}>
          <Footer />
        </Suspense>
      </main>
    </>
  );
}
