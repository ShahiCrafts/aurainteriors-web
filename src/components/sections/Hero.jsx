import { shopCategoryUrl } from "../../utils/shopFilters";
import heroFurniture600 from "../../assets/images/hero/hero-furniture-living-room-600w.webp";
import heroFurniture1200 from "../../assets/images/hero/hero-furniture-living-room-1200w.webp";
import heroFurniture1920 from "../../assets/images/hero/hero-furniture-living-room-1920w.webp";
import heroBedroom600 from "../../assets/images/hero/hero-bedroom-comfort-600w.webp";
import heroBedroom1200 from "../../assets/images/hero/hero-bedroom-comfort-1200w.webp";
import heroBedroom1920 from "../../assets/images/hero/hero-bedroom-comfort-1920w.webp";
import heroWorkspace1200 from "../../assets/images/hero/hero-workspace-office-1200w.webp";
import heroDecor600 from "../../assets/images/hero/hero-decor-dining-room-600w.webp";
import heroDecor1200 from "../../assets/images/hero/hero-decor-dining-room-1200w.webp";
import { formatNPR } from "../../utils/formatCurrency";
import { ArrowUpRight, Star } from "lucide-react";
import { Link } from "react-router-dom";

const slides = [
  {
    id: 1,
    tag: "New Arrival",
    heading: "Furniture",
    highlight: "That Fits You",
    desc: "Discover our handpicked collection of timeless sofas and accent chairs — thoughtfully designed to bring warmth, character, and lasting comfort into every corner of your home.",
    price: 7499,
    cta: "Explore Now",
    img: heroFurniture1200,
  },
  {
    id: 2,
    tag: "Bestseller",
    heading: "Sleep in",
    highlight: "Pure Comfort",
    desc: "Our premium king-size beds and orthopedic mattresses are engineered with adaptive support layers — so every night feels like your best one yet.",
    price: 12999,
    cta: "Shop Beds",
    img: heroBedroom1200,
  },
  {
    id: 3,
    tag: "Limited Edition",
    heading: "Work From",
    highlight: "Anywhere",
    desc: "From height-adjustable desks to cable-managed bookshelves, our workspace collection is built for deep focus, long hours, and a setup that actually inspires you.",
    price: 9299,
    cta: "View Office",
    img: heroWorkspace1200,
  },
];

const mainSlideSrc = heroFurniture1200;
const mainSlideSrcSet = `${heroFurniture600} 600w, ${heroFurniture1200} 1200w, ${heroFurniture1920} 1920w`;
const sideSlideSrc = heroBedroom600;
const sideSlideSrcSet = `${heroBedroom600} 600w, ${heroBedroom1200} 1200w, ${heroBedroom1920} 1920w`;
const decorSlideSrc = heroDecor600;
const decorSlideSrcSet = `${heroDecor600} 600w, ${heroDecor1200} 1200w`;

export default function Hero() {
  return (
    <div className="font-dm-sans bg-white">
      {/* ── BENTO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] lg:grid-rows-[286px_286px] gap-2 sm:gap-3 px-2 md:px-6 lg:px-8 py-2 md:py-4 bg-white">
        {/* LEFT STATIC HERO — LCP image: eager load, high fetch priority */}
        <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2 h-92.5 sm:h-112.5 lg:h-auto rounded-sm md:rounded-2xl overflow-hidden relative shadow-[0_4px_28px_rgba(0,0,0,0.10)] group">
          <div className="min-w-full h-full rounded-sm md:rounded-2xl overflow-hidden relative after:content-[''] after:absolute after:inset-0 after:bg-linear-to-t after:from-black/70 after:from-15% after:via-black/35 after:via-70% after:to-transparent after:pointer-events-none">
            <img
              src={mainSlideSrc}
              srcSet={mainSlideSrcSet}
              sizes="(max-width: 1024px) 100vw, 66vw"
              alt={slides[0].heading}
              width={1920}
              height={1279}
              fetchPriority="high"
              loading="eager"
              decoding="sync"
              className="w-full h-full object-cover block"
            />
          </div>

          {/* Main Card Content Overlay */}
          <div className="absolute inset-0 p-6 sm:p-8 md:p-[42px_48px] pointer-events-none flex flex-col justify-end">
            <h1 className="text-[40px] sm:text-[48px] md:text-[64px] font-semibold text-white tracking-wide leading-[1.05] mb-2 sm:mb-3 drop-shadow-md max-w-200">
              {slides[0].heading} <br />
              <em className="text-brand font-semibold not-italic">
                {slides[0].highlight}
              </em>
            </h1>
            <div className="text-[14px] sm:text-[15px] md:text-[15px] font-normal text-white/90 leading-normal sm:leading-[1.6] mb-5 sm:mb-8 max-w-115 drop-shadow-sm">
              {slides[0].desc}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <Link
                to={shopCategoryUrl("living-room")}
                className="pointer-events-auto"
              >
                <button className="flex items-center justify-center gap-2 bg-brand text-white hover:bg-brand-hover shadow-sm rounded-lg px-8 sm:px-8 py-2.75 sm:py-3 font-sans text-[14px] sm:text-[16px] font-semibold cursor-pointer transition-colors duration-250">
                  {slides[0].cta}
                </button>
              </Link>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                  <div className="flex items-center gap-0.5 text-brand">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={10}
                        className="fill-brand sm:w-3 sm:h-3"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] sm:text-[11px] md:text-[13px] font-medium text-white/80 ml-0.5">
                    4.9/5 (2k+ Reviews)
                  </span>
                </div>
                <div className="flex items-baseline gap-1 sm:gap-1.5">
                  <span className="text-[10px] sm:text-[11px] font-medium text-white/70 tracking-[0.06em] uppercase">
                    Starting from
                  </span>
                  <span className="text-[20px] sm:text-[24px] font-bold text-white tracking-[-0.02em] drop-shadow-sm">
                    {formatNPR(slides[0].price)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT TOP: Static Banner — below-fold on mobile, load lazily */}
        <div className="hidden md:block lg:col-start-2 lg:row-start-1 h-62.5 sm:h-71.5 rounded-sm md:rounded-2xl overflow-hidden relative group shadow-sm bg-[#F9F8F6]">
          <div className="absolute inset-0 after:content-[''] after:absolute after:inset-0 after:bg-linear-to-t after:from-black/70 after:from-15% after:via-black/35 after:via-70% after:to-transparent">
            <img
              src={sideSlideSrc}
              srcSet={sideSlideSrcSet}
              sizes="(max-width: 768px) 100vw, 33vw"
              alt={slides[1].heading}
              width={1920}
              height={1080}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-800 group-hover:scale-105"
            />
          </div>
          {/* Content */}
          <div className="absolute inset-0 p-5 sm:p-[28px_32px] flex flex-col justify-between pointer-events-none">
            <div className="flex justify-between items-start w-full">
              <span className="bg-white/95 backdrop-blur-sm text-[#1A1714] text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-1 sm:py-1.25 rounded-md tracking-wide uppercase shadow-sm">
                {slides[1].tag}
              </span>
            </div>
            <div>
              <div className="text-[20px] sm:text-[24px] font-bold text-white tracking-em] leading-[1.15] mb-1 sm:mb-1.5 drop-shadow-sm">
                {slides[1].heading} {slides[1].highlight}
              </div>
              <div className="text-[12.5px] sm:text-[13.5px] font-normal text-white/80 leading-[1.4] max-w-[320px] line-clamp-2">
                {slides[1].desc}
              </div>
              <div className="mt-3 sm:mt-4.5">
                <Link
                  to={shopCategoryUrl("bedroom")}
                  className="pointer-events-auto"
                >
                  <button className="flex items-center justify-center gap-1.5 bg-white text-[#1A1714] hover:bg-brand hover:text-white rounded-lg px-3.5 sm:px-4 py-1.75 sm:py-2.25 font-sans text-[12px] sm:text-[13px] font-bold cursor-pointer transition-colors duration-200 shadow-sm">
                    {slides[1].cta} <ArrowUpRight size={14} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT BOTTOM: Static Banner */}
        <div className="hidden md:block lg:col-start-2 lg:row-start-2 h-62.5 sm:h-71.5 rounded-sm md:rounded-2xl overflow-hidden relative group shadow-sm bg-[#F9F8F6]">
          <div className="absolute inset-0 after:content-[''] after:absolute after:inset-0 after:bg-linear-to-t after:from-black/70 after:from-15% after:via-black/35 after:via-70% after:to-transparent">
            <img
              src={decorSlideSrc}
              srcSet={decorSlideSrcSet}
              sizes="(max-width: 768px) 100vw, 33vw"
              alt="Premium Decor"
              width={1200}
              height={800}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-800 group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-0 p-5 sm:p-[28px_32px] flex flex-col justify-end">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[20px] sm:text-[24px] font-bold text-white tracking-[-0.02em] leading-[1.15] mb-1 sm:mb-1.5 drop-shadow-sm">
                  Calmora Bed Frame
                </div>
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-[12px] sm:text-[13px] font-normal text-white/60 line-through">
                    {formatNPR(24999)}
                  </span>
                  <span className="text-[16px] sm:text-[18px] font-bold text-brand drop-shadow-sm">
                    {formatNPR(19999)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-2 sm:mt-3">
              <div className="text-[12.5px] sm:text-[13.5px] font-normal text-white/80 leading-[1.4] max-w-[320px] line-clamp-2">
                Handcrafted solid sheesham wood frame with a plush upholstered
                headboard
              </div>
              <div className="mt-3 sm:mt-4.5">
                <Link
                  to={shopCategoryUrl("bedroom")}
                  className="pointer-events-auto"
                >
                  <button className="flex items-center justify-center gap-1.5 bg-white text-[#1A1714] hover:bg-brand hover:text-white rounded-lg px-3.5 sm:px-4 py-1.75 sm:py-2.25 font-sans text-[12px] sm:text-[13px] font-bold cursor-pointer transition-colors duration-200 shadow-sm">
                    Shop Sale <ArrowUpRight size={14} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
