
import React from "react";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { shopCategoryUrl } from "../../utils/shopFilters";
import { useCategoryTree } from "../../hooks/product/useCategoryTan";
import { CategoryCardSkeleton } from "../common/Skeleton";
import useInView from "../../hooks/useInView";
import { getCategoryImageUrl } from "../../utils/imageUrl";
import PromoCard from "../common/PromoCard";

import promoTablesCategory600 from "../../assets/images/promo-tables-category-600.webp";
import promoTablesCategory1200 from "../../assets/images/promo-tables-category-1200.webp";
import promoTablesCategory1920 from "../../assets/images/promo-tables-category-1920.webp";

export default function ShopByCategory() {
  const [sectionRef, isInView] = useInView();

  const { data: categoryTreeData, isLoading } = useCategoryTree({
    enabled: isInView,
  });

  const categories = categoryTreeData?.data?.categories || [];

  return (
    <section
      ref={sectionRef}
      className="mt-0 bg-white px-2 pt-8 font-dm-sans md:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[14px] font-light text-black/40">
              Shop by Category
            </p>

            <h2 className="mt-2 text-[28px] font-bold leading-tight text-[#1A1714] md:text-[36px]">
              Explore Our Categories
            </h2>

            <p className="mt-1.5 text-[14px] text-black/45 md:text-[15px]">
              Discover furniture and décor for every space, styled for modern living.
            </p>
          </div>

          <Link
            to="/shop"
            className="text-[14px] font-semibold text-[#1A1714] underline underline-offset-4 transition-colors hover:text-[#F27318] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F27318]"
          >
            View All Categories
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4 lg:grid-cols-8">
          {isLoading
            ? Array.from({ length: 12 }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))
            : categories.map((category) => {
                const count = category.productCount || 0;

                return (
                  <Link
                    key={category._id}
                    to={shopCategoryUrl(category.slug)}
                    className="group flex aspect-square flex-col overflow-hidden rounded-sm border border-black/[0.06] bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F27318] md:rounded-lg"
                  >
                    <div className="min-h-0 w-full flex-1 overflow-hidden bg-gradient-to-br from-[#F4EFE7] to-[#EBE5DB]">
                      {category.image && (
                        <img
                          src={getCategoryImageUrl(category.image)}
                          alt={category.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[14px] font-bold leading-snug text-[#1A1714]">
                          {category.name}
                        </h3>

                        <p className="text-[12px] leading-snug text-black/40">
                          {count} {count === 1 ? "item" : "items"}
                        </p>
                      </div>

                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f6f6f6] text-[#1A1714] transition-colors group-hover:bg-[#F27318] group-hover:text-white"
                      >
                        <MoveRight size={15} />
                      </span>
                    </div>
                  </Link>
                );
              })}
        </div>

        <PromoCard
          compact
          className="mt-7"
          eyebrow="New Arrivals"
          title="Fresh Pieces for a Better Home"
          description="Explore our latest furniture, décor and lighting collections."
          ctaLabel="Shop New Arrivals"
          ctaHref="/shop?sort=newest"
          image={{
            src: promoTablesCategory1200,
            srcSet: `${promoTablesCategory600} 600w, ${promoTablesCategory1200} 1200w, ${promoTablesCategory1920} 1920w`,
            sizes: "(max-width: 767px) 100vw, 60vw",
            width: 1200,
            height: 800,
            alt: "Wooden dining table and sideboard with ceramic vases in a sunlit room",
          }}
        />
      </div>
    </section>
  );
}
