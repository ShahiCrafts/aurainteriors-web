import React from "react";

const BRANDS = [
  { name: "Kantipur", url: "https://ekantipur.com/assets/images/kantipur-logo.svg" },
  { name: "Onlinekhabar", url: "https://www.onlinekhabar.com/wp-content/themes/onlinekhabar-2021/img/logoMain.png" },
  { name: "Techpana", url: "https://techpana.prixacdn.net/static/assets/images/techpana-logo.png" },
  { name: "Codavatar", url: "https://codavatar.com/wp-content/uploads/2023/06/codavatar-logo.svg" },
  { name: "Setopati", url: "https://www.setopati.com/themes/setopati/images/logo.svg?v=1.9" },
];

export default function BrandMarquee() {
  // Duplicate brands for seamless loop
  const brands = [...BRANDS, ...BRANDS, ...BRANDS, ...BRANDS];

  return (
    <section className="py-6 bg-white border-y border-black/[0.03] overflow-hidden">
      <div className="relative flex overflow-hidden">

        <div className="animate-marquee flex items-center gap-16 md:gap-24">
          {brands.map((brand, idx) => (
            <img
              key={idx}
              src={brand.url}
              alt={brand.name}
              className="h-6 md:h-7 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default select-none"
            />
          ))}
        </div>




        {/* Edge Gradients for smooth fade */}
        <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      </div>
    </section>
  );
}
