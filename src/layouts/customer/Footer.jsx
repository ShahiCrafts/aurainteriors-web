import { shopCategoryUrl } from "../../utils/shopFilters";
import React from "react";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import BrandMarquee from "../../components/sections/BrandMarquee";
import promoNewsletterInspiration from "../../assets/images/promo/promo-newsletter-inspiration.webp";

const footerLinks = [
  {
    title: "Shop",
    links: [
      { name: "Living Room", href: shopCategoryUrl("living-room") }, // (?)
      { name: "Bedroom", href: shopCategoryUrl("bedroom") }, // (?)
      { name: "Dining", href: shopCategoryUrl("dining") },
      { name: "Home Office", href: shopCategoryUrl("home-office") }, // (?)
      { name: "Outdoor", href: shopCategoryUrl("outdoor") }, // (?)
      { name: "Lighting", href: shopCategoryUrl("lighting") }, // (?)
      { name: "Decor", href: shopCategoryUrl("decor") }, // (?)
      { name: "Kids Room", href: shopCategoryUrl("kids-room") }, // (?)
      { name: "All Products", href: "/shop" }, // (?)
    ],
  },
  {
    title: "Our Company",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Our Story", href: "/story" },
      { name: "Blogs & Inspiration", href: "/blog" },
      { name: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Customer Service",
    links: [
      { name: "Track Order", href: "/track-order" },
      { name: "Shipping & Delivery", href: "/shipping" },
      { name: "Returns & Refunds", href: "/returns" },
      { name: "FAQs", href: "/faq" },
      { name: "Warranty", href: "/warranty" },
      { name: "Care & Maintenance", href: "/care" },
      { name: "Size Guide", href: "/size-guide" },
    ],
  },
];

const legalLinks = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms & Conditions", href: "/terms" },
  { name: "Sitemap", href: "/sitemap" },
];

const FacebookIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="#1A1714"
    aria-hidden="true"
  >
    <path d="M14 8V6.5c0-.7.2-1.2 1.3-1.2H17V2.2C16.7 2.2 15.7 2 14.5 2 12 2 10.3 3.5 10.3 6.3V8H7.5v3.4h2.8V22H14V11.4h2.7L17.2 8H14z" />
  </svg>
);
const InstagramIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#1A1714"
    strokeWidth="2.2"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="1" fill="#1A1714" stroke="none" />
  </svg>
);
const YoutubeIcon = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="#1A1714"
    aria-hidden="true"
  >
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z" />
  </svg>
);
const PinterestIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="#1A1714"
    aria-hidden="true"
  >
    <path d="M12.2 2C6.6 2 4 5.8 4 9c0 1.9.7 3.6 2.3 4.2.3.1.5 0 .6-.3l.2-.9c.1-.3 0-.4-.2-.7-.5-.6-.8-1.300-.8-2.400 0-3 2.300-5.700 5.900-5.700 3.200 0 5 2 5 4.600 0 3.400-1.500 6.300-3.800 6.300-1.200 0-2.200-1-1.900-2.300.4-1.500 1-3.100 1-4.200 0-1-.5-1.800-1.600-1.800-1.300 0-2.300 1.300-2.300 3.100 0 1.100.4 1.900.4 1.900l-1.500 6.400c-.4 1.800-.1 4.200 0 4.400 0 .1.200.2.300.1.100-.2 1.800-2.300 2.400-4.400l.9-3.500c.5.900 1.800 1.700 3.200 1.700 4.200 0 7-3.800 7-8.800C21.800 5.300 18.500 2 12.200 2z" />
  </svg>
);

const socials = [
  { label: "Facebook", Icon: FacebookIcon },
  { label: "Instagram", Icon: InstagramIcon },
  { label: "YouTube", Icon: YoutubeIcon },
  { label: "Pinterest", Icon: PinterestIcon },
];

const GooglePlayBadge = () => (
  <a
    href="#"
    aria-label="Get it on Google Play"
    className="flex items-center bg-black text-white rounded-md h-12 px-2.5 gap-2 flex-1 min-w-0 whitespace-nowrap border border-white/20"
  >
    <svg
      width="22"
      height="24"
      viewBox="0 0 26 28"
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        d="M1 1.2v25.6c0 .5.5.8.9.5L14 14 1.9.7C1.500.4 1 .7 1 1.200z"
        fill="#00C3FF"
      />
      <path
        d="M14 14 18.300 9.700 3.100.700C2.600.4 2.200.5 1.900.7L14 14z"
        fill="#00F076"
      />
      <path
        d="M14 14 1.900 27.300c.3.2.7.200 1.200 0l15.200-9L14 14z"
        fill="#FF3A44"
      />
      <path
        d="M18.300 9.700 14 14l4.300 4.300 5-2.900c1-.6 1-2 0-2.600l-5-2.900z"
        fill="#FFD500"
      />
    </svg>
    <span className="flex flex-col leading-none whitespace-nowrap">
      <span className="text-[9px] tracking-wide uppercase">Get it on</span>
      <span className="text-[17px] font-medium mt-0.5">Google Play</span>
    </span>
  </a>
);

const AppStoreBadge = () => (
  <a
    href="#"
    aria-label="Download on the App Store"
    className="flex items-center bg-black text-white rounded-md h-12 px-2.5 gap-2 flex-1 min-w-0 whitespace-nowrap border border-white/20"
  >
    <svg
      width="22"
      height="24"
      viewBox="0 0 24 24"
      fill="#fff"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.960-1.040-2.040.027-3.910 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.090 1.013 1.454 2.208 3.090 3.792 3.039 1.520-.065 2.090-.987 3.935-.987 1.831 0 2.350.987 3.960.948 1.637-.026 2.676-1.480 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.220-4.857-.026-3.040 2.480-4.494 2.597-4.559-1.429-2.090-3.623-2.324-4.390-2.376-2-.156-3.675 1.090-4.610 1.090zM15.530 3.830c.843-1.012 1.400-2.427 1.245-3.830-1.207.052-2.662.805-3.532 1.818-.780.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
    <span className="flex flex-col leading-none whitespace-nowrap">
      <span className="text-[9px]">Download on the</span>
      <span className="text-[17px] font-medium mt-0.5">App Store</span>
    </span>
  </a>
);

function NewsletterBanner() {
  return (
    <section className="px-4 md:px-6 lg:px-8 pt-16 pb-6 bg-white font-dm-sans">
      <div className="relative overflow-hidden rounded-md bg-linear-to-r from-[#f6f6f6] via-[#f6f6f6] to-[#f6f6f6] min-h-[343px] flex items-center">
        {/* photo, right ~52% */}
        <div
          className="hidden md:block absolute inset-y-0 right-0 w-[52%] bg-cover bg-center"
          style={{
            backgroundImage:
              `url(${promoNewsletterInspiration})`,
          }}
          aria-hidden="true"
        />
        {/* fade photo into the beige */}
        <div
          className="hidden md:block absolute inset-y-0 right-[30%] w-[22%] bg-linear-to-r from-[#f6f6f6] to-transparent"
          aria-hidden="true"
        />

        <div className="relative z-10 px-6 sm:px-10 lg:px-[54px] py-10 max-w-[640px]">
          <p className="text-[13px] font-medium tracking-[0.15em] text-brand uppercase mb-3">
            Stay Inspired
          </p>
          <h2 className="text-[34px] sm:text-[38px] leading-[1.15] font-bold text-[#1A1714] tracking-tight">
            Join the <span className="text-brand">Aura Interiors</span> Circle
          </h2>
          <p className="mt-4 text-[17px] leading-[1.6] text-black/60 max-w-[580px]">
            Get exclusive access to new arrivals, styling tips, special offers
            and home inspiration, straight to your inbox.
          </p>

          <div className="mt-6 flex items-center gap-2 w-full max-w-[400px] h-[52px]">
            <input
              type="email"
              placeholder="Your email address"
              aria-label="Your email address"
              className="flex-1 min-w-0 bg-[#ffffff] h-full border border-black/10 rounded-md px-4 text-[16px] text-[#1A1714] placeholder:text-black/40 outline-none focus:border-brand transition-colors [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#ffffff] [&:-webkit-autofill]:[-webkit-text-fill-color:#1A1714]"
            />
            <button
              type="button"
              aria-label="Subscribe"
              className="h-full w-[52px] shrink-0 flex items-center justify-center bg-brand hover:bg-brand-hover text-white rounded-md transition-colors"
            >
              <ArrowRight size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Footer() {
  return (
    <>
      <BrandMarquee />
      <NewsletterBanner />

      <footer className="bg-white font-dm-sans text-[#1A1714]">
        <div className="px-4 md:px-6 lg:px-8">
          {/* MAIN GRID */}
          <div className="pt-12 pb-12 grid grid-cols-2 lg:grid-cols-[max-content_max-content_max-content_max-content_380px] lg:justify-between lg:gap-x-10 gap-x-8 gap-y-10">
            {/* BRAND + CONTACT + SOCIAL */}
            <div className="col-span-2 lg:col-span-1 flex flex-col">
              <Link to="/" className="no-underline inline-block">
                <img
                  src="/logo-aura-interiors.webp"
                  alt="Aura Interiors"
                  width={212}
                  height={84}
                  loading="lazy"
                  decoding="async"
                  className="h-8 md:h-10 w-auto object-contain"
                />
              </Link>
              <p className="mt-5 text-[16px] leading-[1.55] text-black/55 max-w-[270px]">
                Furniture, décor and lighting for modern living spaces.
              </p>

              <ul className="mt-6 flex flex-col gap-3.5">
                <li className="flex items-center gap-3.5">
                  <Phone
                    size={19}
                    className="text-brand shrink-0"
                    fill="#F27318"
                    strokeWidth={1.5}
                  />
                  <span className="text-[16px] text-[#1A1714]">
                    +977 1 44XXXXX
                  </span>
                </li>
                <li className="flex items-center gap-3.5">
                  <Mail
                    size={19}
                    className="text-brand shrink-0"
                    strokeWidth={1.8}
                  />
                  <span className="text-[16px] text-black/65">
                    care@aurainteriors.live
                  </span>
                </li>
                <li className="flex items-center gap-3.5">
                  <MapPin
                    size={19}
                    className="text-brand shrink-0"
                    strokeWidth={1.8}
                  />
                  <span className="text-[16px] text-black/65">
                    Durbarmarg, Kathmandu, Nepal
                  </span>
                </li>
              </ul>

              <div className="mt-6 flex items-center gap-3">
                {socials.map(({ label, Icon }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="w-11 h-11 rounded-full bg-[#f4f1ef] hover:bg-[#ece7e3] flex items-center justify-center transition-colors"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {/* LINK COLUMNS */}
            {footerLinks.map((column) => (
              <div key={column.title} className="flex flex-col">
                <h5 className="text-[18px] font-semibold text-[#1A1714] leading-none">
                  {column.title}
                </h5>
                <ul className="mt-6 flex flex-col gap-3.5">
                  {column.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-[16px] leading-[1.2] text-black/60 hover:text-brand transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* APP + PAYMENTS (with left divider on desktop) */}
            <div className="col-span-2 lg:col-span-1 lg:border-l lg:border-black/10 lg:pl-10 lg:pr-0 flex flex-col">
              <h5 className="text-[18px] font-semibold text-[#1A1714] leading-none">
                Download Our App
              </h5>
              <p className="mt-4 text-[16px] leading-[1.55] text-black/45 max-w-[300px]">
                Shop on the go for a faster, smoother experience.
              </p>
              <div className="mt-5 flex flex-nowrap items-center gap-2.5">
                <GooglePlayBadge />
                <AppStoreBadge />
              </div>

              <div className="mt-8 pt-8 border-t border-black/10">
                <h5 className="text-[18px] font-semibold text-[#1A1714] leading-none">
                  We Accept
                </h5>
                <div className="mt-6 flex items-center gap-5">
                  <img
                    src="https://img.favpng.com/7/14/6/esewa-fonepay-pvt-ltd-logo-portable-network-graphics-image-brand-png-favpng-aLLyxWtspEZQckmv19jDj2TWC.jpg"
                    alt="eSewa"
                    className="h-[34px] w-auto object-contain mix-blend-multiply"
                  />
                  <img
                    src="https://khaltibyime.khalti.com/wp-content/uploads/2025/07/cropped-Logo-for-Blog-1024x522.png"
                    alt="Khalti"
                    className="h-[34px] w-auto object-contain"
                  />
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/330px-Mastercard-logo.svg.png"
                    alt="Mastercard"
                    className="h-[34px] w-auto object-contain"
                  />
                  <span
                    aria-label="Visa"
                    className="text-[26px] font-extrabold italic tracking-tight text-[#1A1F71] leading-none"
                  >
                    VISA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM STRIP */}
          <div className="border-t border-black/10 py-7 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[15px] text-black/55">
              &copy; 2024 Aura Interiors Private Limited. All rights reserved.
            </p>
            <nav className="flex items-center text-[15px] text-black/60">
              {legalLinks.map((link, i) => (
                <React.Fragment key={link.name}>
                  {i > 0 && (
                    <span
                      className="mx-5 h-[15px] w-px bg-black/40"
                      aria-hidden="true"
                    />
                  )}
                  <Link
                    to={link.href}
                    className="hover:text-brand transition-colors"
                  >
                    {link.name}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
