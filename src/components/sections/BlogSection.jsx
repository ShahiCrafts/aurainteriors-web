import React from "react";
import { MoveRight, Calendar } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "The Art of Slow Living",
    excerpt: "How to select pieces that speak to the soul and transform your space into a sanctuary...",
    date: "28 April",
    category: "Philosophy",
    image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=2067&auto=format&fit=crop",
    author: {
      name: "Saugat Shahi",
      email: "saugat@decorx.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Saugat"
    }
  },
  {
    id: 2,
    title: "Seasonal Transitions",
    excerpt: "Exploring the tactile journey of velvet, oak, and woven linens for the changing light...",
    date: "22 April",
    category: "Curation",
    image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=2039&auto=format&fit=crop",
    author: {
      name: "Aakriti KC",
      email: "aakriti@decorx.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aakriti"
    }
  },
  {
    id: 3,
    title: "Sustainable Oak",
    excerpt: "Tracing the path of our FSC-certified European oak from forest to your living room...",
    date: "15 April",
    category: "Heritage",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2158&auto=format&fit=crop",
    author: {
      name: "Rohan Tamang",
      email: "rohan@decorx.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan"
    }
  },
  {
    id: 4,
    title: "The Light Study",
    excerpt: "Designing with natural illumination to enhance the architectural features of your home...",
    date: "08 April",
    category: "Design",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2070&auto=format&fit=crop",
    author: {
      name: "Ishani Rai",
      email: "ishani@decorx.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ishani"
    }
  }
];

export default function BlogSection() {
  return (
    <section className="bg-[#f6f6f6] py-12 font-dm-sans">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-9">

        {/* HEADER: COMPACT & REFINED */}
        <div className="flex items-center justify-between gap-8 mb-10">
          <div className="flex flex-col gap-2">
            <h2 className="text-[28px] font-bold text-[#1A1714] leading-tight tracking-[-0.04em]">
              Design stories from Decor<em className="text-[#F27318] not-italic">X</em>
            </h2>
            <p className="text-[14px] text-black/40 mt-1">Insights and inspiration for a curated lifestyle</p>
          </div>
          <button className="flex items-center gap-2 text-[12px] font-bold text-[#1A1714] hover:text-[#F27318] transition-all group pb-1.5 border-b border-black/5 hover:border-[#F27318]">
            Explore All
            <MoveRight size={16} className="transition-transform group-hover:translate-x-2" />
          </button>
        </div>

        {/* BLOG GRID: HIGH DENSITY (4 COLUMNS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="flex flex-col group cursor-pointer">
              {/* IMAGE: PERMANENT OVERLAYS */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-md mb-5 bg-[#F6F6F6] shadow-sm">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-all duration-700 scale-100 group-hover:scale-110"
                />

                {/* SUBTLE GRADIENT OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                {/* CATEGORY TAG (TOP LEFT) - COMPACT WHITE BOX */}
                <div className="absolute top-3 left-3">
                  <div className="bg-white px-2.5 h-[24px] flex items-center justify-center rounded-[2px] shadow-sm">
                    <span className="text-[12px] font-medium text-[#F27318] leading-none tracking-tight">{post.category}</span>
                  </div>
                </div>

                {/* AUTHOR OVERLAY (BOTTOM LEFT) */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/40 shadow-sm">
                    <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-white leading-tight drop-shadow-sm">{post.author.name}</span>
                    <span className="text-[12px] text-white/60 max-w-[100px] drop-shadow-sm">{post.author.email}</span>
                  </div>
                </div>

                {/* DATE OVERLAY (BOTTOM RIGHT) */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                  <Calendar size={12} className="text-white/80" />
                  <span className="text-[12px] font-medium text-white/90 drop-shadow-sm uppercase tracking-wider">{post.date}</span>
                </div>
              </div>

              {/* CONTENT: COMPACT TYPOGRAPHY */}
              <div className="flex flex-col gap-2.5">
                <h3 className="text-[17px] font-bold text-[#1A1714] leading-[1.3] tracking-tight group-hover:text-[#F27318] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-[14px] text-black/50 leading-relaxed font-light line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="pt-2">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-black/40 group-hover:text-[#F27318] transition-all group-hover:gap-3">
                    <span>Read More</span>
                    <div className="w-4 h-[1px] bg-black/10 group-hover:bg-[#F27318] transition-all group-hover:w-8"></div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
