// PERF-001: lazy wrappers for the page skeletons in ./Skeleton.
// Skeleton.jsx is the largest single module in the customer entry
// graph, and App.jsx only needs these components as Suspense
// fallbacks — so they are code-split out of the entry chunk and load
// on first navigation instead of at first paint.
import { lazy } from "react";

const lazySkeleton = (name) =>
  lazy(() =>
    import("./Skeleton").then((m) => ({
      default: m[name],
    })),
  );

export const RouteSkeleton = lazySkeleton("RouteSkeleton");
export const CatalogPageSkeleton = lazySkeleton("CatalogPageSkeleton");
export const ProductDetailsSkeleton = lazySkeleton("ProductDetailsSkeleton");
export const HomeSkeleton = lazySkeleton("HomeSkeleton");
export const CheckoutSkeleton = lazySkeleton("CheckoutSkeleton");
export const ProfileSkeleton = lazySkeleton("ProfileSkeleton");
export const BlogListSkeleton = lazySkeleton("BlogListSkeleton");
export const BlogPostSkeleton = lazySkeleton("BlogPostSkeleton");
export const ContactSkeleton = lazySkeleton("ContactSkeleton");
export const FaqSkeleton = lazySkeleton("FaqSkeleton");
export const TrackOrderSkeleton = lazySkeleton("TrackOrderSkeleton");
export const OrderConfirmationSkeleton = lazySkeleton(
  "OrderConfirmationSkeleton",
);
export const NotificationsSkeleton = lazySkeleton("NotificationsSkeleton");
export const CenteredCardSkeleton = lazySkeleton("CenteredCardSkeleton");
export const PaymentFailedSkeleton = lazySkeleton("PaymentFailedSkeleton");
