import React from "react";
import { MoveRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

import { useBlogs } from "../../hooks/blog/useBlogTan";
import { getBlogImageUrl } from "../../utils/imageUrl";
import { formatDate as formatDateShared } from "../../utils/formatDate";

export default function BlogSection() {
  const { data, isLoading, isError } = useBlogs({ page: 1, limit: 5, sort: "-publishedAt" });
  const blogPosts = data?.data?.blogs || [];
  return (
    <section className="bg-[#FAFAFA] py-8 md:py-12 font-dm-sans">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8">

        {/* HEADER: COMPACT & REFINED */}
        <div className="flex items-center justify-between gap-8 mb-6 md:mb-8">
          <div>
            <h2 className="text-[24px] md:text-[32px] font-semibold text-[#1A1714]">
              Design stories from Aura <em className="text-[#F27318] not-italic">Interiors</em>
            </h2>
            <p className="text-[14px] md:text-[15px] text-black/40 mt-1">Insights and inspiration for a curated lifestyle</p>
          </div>
          <Link to="/blog" className="flex items-center gap-2 text-[13px] md:text-[14px] font-semibold text-[#1A1714] hover:text-[#F27318] transition-all group pb-1.5 border-b-2 border-black/5 hover:border-[#F27318]">
            Explore All <MoveRight size={18} className="transition-transform group-hover:translate-x-2" />
          </Link>
        </div>

        {/* BLOG GRID: 5 COLUMNS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-6">
          {isLoading && Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="animate-pulse" aria-hidden="true">
              <div className="aspect-[4/3] rounded-md bg-neutral-200 mb-5" />
              <div className="h-4 bg-neutral-200 rounded mb-3" />
              <div className="h-3 bg-neutral-100 rounded w-3/4" />
            </div>
          ))}
          {!isLoading && (isError || blogPosts.length === 0) && (
            <p className="col-span-full text-sm text-black/50">{isError ? "Design stories are temporarily unavailable." : "No design stories available yet."}</p>
          )}
          {!isLoading && !isError && blogPosts.map((post) => (
            <Link to={`/blog/${encodeURIComponent(post.slug || post._id)}`} key={post._id} className="flex flex-col group cursor-pointer">
              {/* IMAGE: PERMANENT OVERLAYS */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-md mb-5 bg-[#F6F6F6] shadow-sm">
                <img
                  src={getBlogImageUrl(post.featuredImage)}
                  alt={post.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-all duration-700 scale-100 group-hover:scale-110"
                />

                {/* SUBTLE GRADIENT OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                <div className="absolute top-2 left-2 bg-white text-[#F27318] text-[10px] font-semibold px-2 py-1 rounded font-dm-sans z-10 uppercase tracking-wide">
            {post.categoryName || post.category?.replace(/-/g, " ")}
          </div>

                

                {/* AUTHOR OVERLAY (BOTTOM LEFT) */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/40 shadow-sm">
                    {post.author?.avatarUri || post.author?.avatar?.url || post.author?.avatar?.uri ? (
                      <img src={post.author.avatarUri || post.author.avatar?.url || post.author.avatar?.uri} alt={post.author?.name || "Editorial Team"} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#F27318] text-white flex items-center justify-center text-xs font-semibold" aria-label={post.author?.name || "Editorial Team"}>
                        {(post.author?.name || "Editorial Team").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-white leading-tight drop-shadow-sm">{post.author?.name || "Editorial Team"}</span>
                    <span className="text-[12px] text-white/60 max-w-[100px] drop-shadow-sm">{post.source?.name || ""}</span>
                  </div>
                </div>

                {/* DATE OVERLAY (BOTTOM RIGHT) */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                  <Calendar size={12} className="text-white/80" />
                  <span className="text-[12px] font-medium text-white/90 drop-shadow-sm uppercase tracking-wider">{formatDateShared(post.publishedAt || post.createdAt, { day: "2-digit", month: "short" })}</span>
                </div>
              </div>

              {/* CONTENT: COMPACT TYPOGRAPHY */}
              <div className="flex flex-col gap-2.5">
                <h3 className="text-[16px] font-semibold text-[#1A1714] leading-[1.3] tracking-tight group-hover:text-[#F27318] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-[14px] text-black/50 leading-relaxed font-light line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="pt-2">
                  <div className="flex items-center gap-1.5 text-[14px] font-semibold text-black/40 group-hover:text-[#F27318] transition-all group-hover:gap-3">
                    <span>Read More</span>
                    <div className="w-4 h-[1px] bg-black/10 group-hover:bg-[#F27318] transition-all group-hover:w-8"></div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
