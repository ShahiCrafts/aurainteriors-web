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
import validateMediaUrl from "../../utils/safeUrl";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import useSiteSettingsStore from "../../store/siteSettingsStore";

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

// Batch 3b: hero copy/images now come from site settings
// (homepage.heroSlides / homepage.promoBanner). The settings defaults
// ARE the `slides` data above (extracted verbatim in Batch 3a), so
// with defaults this component renders exactly what it always has —
// including the responsive srcSets, which are rebuilt from the same
// bundled variants whenever a settings imageUrl names one of the
// bundled hero files. Tag + price are not part of the settings shape
// and stay local, paired by slide position.

// Bundled hero variants by file stem, so a settings imageUrl like
// "src/assets/images/hero/hero-bedroom-comfort-1200w.webp" resolves to
// the full variant set of that photo.
const HERO_VARIANTS = {
  "hero-furniture-living-room": {
    600: heroFurniture600,
    1200: heroFurniture1200,
    1920: heroFurniture1920,
  },
  "hero-bedroom-comfort": {
    600: heroBedroom600,
    1200: heroBedroom1200,
    1920: heroBedroom1920,
  },
  "hero-workspace-office": { 1200: heroWorkspace1200 },
  "hero-decor-dining-room": { 600: heroDecor600, 1200: heroDecor1200 },
};

// Resolve a settings imageUrl to { src, srcSet } for a slot whose
// preferred width is `preferred` (main 1200, side/promo 600 — the
// widths the hardcoded component used). Remote/absolute URLs are used
// directly with no srcSet; unknown values fall back to the slot's
// current bundled image.
function resolveHeroImage(imageUrl, fallback) {
  if (!imageUrl) return fallback;
  if (/^(https?:)?\/\//.test(imageUrl) || imageUrl.startsWith("/")) {
    // Settings are server data: remote/absolute URLs go through the
    // FE-03 media validator (own origins / Cloudinary / S3 / site
    // paths); anything it rejects falls back to the bundled image.
    const validated = validateMediaUrl(imageUrl);
    return validated ? { src: validated, srcSet: undefined } : fallback;
  }
  const file = imageUrl.split("/").pop() || "";
  const stem = file.replace(/-\d+w\.webp$/, "").replace(/\.webp$/, "");
  const variants = HERO_VARIANTS[stem];
  if (!variants) return fallback;
  const widths = Object.keys(variants)
    .map(Number)
    .sort((a, b) => a - b);
  const srcSet = widths.map((w) => `${variants[w]} ${w}w`).join(", ");
  const src =
    variants[fallback.preferred] ||
    variants[widths[widths.length - 1]] ||
    fallback.src;
  return { src, srcSet };
}

// Settings headlines are a single string ("Furniture That Fits You");
// the layout renders a heading + highlighted tail. When the headline
// still equals a local slide's heading + highlight, split exactly
// there; otherwise highlight the last two words (last word for a
// two-word headline).
function splitHeadline(headline, local) {
  const text = String(headline || "").trim();
  if (local && text === `${local.heading} ${local.highlight}`) {
    return { heading: local.heading, highlight: local.highlight };
  }
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { heading: text, highlight: "" };
  if (words.length === 2)
    return { heading: words[0], highlight: words[1] };
  return {
    heading: words.slice(0, -2).join(" "),
    highlight: words.slice(-2).join(" "),
  };
}

// Merge one settings slide over the local slide at the same position.
function mergeSlide(local, remote) {
  if (!remote) return { ...local, link: null };
  const { heading, highlight } = splitHeadline(remote.headline, local);
  return {
    ...local,
    heading,
    highlight,
    desc: remote.subtext || local.desc,
    cta: remote.buttonText || local.cta,
    link: remote.buttonLink || null,
  };
}

const mainSlideFallback = {
  preferred: 1200,
  src: heroFurniture1200,
  srcSet: `${heroFurniture600} 600w, ${heroFurniture1200} 1200w, ${heroFurniture1920} 1920w`,
};
const sideSlideFallback = {
  preferred: 600,
  src: heroBedroom600,
  srcSet: `${heroBedroom600} 600w, ${heroBedroom1200} 1200w, ${heroBedroom1920} 1920w`,
};
const decorSlideFallback = {
  preferred: 600,
  src: heroDecor600,
  srcSet: `${heroDecor600} 600w, ${heroDecor1200} 1200w`,
};
const workspaceSlideFallback = {
  preferred: 1200,
  src: heroWorkspace1200,
  srcSet: undefined,
};

export default function Hero() {
  const homepage = useSiteSettingsStore((s) => s.settings.homepage);
  const enabledSlides = (homepage?.heroSlides || []).filter(
    (s) => s && s.enabled !== false,
  );
  const mainSlide = mergeSlide(slides[0], enabledSlides[0]);
  const sideSlide = mergeSlide(slides[1], enabledSlides[1]);
  const thirdSlide = mergeSlide(slides[2], enabledSlides[2]);
  const mainImg = resolveHeroImage(enabledSlides[0]?.imageUrl, mainSlideFallback);
  const sideImg = resolveHeroImage(enabledSlides[1]?.imageUrl, sideSlideFallback);
  const thirdImg = resolveHeroImage(
    enabledSlides[2]?.imageUrl,
    workspaceSlideFallback,
  );
  const promo = homepage?.promoBanner || {};
  const promoImg = resolveHeroImage(promo.imageUrl, decorSlideFallback);
  const promoVisible = promo.enabled !== false;

  // Mobile/tablet hero (design mockup): a swipeable carousel of all
  // three slides with dot indicators, then the two bento side cards
  // as a "Shop by collection" pair. The desktop bento below is
  // lg-only; below lg this block replaces it.
  const carouselSlides = [
    { ...mainSlide, img: mainImg, fallbackLink: shopCategoryUrl("living-room") },
    { ...sideSlide, img: sideImg, fallbackLink: shopCategoryUrl("bedroom") },
    { ...thirdSlide, img: thirdImg, fallbackLink: shopCategoryUrl("home-office") },
  ];
  const trackRef = useRef(null);
  const interactedAtRef = useRef(0);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - interactedAtRef.current < 9000) return;
      const track = trackRef.current;
      if (!track || track.clientWidth === 0) return;
      const next =
        (Math.round(track.scrollLeft / track.clientWidth) + 1) %
        carouselSlides.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    }, 5500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTrackScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActiveSlide(Math.round(track.scrollLeft / track.clientWidth));
  };

  const goToSlide = (index) => {
    interactedAtRef.current = Date.now();
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="font-dm-sans bg-white">
      {/* ── BENTO (desktop, lg+) ── */}
      <div className="hidden lg:grid lg:grid-cols-[1.6fr_1fr] lg:grid-rows-[286px_286px] gap-2 sm:gap-3 px-2 md:px-6 lg:px-8 py-2 md:py-4 bg-white">
        {/* LEFT STATIC HERO — LCP image: eager load, high fetch priority */}
        <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2 h-full rounded-sm md:rounded-2xl overflow-hidden relative shadow-[0_4px_28px_rgba(0,0,0,0.10)] group">
          <div className="min-w-full h-full rounded-sm md:rounded-2xl overflow-hidden relative after:content-[''] after:absolute after:inset-0 after:bg-linear-to-t after:from-black/70 after:from-15% after:via-black/35 after:via-70% after:to-transparent after:pointer-events-none">
            <img
              src={mainImg.src}
              srcSet={mainImg.srcSet}
              sizes="(max-width: 1024px) 100vw, 66vw"
              alt={mainSlide.heading}
              width={1920}
              height={1279}
              fetchPriority="high"
              loading="eager"
              decoding="sync"
              className="w-full h-full object-cover block"
            />
          </div>

          {/* Main Card Content Overlay */}
          <div className="absolute inset-0 p-5 sm:p-8 md:p-[42px_48px] pointer-events-none flex flex-col justify-end">
            <h1 className="text-[36px] sm:text-[48px] md:text-[64px] font-semibold text-white tracking-wide leading-[1.05] mb-2 sm:mb-3 drop-shadow-md max-w-200">
              {mainSlide.heading} <br />
              <em className="text-brand font-semibold not-italic">
                {mainSlide.highlight}
              </em>
            </h1>
            <div className="text-[14px] sm:text-[15px] md:text-[15px] font-normal text-white/90 leading-normal sm:leading-[1.6] mb-5 sm:mb-8 max-w-115 drop-shadow-sm line-clamp-4 sm:line-clamp-none">
              {mainSlide.desc}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <Link
                to={mainSlide.link || shopCategoryUrl("living-room")}
                className="pointer-events-auto"
              >
                <button className="flex items-center justify-center gap-2 bg-brand text-white hover:bg-brand-hover shadow-sm rounded-lg px-8 sm:px-8 py-2.75 sm:py-3 font-sans text-[14px] sm:text-[16px] font-semibold cursor-pointer transition-colors duration-250">
                  {mainSlide.cta}
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
                    {formatNPR(mainSlide.price)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT TOP: Static Banner (desktop bento) */}
        <div className="lg:col-start-2 lg:row-start-1 h-full rounded-sm md:rounded-2xl overflow-hidden relative group shadow-sm bg-[#F9F8F6]">
          <div className="absolute inset-0 after:content-[''] after:absolute after:inset-0 after:bg-linear-to-t after:from-black/70 after:from-15% after:via-black/35 after:via-70% after:to-transparent">
            <img
              src={sideImg.src}
              srcSet={sideImg.srcSet}
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
              alt={sideSlide.heading}
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
                {sideSlide.tag}
              </span>
            </div>
            <div>
              <div className="text-[20px] sm:text-[24px] font-bold text-white tracking-[-0.02em] leading-[1.15] mb-1 sm:mb-1.5 drop-shadow-sm">
                {sideSlide.heading} {sideSlide.highlight}
              </div>
              <div className="text-[12.5px] sm:text-[13.5px] font-normal text-white/80 leading-[1.4] max-w-[320px] line-clamp-2">
                {sideSlide.desc}
              </div>
              <div className="mt-3 sm:mt-4.5">
                <Link
                  to={sideSlide.link || shopCategoryUrl("bedroom")}
                  className="pointer-events-auto"
                >
                  <button className="flex items-center justify-center gap-1.5 bg-white text-[#1A1714] hover:bg-brand hover:text-white rounded-lg px-3.5 sm:px-4 py-1.75 sm:py-2.25 font-sans text-[12px] sm:text-[13px] font-bold cursor-pointer transition-colors duration-200 shadow-sm">
                    {sideSlide.cta} <ArrowUpRight size={14} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT BOTTOM: Static Banner */}
        {promoVisible && (
          <div className="lg:col-start-2 lg:row-start-2 h-full rounded-sm md:rounded-2xl overflow-hidden relative group shadow-sm bg-[#F9F8F6]">
            <div className="absolute inset-0 after:content-[''] after:absolute after:inset-0 after:bg-linear-to-t after:from-black/70 after:from-15% after:via-black/35 after:via-70% after:to-transparent">
              <img
                src={promoImg.src}
                srcSet={promoImg.srcSet}
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
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
                    {promo.headline || "Calmora Bed Frame"}
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
                  {promo.subtext ||
                    "Handcrafted solid sheesham wood frame with a plush upholstered headboard"}
                </div>
                <div className="mt-3 sm:mt-4.5">
                  <Link
                    to={promo.buttonLink || shopCategoryUrl("bedroom")}
                    className="pointer-events-auto"
                  >
                    <button className="flex items-center justify-center gap-1.5 bg-white text-[#1A1714] hover:bg-brand hover:text-white rounded-lg px-3.5 sm:px-4 py-1.75 sm:py-2.25 font-sans text-[12px] sm:text-[13px] font-bold cursor-pointer transition-colors duration-200 shadow-sm">
                      {promo.buttonText || "Shop Sale"}{" "}
                      <ArrowUpRight size={14} />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE / TABLET (below lg): carousel + collection pair ── */}
      <div className="lg:hidden px-4 pt-3 pb-2">
        <div className="relative">
          <div
            ref={trackRef}
            onScroll={handleTrackScroll}
            onPointerDown={() => {
              interactedAtRef.current = Date.now();
            }}
            className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-3xl"
          >
            {carouselSlides.map((slide, i) => (
              <div
                key={slide.id}
                className="relative shrink-0 w-full snap-center h-[430px] sm:h-[470px] overflow-hidden bg-[#F9F8F6]"
              >
                <img
                  src={slide.img.src}
                  srcSet={slide.img.srcSet}
                  sizes="100vw"
                  alt={slide.heading}
                  width={1200}
                  height={800}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 from-15% via-black/35 via-70% to-transparent pointer-events-none" />
                <div className="absolute inset-0 p-6 pb-11 flex flex-col justify-end">
                  <h2 className="text-[34px] leading-[1.08] font-semibold text-white tracking-wide drop-shadow-md">
                    {slide.heading} <br />
                    <span className="text-brand">{slide.highlight}</span>
                  </h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/85 line-clamp-2 max-w-75 drop-shadow-sm">
                    {slide.desc}
                  </p>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <Link
                      to={slide.link || slide.fallbackLink}
                      className="shrink-0"
                    >
                      <span className="inline-flex items-center gap-2 bg-brand text-white text-[14px] font-semibold px-5 py-3 rounded-full shadow-sm">
                        {slide.cta} <ArrowRight size={16} />
                      </span>
                    </Link>
                    <div className="shrink-0">
                      <div className="flex items-center justify-end gap-0.5 text-brand">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} className="fill-brand" />
                        ))}
                        <span className="text-[11px] font-medium text-white/90 ml-1">
                          4.9/5 · 2k+ reviews
                        </span>
                      </div>
                      <div className="mt-1 text-right text-[11px] font-medium tracking-[0.08em] text-white/70 uppercase">
                        From{" "}
                        <span className="text-[17px] font-bold text-white tracking-normal normal-case">
                          {formatNPR(slide.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {carouselSlides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goToSlide(i)}
                className={
                  i === activeSlide
                    ? "w-2.5 h-2.5 rounded-full bg-brand ring-2 ring-white/70 cursor-pointer border-none p-0"
                    : "w-2 h-2 rounded-full bg-white/50 cursor-pointer border-none p-0"
                }
              />
            ))}
          </div>
        </div>

        {/* Shop by collection — the two bento side cards as a pair */}
        <div className="mt-7 flex items-center justify-between">
          <h2 className="text-[22px] font-bold text-[#1A1714]">
            Shop by collection
          </h2>
          <Link
            to="/shop"
            className="flex items-center gap-1 text-brand text-[14px] font-semibold no-underline"
          >
            View all <ArrowRight size={15} />
          </Link>
        </div>
        <div
          className={`mt-3.5 grid gap-3 ${promoVisible ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <div className="relative h-52 sm:h-64 rounded-2xl overflow-hidden group shadow-sm bg-[#F9F8F6]">
            <img
              src={sideImg.src}
              srcSet={sideImg.srcSet}
              sizes="50vw"
              alt={sideSlide.heading}
              width={600}
              height={400}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 from-15% via-black/35 via-70% to-transparent pointer-events-none" />
            <div className="absolute inset-0 p-3.5 flex flex-col justify-end">
              <div className="text-[15px] sm:text-lg font-bold text-white leading-snug drop-shadow-sm">
                {sideSlide.heading} {sideSlide.highlight}
              </div>
              <div className="mt-2.5">
                <Link to={sideSlide.link || shopCategoryUrl("bedroom")}>
                  <span className="inline-flex items-center gap-1 bg-white text-[#1A1714] text-[12px] font-bold px-3 py-1.75 rounded-full shadow-sm">
                    {sideSlide.cta} <ArrowUpRight size={13} />
                  </span>
                </Link>
              </div>
            </div>
          </div>
          {promoVisible && (
            <div className="relative h-52 sm:h-64 rounded-2xl overflow-hidden group shadow-sm bg-[#F9F8F6]">
              <img
                src={promoImg.src}
                srcSet={promoImg.srcSet}
                sizes="50vw"
                alt="Premium Decor"
                width={600}
                height={400}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 from-15% via-black/35 via-70% to-transparent pointer-events-none" />
              <div className="absolute inset-0 p-3.5 flex flex-col justify-end">
                <div className="text-[15px] sm:text-lg font-bold text-white leading-snug drop-shadow-sm">
                  {promo.headline || "Calmora Bed Frame"}
                </div>
                <div className="text-[15px] sm:text-base font-bold text-brand drop-shadow-sm">
                  {formatNPR(19999)}
                </div>
                <div className="mt-2">
                  <Link to={promo.buttonLink || shopCategoryUrl("bedroom")}>
                    <span className="inline-flex items-center gap-1 bg-white text-[#1A1714] text-[12px] font-bold px-3 py-1.75 rounded-full shadow-sm">
                      {promo.buttonText || "Shop Sale"}{" "}
                      <ArrowUpRight size={13} />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
