/**
 * @deprecated REUSE-009 consolidation (Phase 4): ListingCardSkeleton and
 * ProductDetailsSkeleton now live in components/common/Skeleton.jsx, the
 * one canonical skeleton home. This module remains only as a re-export
 * shim so existing import paths (and test mocks of this path) keep
 * working; new code should import from common/Skeleton directly.
 */
export {
  ListingCardSkeleton,
  ProductDetailsSkeleton,
} from "../common/Skeleton";
