import { FiArrowUpRight } from "react-icons/fi";
import { Link } from "react-router-dom";

const slides = [
  {
    id: 1,
    tag: "New Arrival",
    heading: "Furniture",
    highlight: "That Fits You",
    desc: "Discover our handpicked collection of timeless sofas and accent chairs — thoughtfully designed to bring warmth, character, and lasting comfort into every corner of your home.",
    price: "₹7,499",
    cta: "Explore Now",
    img: "https://plus.unsplash.com/premium_photo-1734549547878-9de3d46d8fc2?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 2,
    tag: "Bestseller",
    heading: "Sleep in",
    highlight: "Pure Comfort",
    desc: "Our premium king-size beds and orthopedic mattresses are engineered with adaptive support layers — so every night feels like your best one yet.",
    price: "₹12,999",
    cta: "Shop Beds",
    img: "https://plus.unsplash.com/premium_photo-1661962771640-426ce94f16c6?q=80&w=3131&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 3,
    tag: "Limited Edition",
    heading: "Work From",
    highlight: "Anywhere",
    desc: "From height-adjustable desks to cable-managed bookshelves, our workspace collection is built for deep focus, long hours, and a setup that actually inspires you.",
    price: "₹9,299",
    cta: "View Office",
    img: "https://images.unsplash.com/photo-1618220048045-10a6dbdf83e0?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

export default function Hero() {
  return (
    <div className="font-dm-sans bg-white">
      {/* ── BENTO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] lg:grid-rows-[286px_286px] gap-2 sm:gap-3 px-2 md:px-6 lg:px-9 py-2 md:py-4 bg-white">
        {/* LEFT STATIC HERO */}
        <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2 h-[370px] sm:h-[450px] lg:h-auto rounded-sm md:rounded-2xl overflow-hidden relative shadow-[0_4px_28px_rgba(0,0,0,0.10)] group">
          <div className="min-w-full h-full rounded-sm md:rounded-2xl overflow-hidden relative after:content-[''] after:absolute after:inset-0 after:bg-linear-to-t after:from-black/70 after:from-15% after:via-black/35 after:via-70% after:to-transparent after:pointer-events-none">
            <img
              src={slides[0].img}
              alt={slides[0].heading}
              className="w-full h-full object-cover block"
            />
          </div>

          {/* Main Card Content Overlay */}
          <div className="absolute inset-0 p-6 sm:p-8 md:p-[42px_48px] pointer-events-none flex flex-col justify-end">
            <div className="text-[40px] sm:text-[48px] md:text-[64px] font-semibold text-white tracking-[-0.02em] leading-[1.05] mb-2 sm:mb-3 drop-shadow-md max-w-[800px]">
              {slides[0].heading} <br />
              <em className="text-[#F27318] font-semibold not-italic">
                {slides[0].highlight}
              </em>
            </div>
            <div className="text-[14px] sm:text-[15px] md:text-[16.5px] font-normal text-white/90 leading-normal sm:leading-[1.6] mb-5 sm:mb-8 max-w-[460px] drop-shadow-sm">
              {slides[0].desc}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <Link to="/shop/living-room" className="pointer-events-auto">
                <button className="flex items-center justify-center gap-2 bg-[#F27318] text-white hover:bg-[#D9620E] shadow-sm rounded-lg px-8 sm:px-[42px] py-[11px] sm:py-[13px] font-sans text-[14px] sm:text-[16px] font-semibold cursor-pointer transition-colors duration-250">
                  {slides[0].cta}
                </button>
              </Link>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                  <div className="flex text-[#F27318]">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="text-[10px] sm:text-[12px]">
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-medium text-white/80 ml-0.5">
                    4.9/5 (2k+ Reviews)
                  </span>
                </div>
                <div className="flex items-baseline gap-1 sm:gap-1.5">
                  <span className="text-[10px] sm:text-[11px] font-medium text-white/70 tracking-[0.06em] uppercase">
                    Starting from
                  </span>
                  <span className="text-[20px] sm:text-[24px] font-bold text-white tracking-[-0.02em] drop-shadow-sm">
                    {slides[0].price}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT TOP: Static Banner */}
        <div className="hidden md:block lg:col-start-2 lg:row-start-1 h-[250px] sm:h-[286px] rounded-sm md:rounded-2xl overflow-hidden relative group shadow-sm bg-[#F9F8F6]">
          <div className="absolute inset-0 after:content-[''] after:absolute after:inset-0 after:bg-linear-to-t after:from-black/70 after:from-15% after:via-black/35 after:via-70% after:to-transparent">
            <img
              src={slides[1].img}
              alt={slides[1].heading}
              className="w-full h-full object-cover transition-transform duration-800 group-hover:scale-105"
            />
          </div>
          {/* Content */}
          <div className="absolute inset-0 p-5 sm:p-[28px_32px] flex flex-col justify-between pointer-events-none">
            <div className="flex justify-between items-start w-full">
              <span className="bg-white/95 backdrop-blur-sm text-[#1A1714] text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-1 sm:py-[5px] rounded-md tracking-wide uppercase shadow-sm">
                {slides[1].tag}
              </span>
            </div>
            <div>
              <div className="text-[20px] sm:text-[24px] font-bold text-white tracking-[-0.02em] leading-[1.15] mb-1 sm:mb-1.5 drop-shadow-sm">
                {slides[1].heading} {slides[1].highlight}
              </div>
              <div className="text-[12.5px] sm:text-[13.5px] font-normal text-white/80 leading-[1.4] max-w-[320px] line-clamp-2">
                {slides[1].desc}
              </div>
              <div className="mt-3 sm:mt-[18px]">
                <Link to="/shop/bedroom" className="pointer-events-auto">
                  <button className="flex items-center justify-center gap-1.5 bg-white text-[#1A1714] hover:bg-[#F27318] hover:text-white rounded-lg px-4 sm:px-5 py-[7px] sm:py-[9px] font-sans text-[12px] sm:text-[13px] font-bold cursor-pointer transition-colors duration-200 shadow-sm">
                    {slides[1].cta} <FiArrowUpRight size={14} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT BOTTOM: Static Banner */}
        <div className="hidden md:block lg:col-start-2 lg:row-start-2 h-[250px] sm:h-[286px] rounded-sm md:rounded-2xl overflow-hidden relative group shadow-sm bg-[#F9F8F6]">
          <div className="absolute inset-0 after:content-[''] after:absolute after:inset-0 after:bg-linear-to-t after:from-black/70 after:from-15% after:via-black/35 after:via-70% after:to-transparent">
            <img
              src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=2070&auto=format&fit=crop"
              alt="Premium Decor"
              className="w-full h-full object-cover transition-transform duration-800 group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-0 p-5 sm:p-[28px_32px] flex flex-col justify-end">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[18px] sm:text-[22px] font-bold text-white tracking-[-0.02em] leading-[1.15] mb-1 drop-shadow-sm">
                  Calmora Bed Frame
                </div>
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-[12px] sm:text-[13px] font-normal text-white/60 line-through">
                    ₹24,999
                  </span>
                  <span className="text-[16px] sm:text-[18px] font-bold text-[#F27318] drop-shadow-sm">
                    ₹19,999
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-2 sm:mt-3">
              <div className="text-[12px] sm:text-[12.5px] font-normal text-white/80 leading-[1.4] max-w-60 line-clamp-2">
                Handcrafted solid sheesham wood frame with a plush upholstered
                headboard
              </div>
              <div className="mt-3 sm:mt-4">
                <Link to="/shop/bedroom" className="pointer-events-auto">
                  <button className="bg-white text-[#1A1714] text-[12px] sm:text-[12.5px] font-bold px-3.5 sm:px-[18px] py-1.5 sm:py-2 rounded-lg hover:bg-[#F27318] hover:text-white transition-colors duration-200 shadow-sm">
                    Shop Sale
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
