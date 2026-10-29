import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { safeActionUrl } from "../../utils/safeUrl";

export default function PromoCard({
  className = "",
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  image,
  variant = "primary",
  compact = false,
}) {
  const primary = variant === "primary";
  // FE-03/FE-04: the CTA href runs through safeActionUrl — an unsafe
  // href (javascript:, off-allowlist absolute, quote/whitespace tricks)
  // yields null and renders inert text instead of a link (the contract
  // pinned by tests/security/mediaSinkGuard.test.js's allowlist entry
  // for this file and by tests/components/common/PromoCard.test.jsx).
  const safeHref = ctaHref ? safeActionUrl(ctaHref) : null;

  return (
    <article
      className={`relative isolate overflow-hidden rounded-lg bg-[#F3EAE0] ${
        compact
          ? "min-h-[220px]"
          : "min-h-[300px] sm:min-h-[270px] lg:h-[270px]"
      } ${className}`}
    >
      {image && (
        <div className="absolute inset-0 overflow-hidden bg-[#F3EAE0]">
          {primary ? (
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes={image.sizes}
              width={image.width}
              height={image.height}
              alt={image.alt || ""}
              loading="lazy"
              decoding="async"
              className={
                compact
                  ? "absolute h-full w-full object-cover"
                  : "absolute inset-0 h-full w-full object-cover object-[center_55%]"
              }
              style={
                compact
                  ? {
                      top: "0px",
                      left: "200px",
                      width: "calc(100% - 200px)",
                      height: "100%",
                      objectPosition: "center 55%",
                    }
                  : undefined
              }
            />
          ) : (
            <div className="absolute inset-y-0 right-0 w-[85%] overflow-hidden">
              <img
                src={image.src}
                srcSet={image.srcSet}
                sizes={image.sizes}
                width={image.width}
                height={image.height}
                alt={image.alt || ""}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-right"
              />
            </div>
          )}
        </div>
      )}

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${
          primary
            ? "bg-gradient-to-r from-[#F4EBE1] from-0% via-[#F4EBE1]/95 via-[27%] to-transparent to-[65%]"
            : "bg-gradient-to-r from-[#F4EBE1] from-0% via-[#F4EBE1]/95 via-[43%] to-transparent to-[85%]"
        }`}
      />

      <div
        className={`relative z-10 flex flex-col items-start ${
          compact
            ? "min-h-[220px] justify-center p-5 sm:p-7 lg:p-9"
            : "h-full min-h-[300px] justify-center px-5 py-5 sm:min-h-[270px] sm:px-7 lg:px-9 lg:py-5"
        } ${
          compact
            ? "max-w-[560px]"
            : primary
              ? "max-w-[520px]"
              : "max-w-[310px]"
        }`}
      >
        {eyebrow && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#77716B]">
            {eyebrow}
          </p>
        )}

        <h3 className="text-[25px] font-bold leading-[1.15] tracking-[-0.035em] text-[#1A1714] sm:text-[28px]">
          {title}
        </h3>

        {description && (
          <p
            className={`mt-2 text-[13px] font-normal leading-[1.55] text-[#77716B] ${
              compact
                ? "max-w-[400px]"
                : primary
                  ? "max-w-[330px]"
                  : "max-w-[225px]"
            }`}
          >
            {description}
          </p>
        )}

        {ctaLabel && safeHref && (
          <Link
            to={safeHref}
            className={`group mt-4 inline-flex min-h-[42px] items-center justify-center gap-3 rounded-md px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F27318] ${
              primary
                ? "bg-[#FF6500] text-white hover:bg-[#E85C00]"
                : "bg-white text-[#1A1714] hover:bg-[#F9F7F4]"
            }`}
          >
            {ctaLabel}
            <MoveRight
              size={16}
              strokeWidth={1.8}
              className="shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        )}
        {ctaLabel && ctaHref && !safeHref && (
          <span
            aria-disabled="true"
            className={`mt-4 inline-flex min-h-[42px] items-center justify-center gap-3 rounded-md px-5 py-2.5 text-[13px] font-semibold ${
              primary
                ? "bg-[#FF6500] text-white"
                : "bg-white text-[#1A1714]"
            }`}
          >
            {ctaLabel}
            <MoveRight size={16} strokeWidth={1.8} className="shrink-0" />
          </span>
        )}
      </div>
    </article>
  );
}
