/**
 * @deprecated REUSE-009 consolidation (Phase 4): FilterSidebarSkeleton now
 * lives in components/common/Skeleton.jsx, the one canonical skeleton
 * home. This module remains only as a re-export shim so existing import
 * paths (and test mocks of this path) keep working; new code should
 * import { FilterSidebarSkeleton } from common/Skeleton directly.
 */
export { FilterSidebarSkeleton as default } from "../common/Skeleton";
