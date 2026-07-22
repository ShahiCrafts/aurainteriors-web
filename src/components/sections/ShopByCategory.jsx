import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MoveRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCategoryTree } from "../../hooks/product/useCategoryTan";
import Skeleton from "../common/Skeleton";
import useInView from "../../hooks/useInView";

export default function ShopByCategory() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Only fire the API call once this section scrolls near the viewport
  const [sectionRef, isInView] = useInView();

  const { data: categoryTreeData, isLoading } = useCategoryTree();
  const categories = categoryTreeData?.data?.categories || [];

  // Calculate if we can scroll (more than 6 categories)
  const canScroll = categories.length > 6;
  const maxIndex = Math.max(0, categories.length - 6);

  const handleCategoryClick = (category) => {
    navigate(`/shop/${category.slug}`);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <section ref={sectionRef} className="bg-white pt-8 md:pt-8 mt-0 px-2 md:px-6 lg:px-8 font-dm-sans">
      <div className="max-w-[1440px] mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h2 className="text-[24px] md:text-[28px] font-semibold text-[#1A1714]">Shop by Category</h2>
            <p className="text-[14px] md:text-[15px] text-black/40 mt-1">Find exactly what you're looking for</p>
          </div>
          <Link to="/shop" className="flex items-center gap-2 text-[14px] md:text-[15px] font-medium text-[#1A1714] hover:text-[#F27318] transition-all group pb-1.5 border-b-2 border-black/5 hover:border-[#F27318]">
            View all categories <MoveRight size={18} className="transition-transform group-hover:translate-x-2" />
          </Link>
        </div>

        {/* CATEGORIES GRID */}
        <div className="relative">
          {/* NAVIGATION BUTTONS - Show only if scrollable */}
          {canScroll && (
            <div className="absolute top-1/2 -left-4 -right-4 -translate-y-1/2 flex justify-between pointer-events-none z-10 hidden lg:flex">
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
          )}

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-5">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col">
                  <Skeleton className="w-full rounded-lg" style={{ height: '160px' }} />
                  <Skeleton className="w-3/4 h-4 mx-auto mt-3 mb-2" />
                  <Skeleton className="w-1/2 h-3 mx-auto" />
                </div>
              ))
            ) : (
              categories.slice(0, 6).map((category) => (
                <div
                  key={category._id}
                  onClick={() => handleCategoryClick(category)}
                  className="group cursor-pointer"
                >
                  {/* Category Card - Fixed height with image scaling */}
                  <div className="bg-[#f6f6f6] rounded-lg overflow-hidden transition-all duration-300 group-hover:bg-[#ededed] flex flex-col">
                    
                    {/* Image Section - Fixed height with image scaled to fit */}
                    <div className="w-full h-28 flex items-center justify-center overflow-hidden bg-transparent">
                      {category.image ? (
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className="w-full h-full object-scale-down"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#F4EFE7] to-[#EBE5DB]" />
                      )}
                    </div>

                    {/* Text Section */}
                    <div className="flex flex-col items-center justify-center pb-3 pt-0.5 px-2">
                      <h3 className="text-[13px] md:text-[14px] font-medium text-[#1A1714] text-center line-clamp-1 w-full">
                        {category.name}
                      </h3>
                      <p className="text-[11px] md:text-[12px] text-[#7A7068] text-center w-full">
                        {category.productCount || "0"} items
                      </p>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
