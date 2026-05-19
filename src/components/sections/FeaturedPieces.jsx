import React from "react";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { useProducts } from "../../hooks/product/useProductTan";
import ProductCard from "../shop/ProductCard";
import Skeleton from "../common/Skeleton";

export default function FeaturedPieces() {
  const { data: productData, isLoading } = useProducts({
    limit: 5,
    sort: "-isFeatured,-createdAt",
    status: "active"
  });

  const products = productData?.data?.products || [];

  return (
    <section className="bg-white pt-2 pb-8 md:py-12 mt-0 px-2 md:px-6 lg:px-9 font-dm-sans">
      <div className="max-w-[1440px] mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-[28px] md:text-[36px] font-black text-[#1A1714] tracking-tight">Discover what’s new</h2>
            <p className="text-[15px] text-black/40 mt-1 font-medium">Designed to refresh your everyday life</p>
          </div>
          <Link to="/shop" className="flex items-center gap-2 text-[14px] font-bold text-[#1A1714] hover:text-[#F27318] transition-all group pb-1.5 border-b-2 border-black/5 hover:border-[#F27318]">
            View All <MoveRight size={18} className="transition-transform group-hover:translate-x-2" />
          </Link>
        </div>

        {/* PRODUCTS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className={`flex flex-col gap-4 ${i >= 4 ? 'hidden xl:flex' : i >= 3 ? 'hidden lg:flex' : ''}`}>
                <Skeleton className="w-full aspect-[16/11] rounded-md" />
                <div className="space-y-3">
                  <Skeleton className="w-3/4 h-6" />
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-1/2 h-6" />
                </div>
              </div>
            ))
          ) : (
            products.map((product, index) => (
              <div key={product._id} className={index >= 4 ? 'hidden xl:flex' : index >= 3 ? 'hidden lg:flex' : ''}>
                <ProductCard product={product} />
              </div>
            ))
          )}
        </div>

      </div>
    </section>
  );
}
