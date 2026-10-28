/**
 * @typedef {Object} EmptyStateProps
 * @property {React.ReactNode} [icon] Icon node (e.g. a lucide element),
 *   rendered inside a neutral circle.
 * @property {string} title
 * @property {string} [description]
 * @property {React.ReactNode} [action] Action node (button/link).
 * @property {string} [className]
 */

/**
 * Empty state (REUSE-009). Empty states were inline everywhere (Wishlist,
 * CatalogListing, FeaturedPieces each rolled their own icon + copy block).
 *
 * @param {EmptyStateProps} props
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-12 ${className}`}
    >
      {icon && (
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-neutral-100 text-neutral-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-neutral-800">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-neutral-500">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
