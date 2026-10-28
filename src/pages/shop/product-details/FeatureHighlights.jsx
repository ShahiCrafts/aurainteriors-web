import { Leaf, Boxes, ShieldCheck, Home } from "lucide-react";

// Default copy mirrors the design. Pass `features` to override
// per product/category.
const DEFAULT_FEATURES = [
  {
    icon: Leaf,
    title: "Child-safe design",
    lines: ["Rounded edges", "for everyday safety"],
  },
  {
    icon: Boxes,
    title: "Smart storage",
    lines: ["Organised compartments", "for clothes, toys and more"],
  },
  {
    icon: ShieldCheck,
    title: "Durable build",
    lines: ["Made with premium", "engineered wood"],
  },
  {
    icon: Home,
    title: "Timeless style",
    lines: ["Blends beautifully", "with any décor"],
  },
];

export default function FeatureHighlights({
  productName,
  title = "Designed for Growing Spaces",
  description,
  features = DEFAULT_FEATURES,
}) {
  const body =
    description ||
    `Thoughtfully crafted for your child’s room, the ${
      productName || "Aranya"
    } offers smart storage, a warm finish and a timeless design that grows with them.`;

  return (
    <section
      aria-labelledby="feature-highlights-heading"
      className="mb-10 rounded-xl bg-[#f6f6f6] px-6 py-8 sm:px-10 lg:px-10 lg:py-8"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-10">
        {/* Intro */}
        <div className="lg:w-[32%] lg:shrink-0">
          <h2
            id="feature-highlights-heading"
            className="font-dm-sans text-3xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-3xl"
          >
            {title}
          </h2>
          <p className="mt-4 max-w-md font-dm-sans text-[15px] leading-relaxed text-neutral-500">
            {body}
          </p>
        </div>

        {/* Features */}
        <ul className="grid flex-1 grid-cols-2 gap-y-8 lg:grid-cols-4 lg:gap-y-0">
          {features.map(({ icon: Icon, title: featureTitle, lines }, index) => (
            <li
              key={featureTitle}
              className={`flex flex-col items-center px-3 text-center lg:px-5 ${
                index > 0 ? "lg:border-l lg:border-[#EAE0D5]" : ""
              }`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7E7E7]">
                <Icon
                  size={26}
                  strokeWidth={1.5}
                  className="text-black"
                  aria-hidden="true"
                />
              </span>
              <h3 className="mt-4 font-dm-sans text-[15px] font-bold text-neutral-900">
                {featureTitle}
              </h3>
              <p className="mt-1 font-dm-sans text-sm leading-snug text-neutral-500">
                {lines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
