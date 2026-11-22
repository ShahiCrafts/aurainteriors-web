import { Suspense, lazy, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchHomeData } from "../utils/prefetchHome";
import TopBar from "../layouts/customer/TopBar";
import Seo from "../components/common/Seo.jsx";
import Navbar from "../layouts/customer/Navbar";
import CategoryBar from "../components/navigation/CategoryBar";
import Hero from "../components/sections/Hero";
import useSiteSettingsStore from "../store/siteSettingsStore";
import { orderedHomeSections } from "../utils/homeSections";

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

// Batch 3b: homepage section order/visibility come from site settings
// (homepage.sections / homepage.sectionsOrder). The settings defaults
// are the order below with every section enabled, so the default page
// is byte-for-byte the composition this file always rendered. Each
// section keeps its exact original wrapper (Hero eager, the rest lazy
// behind their original skeletons); Footer is not a settings section
// and always renders last.
const SECTION_RENDERERS = {
  hero: () => <Hero key="hero" />,
  trustBanner: () => (
    <Suspense key="trustBanner" fallback={<SectionSkeleton minHeight="120px" />}>
      <TrustBanner />
    </Suspense>
  ),
  shopByCategory: () => (
    <Suspense key="shopByCategory" fallback={<SectionSkeleton minHeight="300px" />}>
      <ShopByCategory />
    </Suspense>
  ),
  featuredPieces: () => (
    <Suspense key="featuredPieces" fallback={<SectionSkeleton minHeight="400px" />}>
      <FeaturedPieces />
    </Suspense>
  ),
  testimonials: () => (
    <Suspense key="testimonials" fallback={<SectionSkeleton minHeight="400px" />}>
      <Testimonials />
    </Suspense>
  ),
};

export default function HomePage() {
  const queryClient = useQueryClient();
  const homepage = useSiteSettingsStore((s) => s.settings.homepage);

  useEffect(() => {
    prefetchHomeData(queryClient);
  }, [queryClient]);

  return (
    <>
      <Seo
        title="Furniture in Nepal – Buy Furniture Online | Aura Interiors"
        description="Shop furniture online in Nepal: sofas, beds, dining sets, wardrobes, lighting and décor from Aura Interiors, Lalitpur – with delivery across Nepal."
        path="/"
      />
      <TopBar />
      <Navbar />
      <CategoryBar />

      <main className="min-h-screen">
        {orderedHomeSections(homepage).map((key) => SECTION_RENDERERS[key]())}

        <Suspense fallback={<SectionSkeleton minHeight="360px" />}>
          <Footer />
        </Suspense>
      </main>
    </>
  );
}
