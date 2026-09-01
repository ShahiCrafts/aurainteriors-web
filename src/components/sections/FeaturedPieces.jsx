import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MoveRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useProducts } from "../../hooks/product/useProductTan";
import ProductCard from "../shop/ProductCard";
import Skeleton, { ProductCardSkeleton } from "../common/Skeleton";
import useInView from "../../hooks/useInView";

export default function FeaturedPieces() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(6);

  // Only fire the API call once this section scrolls near the viewport.
  // The rootMargin in useInView pre-fetches 200px before the element enters
  // the screen, so products load just before the user sees the section.
  const [sectionRef, isInView] = useInView();

  const { data: productData, isLoading } = useProducts(
    { limit: 12, sort: "-isFeatured,-createdAt", status: "active" },
    // Spread any extra options; enabled gates the network request
    { enabled: isInView }
  );

  const products = productData?.data?.products || [];
  
  // Update visible count based on screen size
  React.useEffect(() => {
    const updateVisible = () => {
      if (window.innerWidth >= 1024) setVisibleCount(6);
      else if (window.innerWidth >= 768) setVisibleCount(3);
      else setVisibleCount(2);
    };
    updateVisible();
    window.addEventListener("resize", updateVisible, { passive: true });
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  const maxIndex = Math.max(0, products.length - visibleCount);
  const canScroll = products.length > visibleCount;

  // Clamp currentIndex when data or visibleCount changes
  React.useEffect(() => {
    if (currentIndex > maxIndex) setCurrentIndex(Math.max(0, maxIndex));
  }, [products.length, visibleCount, maxIndex, currentIndex]);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const slidePercent = 100 / visibleCount;

  return (
    <section ref={sectionRef} className="bg-white pt-8 pb-8 md:pt-8 mt-0 px-2 md:px-6 lg:px-8 font-dm-sans">
      <div className="max-w-[1440px] mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h2 className="text-[24px] md:text-[32px] font-semibold text-[#1A1714]">Discover what's new</h2>
            <p className="text-[14px] md:text-[15px] text-black/40 mt-1">Designed to refresh your everyday life</p>
          </div>
          <Link to="/shop" className="flex items-center gap-2 text-[14px] md:text-[15px] font-medium text-[#1A1714] hover:text-[#F27318] transition-all group pb-1.5 border-b-2 border-black/5 hover:border-[#F27318]">
            View all products <MoveRight size={18} className="transition-transform group-hover:translate-x-2" />
          </Link>
        </div>

        {/* PRODUCTS CAROUSEL */}
        <div className="relative">
          {/* NAVIGATION BUTTONS */}
          <div className={`absolute top-1/2 -left-4 -right-4 -translate-y-1/2 flex justify-between pointer-events-none z-10 ${canScroll ? 'hidden lg:flex' : 'hidden'}`}>
            <button 
              onClick={prevSlide}
              className={`w-12 h-12 rounded-full bg-white shadow-lg border border-black/5 flex items-center justify-center text-black/40 hover:text-[#F27318] hover:scale-110 transition-all pointer-events-auto ${currentIndex === 0 ? 'opacity-30 pointer-events-none' : ''}`}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextSlide}
              className={`w-12 h-12 rounded-full bg-white shadow-lg border border-black/5 flex items-center justify-center text-black/40 hover:text-[#F27318] hover:scale-110 transition-all pointer-events-auto ${currentIndex >= maxIndex ? 'opacity-30 pointer-events-none' : ''}`}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* SLIDER WINDOW */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-700 ease-out gap-4 md:gap-5"
              style={{ transform: `translateX(-${currentIndex * slidePercent}%)` }}
            >
              {isLoading ? (
                [...Array(12)].map((_, i) => (
                  <div key={i} className="min-w-[calc(100%-0px)] md:min-w-[calc(33.333%-11px)] lg:min-w-[calc(16.667%-17px)]">
                    <ProductCardSkeleton />
                  </div>
                ))
              ) : (
                products.map((product) => (
                  <div key={product._id} className="min-w-[calc(100%-0px)] md:min-w-[calc(33.333%-11px)] lg:min-w-[calc(16.667%-17px)]">
                    <ProductCard product={product} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
