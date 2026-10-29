import { Suspense, lazy, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchHomeData } from "../utils/prefetchHome";
import TopBar from "../layouts/customer/TopBar";
import Navbar from "../layouts/customer/Navbar";
import CategoryBar from "../components/navigation/CategoryBar";
import Hero from "../components/sections/Hero";

const TrustBanner = lazy(() => import("../components/sections/TrustBanner"));
const ShopByCategory = lazy(
  () => import("../components/sections/ShopByCategory"),
);
const FeaturedPieces = lazy(
  () => import("../components/sections/FeaturedPieces"),
);
const Testimonials = lazy(() => import("../components/sections/Testimonials"));
const Footer = lazy(() => import("../layouts/customer/Footer"));

function SectionSkeleton({ minHeight, className = "" }) {
  return (
    <div
      className={`animate-pulse bg-neutral-100 w-full ${className}`}
      style={{ minHeight }}
    />
  );
}

export default function HomePage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    prefetchHomeData(queryClient);
  }, [queryClient]);

  return (
    <>
      <TopBar />
      <Navbar />
      <CategoryBar />

      <main className="min-h-screen">
        <Hero />

        <Suspense fallback={<SectionSkeleton minHeight="120px" />}>
          <TrustBanner />
        </Suspense>

        <Suspense fallback={<SectionSkeleton minHeight="300px" />}>
          <ShopByCategory />
        </Suspense>

        <Suspense fallback={<SectionSkeleton minHeight="400px" />}>
          <FeaturedPieces />
        </Suspense>

        <Suspense fallback={<SectionSkeleton minHeight="400px" />}>
          <Testimonials />
        </Suspense>

        <Suspense fallback={<SectionSkeleton minHeight="360px" />}>
          <Footer />
        </Suspense>
      </main>
    </>
  );
}
