
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../../hooks/product/useProductTan";
import ProductCard from "../shop/ProductCard";
import { ProductCardSkeleton } from "../common/Skeleton";
import useInView from "../../hooks/useInView";
import { shopCategoryUrl } from "../../utils/shopFilters";
import PromoCard from "../common/PromoCard";

import promoSofasSeating from "../../assets/images/promo-sofas-seating.webp";
import promoLightingCollection from "../../assets/images/promo-lighting-collection.webp";

const ROWS = 2;

const PRODUCT_PARAMS = {
  limit: 5 * ROWS,
  sort: "-isFeatured,-createdAt",
  status: "active",
};

export default function FeaturedPieces() {
  const [visibleCount, setVisibleCount] = useState(5);
  const [sectionRef, isInView] = useInView();

  const { data: productData, isLoading } = useProducts(
    PRODUCT_PARAMS,
    { enabled: isInView }
  );

  const products = useMemo(
    () => productData?.data?.products || [],
    [productData]
  );

  React.useEffect(() => {
    const updateVisible = () => {
      if (window.innerWidth >= 1280) {
        setVisibleCount(5);
      } else if (window.innerWidth >= 768) {
        setVisibleCount(3);
      } else {
        setVisibleCount(2);
      }
    };

    updateVisible();

    window.addEventListener("resize", updateVisible, {
      passive: true,
    });

    return () => {
      window.removeEventListener("resize", updateVisible);
    };
  }, []);

  const visibleProducts = useMemo(
    () => products.slice(0, visibleCount * ROWS),
    [products, visibleCount]
  );

  return (
    <section
      ref={sectionRef}
      className="bg-white px-2 pb-10 pt-8 font-dm-sans md:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1440px]">

        {/* Section Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[14px] font-light text-black/40">
              Featured Products
            </p>

            <h2 className="mt-2 text-[28px] font-bold leading-tight text-[#1A1714] md:text-[36px]">
              Handpicked for Your Home
            </h2>

            <p className="mt-1.5 text-[14px] text-black/45 md:text-[15px]">
              Explore our most loved furniture, décor and lighting pieces.
            </p>
          </div>

          <Link
            to="/shop"
            className="text-[14px] font-semibold text-[#1A1714] underline underline-offset-4 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            View All Products
          </Link>
        </div>

        {/* Featured Products */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-5">
            {Array.from({
              length: visibleCount * ROWS,
            }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : visibleProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-5">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-[#FAF8F5] px-6 py-10 text-center text-[14px] text-black/45">
            No products available yet — check back soon.
          </p>
        )}

        {/* Promotional Cards */}
        <div className="mt-7 grid grid-cols-1 gap-3 lg:grid-cols-[3fr_2fr]">

          {/* Sofas & Seating */}
          <PromoCard
            variant="primary"
            eyebrow="Comfort Meets Style"
            title={
              <>
                Discover Comfort
                <br />
                <span className="text-[#FF6500]">
                  With our Sofa Collection
                </span>
              </>
            }
            description="Beautifully crafted sofas and seating for a more comfortable home."
            ctaLabel="Shop Sofas"
            ctaHref={shopCategoryUrl("living-room")}
            image={{
              src: promoSofasSeating,
              width: 1747,
              height: 900,
              alt: "Olive green two-seater sofa in a warm, sunlit living room",
            }}
          />

          {/* Lighting Collection */}
          <PromoCard
            variant="secondary"
            eyebrow="Elevate Your Space"
            title={
              <>
                Premium
                <br />
                <span className="text-[#FF6500]">
                  Lighting Collection
                </span>
              </>
            }
            description="Modern lighting for a warmer, more beautiful home."
            ctaLabel="Shop Lighting"
            ctaHref={shopCategoryUrl("lighting")}
            image={{
              src: promoLightingCollection,
              width: 1747,
              height: 900,
              alt: "Beige pendant lighting against a warm interior wall",
            }}
          />
        </div>
      </div>
    </section>
  );
}
