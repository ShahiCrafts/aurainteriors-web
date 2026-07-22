import { Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

// Above-the-fold — always eager, needed for first paint
import TopBar from "../layouts/customer/TopBar";
import Navbar from "../layouts/customer/Navbar";
import CategoryBar from "../components/navigation/CategoryBar";
import Hero from "../components/sections/Hero";

// Below-the-fold — lazy loaded; each in its own Suspense with a height-matched skeleton
const TrustBanner = lazy(() => import("../components/sections/TrustBanner"));
const ShopByCategory = lazy(() => import("../components/sections/ShopByCategory"));
const FeaturedPieces = lazy(() => import("../components/sections/FeaturedPieces"));
const BlogSection = lazy(() => import("../components/sections/BlogSection"));
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
  const { isAuthenticated, user } = useAuthStore();

  // Redirect admin users to admin dashboard
  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

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
          TrustBanner: countdown timer + value-props strip.
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
          BlogSection: static hardcoded posts — no API calls.
          Skeleton ~500px matches the 4-column blog card grid.
        */}
        <Suspense fallback={<SectionSkeleton minHeight="500px" />}>
          <BlogSection />
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
