import { ChevronRight } from "lucide-react";
import { safeActionUrl } from "../../utils/safeUrl";

/**
 * @typedef {Object} BreadcrumbItem
 * @property {string} label
 * @property {string} [href] Link target; non-final items without an href
 *   render as plain text.
 */

/**
 * @typedef {Object} BreadcrumbsProps
 * @property {BreadcrumbItem[]} items Trail in order; the last item is the
 *   current page and is never a link. Hrefs pass through safeActionUrl
 *   (the FE-03 convention, as in PromoCard): an unsafe href renders as
 *   inert text rather than a link.
 * @property {string} [className]
 */

/**
 * Breadcrumb trail (REUSE-012). Replaces the three hand-rolled trails in
 * CatalogListing, ProductDetailsPage and BlogDetailsPage. Renders plain
 * anchors so it works in both apps without a router context.
 *
 * @param {BreadcrumbsProps} props
 */
export default function Breadcrumbs({ items = [], className = "" }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const safeHref = !isLast && item.href ? safeActionUrl(item.href) : null;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight size={14} aria-hidden="true" className="text-neutral-300" />
              )}
              {isLast ? (
                <span aria-current="page" className="font-semibold text-neutral-900">
                  {item.label}
                </span>
              ) : safeHref ? (
                <a href={safeHref} className="text-neutral-500 transition-colors hover:text-brand">
                  {item.label}
                </a>
              ) : (
                <span className="text-neutral-500">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
