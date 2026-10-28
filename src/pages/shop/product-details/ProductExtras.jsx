import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Lock,
  Leaf,
  Box,
  Home,
  Plus,
  ChevronDown,
  ArrowRight,
  Headphones,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const iconWrap =
  "flex h-12 w-12 items-center justify-center rounded-full bg-[#FDE8D7] text-[#F27318]";

export function TrustBar() {
  const items = [
    { icon: Truck, title: "Free delivery", sub: "on orders above NPR 5,000" },
    {
      icon: RotateCcw,
      title: "Easy 7 days return",
      sub: "Hassle free returns",
    },
    {
      icon: ShieldCheck,
      title: "2 years warranty",
      sub: "On all wooden furniture",
    },
    { icon: Lock, title: "Secure payment", sub: "100% secure checkout" },
  ];
  return (
    <section className="mb-8 grid grid-cols-2 gap-4 rounded-xl bg-[#FDF3EA] px-6 py-4 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, sub }) => (
        <div key={title} className="flex items-center justify-center gap-3">
          <Icon
            size={26}
            className="shrink-0 text-[#F27318]"
            strokeWidth={1.5}
          />
          <div>
            <p className="text-[12px] font-medium text-neutral-900">{title}</p>
            <p className="text-[11px] text-neutral-500">{sub}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ---------- Designed for Growing Spaces ---------- */
export function DesignedFor({ product }) {
  const features = [
    {
      icon: Leaf,
      title: "Child-safe design",
      sub: "Rounded edges for everyday safety",
    },
    {
      icon: Box,
      title: "Smart storage",
      sub: "Organised compartments for clothes, toys and more",
    },
    {
      icon: ShieldCheck,
      title: "Durable build",
      sub: "Made with premium engineered wood",
    },
    {
      icon: Home,
      title: "Timeless style",
      sub: "Blends beautifully with any décor",
    },
  ];
  return (
    <section className="mb-10 grid gap-8 rounded-2xl bg-[#FDF3EA] p-8 lg:grid-cols-[1fr_2fr]">
      <div>
        <h2 className="mb-3 font-playfair text-[26px] leading-tight text-neutral-900">
          Designed for <br /> Growing Spaces
        </h2>
        <p className="text-[13px] leading-relaxed text-neutral-600">
          Thoughtfully crafted for your child’s room, the{" "}
          {product?.name?.split(" ").slice(0, 1)} offers smart storage, a warm
          finish and a timeless design that grows with them.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {features.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="text-center">
            <div className={`${iconWrap} mx-auto mb-3`}>
              <Icon size={22} strokeWidth={1.5} />
            </div>
            <p className="mb-1 text-[13px] font-semibold text-neutral-900">
              {title}
            </p>
            <p className="text-[11px] leading-snug text-neutral-500">{sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Styled in Real Homes ---------- */
export function StyledInRealHomes({ product, images, getImageUrl }) {
  const photos = images.slice(0, 3);
  return (
    <section className="mb-10 grid items-center gap-6 rounded-2xl bg-[#FDF3EA] p-6 lg:grid-cols-[1fr_2.2fr]">
      <div>
        <h2 className="mb-2 font-playfair text-[24px] text-neutral-900">
          Styled in Real Homes
        </h2>
        <p className="mb-5 text-[13px] text-neutral-600">
          See how our customers style the{" "}
          {product?.name?.split(" ").slice(0, 2).join(" ")} in their beautiful
          spaces.
        </p>
        <Link
          to="#reviews"
          className="inline-flex items-center gap-2 rounded-lg border border-[#F27318] px-4 py-2 text-[13px] font-medium text-[#F27318] hover:bg-white"
        >
          View Customer Photos <ArrowRight size={14} />
        </Link>
      </div>
      <div className="relative grid grid-cols-3 gap-3">
        {photos.map((img, i) => (
          <img
            key={i}
            src={getImageUrl(img)}
            alt=""
            className="aspect-[4/3] w-full rounded-lg object-cover"
            loading="lazy"
          />
        ))}
        <div className="absolute bottom-3 right-3 flex gap-2">
          {[ChevronLeft, ChevronRight].map((I, i) => (
            <span
              key={i}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow"
            >
              <I size={14} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
export function ProductFAQ({ product, images, getImageUrl }) {
  const [open, setOpen] = useState(0);
  const faqs = [
    {
      q: "What are the dimensions of this wardrobe?",
      a: product?.dimensions
        ? `This product measures ${product.dimensions}. It suits most rooms and provides ample storage space.`
        : "Please see the Key Specifications section for exact dimensions. It suits most rooms and provides ample storage space.",
    },
    {
      q: "Is the wardrobe suitable for toddlers and young children?",
      a: "Yes. It is designed with rounded edges and a sturdy build for everyday family use.",
    },
    {
      q: "Does it come pre-assembled or require installation?",
      a: "Our team assists with installation on delivery within the delivery area.",
    },
    {
      q: "What materials are used?",
      a: "Premium engineered wood with a durable finish.",
    },
    {
      q: "Is the finish safe for kids?",
      a: "The finish is low-VOC and tested for child-safe use.",
    },
    {
      q: "How do I care for and clean the wardrobe?",
      a: "Wipe with a soft, damp cloth and avoid harsh chemicals.",
    },
  ];
  return (
    <section className="mb-10 grid gap-6 rounded-2xl bg-[#FDF3EA] p-6 lg:grid-cols-[1fr_1.6fr]">
      <div className="flex flex-col">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#F27318]">
          FAQ
        </p>
        <h2 className="mb-3 font-playfair text-[30px] leading-tight text-neutral-900">
          Frequently Asked <br /> Questions
        </h2>
        <p className="mb-5 text-[13px] text-neutral-600">
          Find answers to common questions about this product, from dimensions
          to care and assembly.
        </p>
        {images[0] && (
          <img
            src={getImageUrl(images[0])}
            alt=""
            className="mt-auto hidden h-64 w-full rounded-xl object-cover lg:block"
            loading="lazy"
          />
        )}
      </div>
      <div className="rounded-xl bg-white/70 p-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className={`rounded-lg ${isOpen ? "bg-[#FDF3EA]" : ""}`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                aria-expanded={isOpen}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${isOpen ? "bg-[#F27318] text-white" : "bg-[#FDE8D7] text-[#F27318]"}`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-[13px] font-semibold text-neutral-900">
                  {f.q}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isOpen ? "rotate-180 text-[#F27318]" : ""}`}
                />
              </button>
              {isOpen && (
                <p className="px-12 pb-4 text-[12px] leading-relaxed text-neutral-600">
                  {f.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Delivery, Returns & Warranty ---------- */
export function SupportSection() {
  const cards = [
    {
      icon: Truck,
      title: "Delivery",
      text: "Free delivery on orders above NPR 5,000. Delivered within 3-7 business days across Nepal.",
    },
    {
      icon: Package,
      title: "Returns",
      text: "Hassle free 7 days return. Product must be unused and in original packaging.",
    },
    {
      icon: ShieldCheck,
      title: "Warranty",
      text: "2 years warranty on manufacturing defects.",
    },
    {
      icon: Headphones,
      title: "Need Help?",
      text: "Our team is here to assist you with any questions about delivery, returns or product care.",
    },
  ];
  return (
    <section className="mb-10 rounded-2xl bg-[#FDF3EA] p-6">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#F27318]">
        Support
      </p>
      <h2 className="mb-1 font-playfair text-[24px] text-neutral-900">
        Delivery, Returns &amp; Warranty
      </h2>
      <p className="mb-5 text-[13px] text-neutral-600">
        A smooth and worry-free shopping experience, from delivery to
        after-sales support.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="relative flex gap-3 rounded-xl bg-white p-4 shadow-sm"
          >
            <div className={`${iconWrap} !h-10 !w-10 shrink-0`}>
              <Icon size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="mb-1 text-[13px] font-semibold text-neutral-900">
                {title}
              </p>
              <p className="text-[11px] leading-snug text-neutral-500">
                {text}
              </p>
            </div>
            <ArrowRight
              size={12}
              className="absolute right-3 top-3 text-[#F27318]"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
