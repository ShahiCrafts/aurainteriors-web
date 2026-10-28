import { Scan } from "lucide-react";

export default function ProductDescription({
  product,
  image,
  getImageUrl,
  getImageSrcSet,
  canViewInAR = false,
  onViewInAR,
}) {
  if (!product?.description && !image) return null;

  // Keep the author's paragraph breaks.
  const paragraphs = (product.description || "")
    .split(/\n{1,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section
      aria-labelledby="product-description-heading"
      className="mb-10 border-b border-neutral-200 pb-10"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-12">
        {/* Text */}
        <div>
          <h2
            id="product-description-heading"
            className="font-dm-sans text-3xl font-semibold tracking-tight text-neutral-900"
          >
            Product Description
          </h2>
          <div className="mt-5 max-w-xl space-y-3 font-dm-sans text-[15px] leading-relaxed text-neutral-500">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        {/* Lifestyle image + AR button */}
        {image && (
          <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
            <img
              src={getImageUrl(image)}
              srcSet={getImageSrcSet?.(image, [600, 900, 1200])}
              sizes="(min-width: 1024px) 55vw, 100vw"
              alt={image.alt || product.name}
              loading="lazy"
              className="aspect-[16/9] w-full object-cover lg:aspect-[2/1]"
            />
            {canViewInAR && (
              <button
                type="button"
                onClick={onViewInAR}
                className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white px-5 py-3 font-dm-sans text-sm font-semibold text-neutral-900 shadow-md transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F27318] sm:right-6 sm:top-6"
              >
                <Scan size={18} aria-hidden="true" />
                See it in your space
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}