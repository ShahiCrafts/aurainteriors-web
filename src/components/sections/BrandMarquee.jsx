import React from "react";

// FE-06: press logos are SELF-HOSTED under public/brands/ (fetched
// once from the publishers' own CDNs and verified as real images
// < 100 KB). They used to be hot-linked, which disclosed every
// visitor's IP/Referer to the logo hosts and broke whenever a
// publisher moved a file. `logo: null` renders a styled text
// wordmark instead — used for any brand whose logo cannot be
// fetched; never a placeholder from another service.
const BRANDS = [
  { name: "Kantipur", logo: "/brands/kantipur.svg" },
  { name: "Onlinekhabar", logo: "/brands/onlinekhabar.png" },
  { name: "Techpana", logo: "/brands/techpana.png" },
  { name: "Codavatar", logo: "/brands/codavatar.svg" },
  { name: "Setopati", logo: "/brands/setopati.svg" },
];

export default function BrandMarquee() {
  // Duplicate brands for seamless loop
  const brands = [...BRANDS, ...BRANDS, ...BRANDS, ...BRANDS];

  return (
    <section className="py-6 bg-white border-y border-black/[0.03] overflow-hidden">
      <div className="relative flex overflow-hidden">

        <div className="animate-marquee flex items-center gap-16 md:gap-24">
          {brands.map((brand, idx) =>
            brand.logo ? (
              <img
                key={idx}
                src={brand.logo}
                alt={idx < BRANDS.length ? brand.name : ""}
                aria-hidden={idx >= BRANDS.length || undefined}
                className="h-6 md:h-7 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default select-none"
              />
            ) : (
              <span
                key={idx}
                aria-hidden={idx >= BRANDS.length || undefined}
                className="text-lg md:text-xl font-playfair font-semibold text-neutral-800 opacity-60 hover:opacity-100 transition-all duration-500 cursor-default select-none whitespace-nowrap"
              >
                {brand.name}
              </span>
            )
          )}
        </div>




        {/* Edge Gradients for smooth fade */}
        <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      </div>
    </section>
  );
}
