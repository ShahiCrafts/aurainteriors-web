import { describe, it, expect } from "vitest";
import {
  scoreCandidate,
  rankRecommendations,
  splitRecommendations,
  isEligible,
} from "../../src/utils/recommendationEngine";

const source = {
  _id: "src",
  name: "Kanso Wardrobe",
  price: 44299,
  category: { _id: "cat-wardrobe", slug: "kids-wardrobes" },
  productType: "wardrobe",
  style: "industrial",
  roomSlugs: ["kids-room"],
  collectionSlugs: ["kanso"],
  tags: ["kids", "storage"],
  materials: ["engineered wood", "powder-coated steel"],
  colors: ["charcoal"],
  rating: { average: 4.5, count: 20 },
};

const twin = {
  _id: "twin",
  name: "Kanso Wardrobe Twin",
  price: 46000,
  category: { _id: "cat-wardrobe", slug: "kids-wardrobes" },
  productType: "wardrobe",
  style: "industrial",
  roomSlugs: ["kids-room"],
  collectionSlugs: ["kanso"],
  tags: ["kids", "storage"],
  materials: ["engineered wood"],
  colors: ["charcoal"],
  rating: { average: 4.8, count: 40 },
  stock: 5,
  status: "active",
};

const complement = {
  _id: "comp",
  name: "Kids Desk",
  price: 18000,
  category: { _id: "cat-desk", slug: "kids-desks" },
  style: "industrial",
  roomSlugs: ["kids-room"],
  tags: ["kids"],
  rating: { average: 4.2, count: 9 },
  stock: 3,
  status: "active",
};

const unrelated = {
  _id: "unrel",
  name: "Garden Bench",
  price: 90000,
  category: { _id: "cat-outdoor", slug: "outdoor" },
  style: "bohemian",
  roomSlugs: ["garden"],
  tags: ["outdoor"],
  rating: { average: 3.5, count: 2 },
  stock: 2,
  status: "active",
};

describe("recommendationEngine.scoreCandidate", () => {
  it("scores a near-twin far above an unrelated product", () => {
    expect(scoreCandidate(source, twin).score).toBeGreaterThan(
      scoreCandidate(source, unrelated).score + 40,
    );
  });

  it("classifies same-category as similar and cross-category room matches as complement", () => {
    expect(scoreCandidate(source, twin).kind).toBe("similar");
    expect(scoreCandidate(source, complement).kind).toBe("complement");
  });

  it("explains itself with human reasons", () => {
    const { reasons } = scoreCandidate(source, twin);
    expect(reasons).toContain("Same category");
    expect(reasons.length).toBeLessThanOrEqual(3);
  });

  it("price proximity decays: a 100%+ price gap earns no price points", () => {
    const pricey = { ...twin, _id: "pricey", price: source.price * 2.5 };
    expect(scoreCandidate(source, pricey).breakdown.price).toBe(0);
    expect(scoreCandidate(source, twin).breakdown.price).toBeGreaterThan(9);
  });
});

describe("recommendationEngine.rankRecommendations", () => {
  it("ranks by score and excludes the source, duplicates and unavailable items", () => {
    const outOfStock = { ...twin, _id: "oos", stock: 0 };
    const ranked = rankRecommendations(source, [
      unrelated,
      source,
      twin,
      twin,
      outOfStock,
      complement,
    ]);
    expect(ranked.map((r) => r.product._id)).toEqual(["twin", "comp", "unrel"]);
  });

  it("respects the limit", () => {
    const pool = Array.from({ length: 10 }, (_, i) => ({
      ...twin,
      _id: `p-${i}`,
    }));
    expect(rankRecommendations(source, pool, { limit: 4 })).toHaveLength(4);
  });
});

describe("recommendationEngine eligibility + split", () => {
  it("rejects deleted, inactive and self candidates", () => {
    expect(isEligible(source, { _id: "x", deletedAt: new Date() })).toBe(false);
    expect(isEligible(source, { _id: "x", status: "inactive" })).toBe(false);
    expect(isEligible(source, source)).toBe(false);
    expect(isEligible(source, twin)).toBe(true);
  });

  it("split keeps price-only cross-category matches out of Complete the Look", () => {
    const ranked = rankRecommendations(source, [twin, complement, unrelated], {
      minScore: 0,
    });
    const { similar, complements } = splitRecommendations(ranked);
    expect(similar.map((r) => r.product._id)).toEqual(["twin"]);
    expect(complements.map((r) => r.product._id)).toEqual(["comp"]);
  });
});
