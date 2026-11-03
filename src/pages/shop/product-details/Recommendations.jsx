import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import ProductCard from "../../../components/shop/ProductCard";
import { ProductCardSkeleton } from "../../../components/common/Skeleton";
import { useRelatedProducts } from "../../../hooks/product/useProductTan";
import { shopCategoryUrl } from "../../../utils/shopFilters";
import {
  rankRecommendations,
  splitRecommendations,
} from "../../../utils/recommendationEngine";

// Layout: 5 products per row on wide screens (xl:grid-cols-5,
// the same row pattern as FeaturedPieces), 3 on medium, 2 on
// small. Similar picks fill up to two full rows (10); complements
// fill one full row (5).
const SIMILAR_LIMIT = 10;
const COMPLEMENT_LIMIT = 5;
const FETCH_LIMIT = SIMILAR_LIMIT + COMPLEMENT_LIMIT;
const ROW_GRID_CLASS =
  "grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-5";

/**
 * Recommendations — the PDP recommendation section.
 *
 * Data: GET /products/:id/related, which runs the weighted
 * Recommendation Engine on the server (category, productType,
 * style, room, collection, tags, materials, colours, price
 * proximity, rating quality — see utils/recommendationEngine.js).
 * The same engine runs here on the returned pool to attach the
 * per-signal breakdown the split needs, so server-ranked and
 * locally-ranked picks follow identical rules.
 *
 * Rendering:
 *  - "You May Also Like" — highest-scoring similar pieces.
 *  - "Complete the Look" — complements: a *different* category that
 *    shares this product's room, style or collection. Only shown
 *    when at least one complement genuinely earned its place.
 *  - Every card carries its top reason ("Same category",
 *    "For the same room", …) — a recommendation that cannot say
 *    why it exists does not ship.
 *  - No picks → the whole section renders nothing. No filler.
 */
export default function Recommendations({ product }) {
  const { data, isLoading } = useRelatedProducts(product?._id, FETCH_LIMIT);

  const { similar, complements } = useMemo(() => {
    const pool = data?.data?.products || [];
    const serverReasons = new Map(
      pool.map((item) => [String(item?._id ?? ""), item?.recommendationReasons]),
    );
    const ranked = rankRecommendations(product, pool, {
      limit: FETCH_LIMIT,
      // 0: the server's cold-start fill ("Popular right now") scores
      // low by design and must survive the local re-rank.
      minScore: 0,
    }).map((entry) => ({
      ...entry,
      reasons: entry.reasons.length
        ? entry.reasons
        : serverReasons.get(String(entry.product?._id ?? "")) || [
            "Popular right now",
          ],
    }));
    const split = splitRecommendations(ranked);
    // Edge case: nothing shares the category, but complements do
    // exist — promote them to the main rail rather than showing an
    // empty "similar" rail above a full "complete the look" rail.
    if (split.similar.length === 0 && split.complements.length > 0) {
      return { similar: split.complements, complements: [] };
    }
    return split;
  }, [data, product]);

  if (!product?._id) return null;

  if (isLoading) {
    return (
      <section aria-labelledby="recommendations-heading" className="mb-10">
        <h2
          id="recommendations-heading"
          className="font-dm-sans text-3xl font-bold tracking-tight text-neutral-900"
        >
          You May Also Like
        </h2>
        <div className={`mt-6 ${ROW_GRID_CLASS}`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (similar.length === 0 && complements.length === 0) return null;

  const categorySlug = product.category?.slug;
  const categoryName = product.category?.name;

  return (
    <section aria-labelledby="recommendations-heading" className="mb-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-widest text-brand">
            <Sparkles size={14} aria-hidden="true" />
            Recommended for you
          </p>
          <h2
            id="recommendations-heading"
            className="mt-2 font-dm-sans text-3xl font-bold tracking-tight text-neutral-900"
          >
            You May Also Like
          </h2>
          <p className="mt-1.5 max-w-xl text-[14px] text-black/45">
            Picked by matching this piece&rsquo;s
            {categoryName ? ` category, ` : " "}style, room and price
            range — not just what else is popular.
          </p>
        </div>
        {categorySlug && (
          <Link
            to={shopCategoryUrl(categorySlug)}
            className="text-[14px] font-semibold text-[#1A1714] underline underline-offset-4 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            View all{categoryName ? ` ${categoryName}` : ""}
          </Link>
        )}
      </div>

      <div className={ROW_GRID_CLASS}>
        {similar.slice(0, SIMILAR_LIMIT).map((entry) => (
          <RecommendationCard key={entry.product._id} entry={entry} />
        ))}
      </div>

      {complements.length > 0 && (
        <>
          <div className="mb-6 mt-10">
            <h3 className="font-dm-sans text-2xl font-bold tracking-tight text-neutral-900">
              Complete the Look
            </h3>
            <p className="mt-1.5 max-w-xl text-[14px] text-black/45">
              Different pieces, same room and style — chosen to sit well
              alongside the {product.name}.
            </p>
          </div>
          <div className={ROW_GRID_CLASS}>
            {complements.slice(0, COMPLEMENT_LIMIT).map((entry) => (
              <RecommendationCard key={entry.product._id} entry={entry} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function RecommendationCard({ entry }) {
  const reason = entry.reasons?.[0];
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <ProductCard product={entry.product} />
      </div>
      {reason && (
        <p
          data-recommendation-reason={reason}
          className="mt-2 flex items-center gap-1.5 px-1 text-[12px] font-medium text-black/45"
        >
          <Sparkles size={12} aria-hidden="true" className="shrink-0 text-brand" />
          {reason}
        </p>
      )}
    </div>
  );
}
