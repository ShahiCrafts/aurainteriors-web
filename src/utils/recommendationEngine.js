/**
 * Aura Interiors — Recommendation Engine (web, ESM mirror)
 * ------------------------------------------------------------------
 * Deterministic, explainable, weighted scoring. This is an exact
 * mirror of the canonical server engine in
 * `aurainteriors-server/utils/recommendationEngine.js` — keep
 * WEIGHTS and the scoring formulas in sync across the two files.
 *
 * On the PDP the server rail (GET /products/:id/related, which runs
 * this same engine) is primary. This mirror is the fallback/filler:
 * when the API rail is short, the Recommendations section ranks a
 * broader catalog pool locally with identical rules, so the section
 * behaves the same whichever path filled it.
 *
 * Signals (see server file for the full rationale):
 *   category 30 · productType 8 · style 14 · rooms 12 (Jaccard)
 *   collections 8 · tags 10 (Jaccard) · materials 6 · colours 4
 *   price 10 (linear decay) · quality 5 · merchandising 3 (capped)
 *
 * Kind: `similar` when the category matches, otherwise `complement`
 * (different category, same room / style / collection).
 */

export const RECOMMENDATION_WEIGHTS = Object.freeze({
  category: 30,
  productType: 8,
  style: 14,
  rooms: 12,
  collections: 8,
  tags: 10,
  materials: 6,
  colours: 4,
  price: 10,
  quality: 5,
  merchandising: 3,
});

const WEIGHTS = RECOMMENDATION_WEIGHTS;

const asId = (value) => {
  if (value == null) return null;
  if (typeof value === "object") {
    const id = value._id ?? value.id ?? value.slug;
    return id == null ? null : String(id);
  }
  return String(value);
};

const asSlug = (value) =>
  value && typeof value === "object" && value.slug
    ? String(value.slug).toLowerCase()
    : null;

const normSet = (values) =>
  new Set(
    (Array.isArray(values) ? values : [])
      .map((v) => (typeof v === "string" ? v : v?.name))
      .filter((v) => typeof v === "string" && v.trim())
      .map((v) => v.trim().toLowerCase()),
  );

const overlapCount = (a, b) => {
  let n = 0;
  for (const v of a) if (b.has(v)) n += 1;
  return n;
};

const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  const inter = overlapCount(a, b);
  return inter / (a.size + b.size - inter);
};

const overlapRatio = (sourceSet, candidateSet) => {
  if (!sourceSet.size || !candidateSet.size) return 0;
  return (
    overlapCount(sourceSet, candidateSet) /
    Math.min(sourceSet.size, candidateSet.size)
  );
};

export const effectivePrice = (p) => {
  const price = Number(p?.priceFrom ?? p?.price);
  return Number.isFinite(price) && price > 0 ? price : null;
};

export const categoryMatches = (source, candidate) => {
  const sId = asId(source?.category);
  const cId = asId(candidate?.category);
  if (sId && cId && sId === cId) return true;
  const sSlug = asSlug(source?.category);
  const cSlug = asSlug(candidate?.category);
  return Boolean(sSlug && cSlug && sSlug === cSlug);
};

export function isEligible(source, candidate) {
  if (!candidate || typeof candidate !== "object") return false;
  const sId = asId(source?._id ?? source?.id);
  const cId = asId(candidate._id ?? candidate.id);
  if (!cId || (sId && cId === sId)) return false;
  if (candidate.deletedAt) return false;
  if (candidate.status && candidate.status !== "active") return false;
  if (
    !candidate.hasVariants &&
    typeof candidate.stock === "number" &&
    candidate.stock <= 0
  ) {
    return false;
  }
  return true;
}

export function scoreCandidate(source, candidate) {
  const breakdown = {
    category: 0,
    productType: 0,
    style: 0,
    rooms: 0,
    collections: 0,
    tags: 0,
    materials: 0,
    colours: 0,
    price: 0,
    quality: 0,
    merchandising: 0,
  };
  const reasons = [];

  const sameCategory = categoryMatches(source, candidate);
  if (sameCategory) {
    breakdown.category = WEIGHTS.category;
    reasons.push("Same category");
  }

  if (
    source?.productType &&
    candidate?.productType &&
    String(source.productType).toLowerCase() ===
      String(candidate.productType).toLowerCase()
  ) {
    breakdown.productType = WEIGHTS.productType;
    reasons.push("Same type of piece");
  }

  if (
    source?.style &&
    candidate?.style &&
    String(source.style).toLowerCase() === String(candidate.style).toLowerCase()
  ) {
    breakdown.style = WEIGHTS.style;
    reasons.push(`Same ${String(source.style)} style`);
  }

  const roomOverlap = jaccard(normSet(source?.roomSlugs), normSet(candidate?.roomSlugs));
  if (roomOverlap > 0) {
    breakdown.rooms = +(WEIGHTS.rooms * roomOverlap).toFixed(2);
    reasons.push("For the same room");
  }

  const collectionOverlap = overlapRatio(
    normSet(source?.collectionSlugs),
    normSet(candidate?.collectionSlugs),
  );
  if (collectionOverlap > 0) {
    breakdown.collections = +(WEIGHTS.collections * collectionOverlap).toFixed(2);
    reasons.push("From the same collection");
  }

  const tagOverlap = jaccard(normSet(source?.tags), normSet(candidate?.tags));
  if (tagOverlap > 0) {
    breakdown.tags = +(WEIGHTS.tags * tagOverlap).toFixed(2);
  }

  const materialOverlap = overlapRatio(
    normSet(source?.materials),
    normSet(candidate?.materials),
  );
  if (materialOverlap > 0) {
    breakdown.materials = +(WEIGHTS.materials * materialOverlap).toFixed(2);
    reasons.push("Similar materials");
  }

  const colourOverlap = overlapRatio(
    normSet(source?.colors ?? source?.colours),
    normSet(candidate?.colors ?? candidate?.colours),
  );
  if (colourOverlap > 0) {
    breakdown.colours = +(WEIGHTS.colours * colourOverlap).toFixed(2);
  }

  const sPrice = effectivePrice(source);
  const cPrice = effectivePrice(candidate);
  if (sPrice && cPrice) {
    const diffRatio = Math.abs(cPrice - sPrice) / sPrice;
    breakdown.price = +(WEIGHTS.price * Math.max(0, 1 - diffRatio)).toFixed(2);
    if (diffRatio <= 0.25) reasons.push("Similar price range");
  }

  const avg = Number(candidate?.rating?.average) || 0;
  const count = Number(candidate?.rating?.count) || 0;
  breakdown.quality = +(
    (Math.min(Math.max(avg, 0), 5) / 5) * (WEIGHTS.quality - 1) +
    Math.min(count, 50) / 50
  ).toFixed(2);
  if (avg >= 4.5 && count >= 5) reasons.push("Highly rated");

  if (candidate?.isFeatured) breakdown.merchandising += 2;
  if (candidate?.isNewArrival) breakdown.merchandising += 1;
  breakdown.merchandising = Math.min(breakdown.merchandising, WEIGHTS.merchandising);

  const score = +Object.values(breakdown).reduce((sum, v) => sum + v, 0).toFixed(2);

  return {
    score,
    breakdown,
    reasons: reasons.slice(0, 3),
    kind: sameCategory ? "similar" : "complement",
  };
}

export function rankRecommendations(
  source,
  candidates,
  { limit = 8, minScore = 1 } = {},
) {
  const seen = new Set();
  const scored = [];
  for (const candidate of Array.isArray(candidates) ? candidates : []) {
    const id = asId(candidate?._id ?? candidate?.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (!isEligible(source, candidate)) continue;
    const result = scoreCandidate(source, candidate);
    if (result.score < minScore) continue;
    scored.push({ product: candidate, ...result });
  }
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (Number(b.product?.rating?.count) || 0) -
        (Number(a.product?.rating?.count) || 0) ||
      (Number(b.product?.rating?.average) || 0) -
        (Number(a.product?.rating?.average) || 0) ||
      new Date(b.product?.createdAt || 0) - new Date(a.product?.createdAt || 0),
  );
  const cap = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 8;
  return scored.slice(0, cap);
}

/**
 * Split a ranked list into the two PDP rails. Complements must earn
 * their place through a shared room / style / collection / tag —
 * a price/quality-only match is not a "complete the look" pick.
 */
export function splitRecommendations(ranked) {
  const similar = [];
  const complements = [];
  for (const entry of Array.isArray(ranked) ? ranked : []) {
    if (entry.kind === "similar") {
      similar.push(entry);
    } else if (
      entry.breakdown &&
      (entry.breakdown.rooms > 0 ||
        entry.breakdown.style > 0 ||
        entry.breakdown.collections > 0 ||
        entry.breakdown.tags > 0)
    ) {
      complements.push(entry);
    }
  }
  return { similar, complements };
}

export default rankRecommendations;
