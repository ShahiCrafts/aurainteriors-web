/**
 * @typedef {Object} SectionHeadingProps
 * @property {string} title Heading text (rendered as an <h2>).
 * @property {string} [eyebrow] Small overline above the title, as in
 *   FeaturedPieces ("Featured Products").
 * @property {string} [subtitle] Supporting line under the title.
 * @property {React.ReactNode} [action] Trailing action (link/button node),
 *   right-aligned against the heading block.
 * @property {"left"|"center"} [align="left"] With an `action`, alignment
 *   applies to the text block; the row layout stays space-between.
 * @property {string} [className]
 */

/**
 * Section heading block (REUSE-012): eyebrow + title + subtitle + optional
 * trailing action. FeaturedPieces, TrustBanner, Testimonials and
 * BlogSection each hand-rolled this combination.
 *
 * @param {SectionHeadingProps} props
 */
export default function SectionHeading({
  title,
  eyebrow,
  subtitle,
  action,
  align = "left",
  className = "",
}) {
  const textBlock = (
    <div className={align === "center" ? "text-center" : undefined}>
      {eyebrow && <p className="text-sm font-light text-black/40">{eyebrow}</p>}
      <h2 className="mt-2 text-[28px] font-bold leading-tight text-neutral-900 md:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1.5 text-sm text-black/45 md:text-[15px]">{subtitle}</p>
      )}
    </div>
  );

  if (action) {
    return (
      <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
        {textBlock}
        {action}
      </div>
    );
  }
  return <div className={className}>{textBlock}</div>;
}
