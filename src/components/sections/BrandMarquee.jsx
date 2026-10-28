import React, { useEffect, useRef, useState } from "react";

const BRANDS = [
  { name: "Kantipur", logo: "/brands/kantipur.svg" },
  { name: "Onlinekhabar", logo: "/brands/onlinekhabar.png" },
  { name: "Techpana", logo: "/brands/techpana.png" },
  { name: "Codavatar", logo: "/brands/codavatar.svg" },
  { name: "Setopati", logo: "/brands/setopati.svg" },
];

const SPEED_PX_PER_SECOND = 60;

const MARQUEE_CSS = `
@keyframes brand-marquee-scroll {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-50%, 0, 0); }
}
.brand-marquee-track {
  animation: brand-marquee-scroll var(--marquee-duration, 40s) linear infinite;
}
.brand-marquee-viewport:hover .brand-marquee-track,
.brand-marquee-viewport:focus-within .brand-marquee-track {
  animation-play-state: paused;
}
/* Reduced motion: keep moving, but at half speed (no hard stop). */
@media (prefers-reduced-motion: reduce) {
  .brand-marquee-track {
    animation-duration: calc(var(--marquee-duration, 40s) * 2);
  }
}
`;

export default function BrandMarquee() {
  const viewportRef = useRef(null);
  const setRef = useRef(null);
  const [setsPerHalf, setSetsPerHalf] = useState(2);
  const [durationSeconds, setDurationSeconds] = useState(40);

  useEffect(() => {
    const measure = () => {
      const setWidth = setRef.current?.offsetWidth || 0;
      const viewportWidth = viewportRef.current?.offsetWidth || 0;
      if (!setWidth || !viewportWidth) return;
      const perHalf = Math.max(1, Math.ceil(viewportWidth / setWidth));
      setSetsPerHalf(perHalf);
      setDurationSeconds((perHalf * setWidth) / SPEED_PX_PER_SECOND);
    };
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      if (viewportRef.current) observer.observe(viewportRef.current);
      if (setRef.current) observer.observe(setRef.current);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
    };
  }, []);

  const renderSet = (setIndex) => (
    <div
      key={setIndex}
      ref={setIndex === 0 ? setRef : undefined}
      aria-hidden={setIndex > 0 || undefined}
      className="flex shrink-0 items-center gap-16 md:gap-24 pr-16 md:pr-24"
    >
      {BRANDS.map((brand) =>
        brand.logo ? (
          <img
            key={brand.name}
            src={brand.logo}
            alt={setIndex === 0 ? brand.name : ""}
            draggable={false}
            className="h-6 md:h-7 w-auto shrink-0 object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default select-none"
          />
        ) : (
          <span
            key={brand.name}
            className="shrink-0 text-lg md:text-xl font-playfair font-semibold text-neutral-800 opacity-60 hover:opacity-100 transition-all duration-500 cursor-default select-none whitespace-nowrap"
          >
            {brand.name}
          </span>
        )
      )}
    </div>
  );

  return (
    <section className="py-6 bg-white border-y border-black/[0.03] overflow-hidden">
      <style>{MARQUEE_CSS}</style>
      <div
        ref={viewportRef}
        className="brand-marquee-viewport relative overflow-hidden"
      >
        <div
          className="brand-marquee-track flex w-max shrink-0 items-center will-change-transform"
          style={{ "--marquee-duration": `${durationSeconds}s` }}
        >
          {Array.from({ length: setsPerHalf * 2 }, (_, i) => renderSet(i))}
        </div>

        <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      </div>
    </section>
  );
}