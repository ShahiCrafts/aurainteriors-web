import { Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import "./styles/index.css";
import ErrorBoundary from "./components/common/ErrorBoundary";

import {
  RouteSkeleton,
  CatalogPageSkeleton,
  ProductDetailsSkeleton,
  HomeSkeleton,
  CheckoutSkeleton,
  ProfileSkeleton,
  BlogListSkeleton,
  BlogPostSkeleton,
  ContactSkeleton,
  FaqSkeleton,
  TrackOrderSkeleton,
  OrderConfirmationSkeleton,
  NotificationsSkeleton,
  CenteredCardSkeleton,
  PaymentFailedSkeleton,
} from "./components/common/lazySkeletons";
const ShopChrome = lazy(() => import("./components/shop/ShopChrome"));
const AuthCallback = lazy(() => import("./components/auth/AuthCallback"));
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CustomerRoute from "./components/auth/CustomerRoute";
import LegacyShopCategoryRedirect from "./components/navigation/LegacyShopCategoryRedirect";

const NewsletterActionPage = lazy(() => import("./pages/NewsletterActionPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const AuthModal = lazy(() => import("./components/modals/AuthModal"));
const ChatWidget = lazy(() => import("./components/chat/ChatWidget"));
const VerifyMagicLinkPage = lazy(
  () => import("./pages/auth/VerifyMagicLinkPage"),
);
const ProfilePage = lazy(() => import("./pages/customer/ProfilePage"));
const NotificationsPage = lazy(
  () => import("./pages/customer/NotificationsPage"),
);
const ShopPage = lazy(() => import("./pages/shop/ShopPage"));
const RoomPage = lazy(() => import("./pages/shop/RoomPage"));
const CollectionPage = lazy(() => import("./pages/shop/CollectionPage"));
const BlogsPage = lazy(() => import("./pages/blog/BlogsPage"));
const BlogDetailsPage = lazy(() => import("./pages/blog/BlogDetailsPage"));
const ProductDetailsPage = lazy(
  () => import("./pages/shop/ProductDetailsPage"),
);
const ARViewPage = lazy(() => import("./pages/shop/ARViewPage"));
const NativeARPage = lazy(() => import("./pages/shop/NativeARPage"));
const CheckoutPage = lazy(() => import("./pages/checkout/CheckoutPage"));
const OrderConfirmationPage = lazy(
  () => import("./pages/customer/OrderConfirmationPage"),
);
const PaymentFailedPage = lazy(
  () => import("./pages/checkout/PaymentFailedPage"),
);
const TrackOrderPage = lazy(() => import("./pages/customer/TrackOrderPage"));
const ContactPage = lazy(() => import("./pages/info/ContactPage"));
const FAQPage = lazy(() => import("./pages/info/FAQPage"));
const NotFoundPage = lazy(() => import("./pages/info/NotFoundPage"));
const AnnouncementsPage = lazy(() => import("./pages/info/AnnouncementsPage"));

const catalogFallback = (
  <Suspense fallback={null}>
    <ShopChrome>
      <Suspense fallback={null}>
        <CatalogPageSkeleton />
      </Suspense>
    </ShopChrome>
  </Suspense>
);

function App() {
  const location = useLocation();
  return (
    <>
      <Suspense fallback={null}>
        <AuthModal />
      </Suspense>

      <ErrorBoundary resetKey={location.pathname}>
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<HomeSkeleton />}>
                <HomePage />
              </Suspense>
            }
          />

          {/* Auth Routes */}
          <Route
            path="/auth/verify"
            element={
              <Suspense fallback={<CenteredCardSkeleton />}>
                <VerifyMagicLinkPage />
              </Suspense>
            }
          />
          <Route
            path="/auth/success"
            element={
              <Suspense fallback={null}>
                <AuthCallback />
              </Suspense>
            }
          />

          {/* Customer-facing routes */}
          <Route
            path="/shop"
            element={
              <CustomerRoute>
                <Suspense fallback={catalogFallback}>
                  <ShopPage />
                </Suspense>
              </CustomerRoute>
            }
          />
          <Route
            path="/shop/:categorySlug"
            element={
              <CustomerRoute>
                <LegacyShopCategoryRedirect />
              </CustomerRoute>
            }
          />
          <Route
            path="/rooms/:slug"
            element={
              <CustomerRoute>
                <Suspense fallback={catalogFallback}>
                  <RoomPage />
                </Suspense>
              </CustomerRoute>
            }
          />
          <Route
            path="/collections/:slug"
            element={
              <CustomerRoute>
                <Suspense fallback={catalogFallback}>
                  <CollectionPage />
                </Suspense>
              </CustomerRoute>
            }
          />
          <Route
            path="/product/:productSlug"
            element={
              <CustomerRoute>
                <Suspense fallback={<ProductDetailsSkeleton />}>
                  <ProductDetailsPage />
                </Suspense>
              </CustomerRoute>
            }
          />
          <Route
            path="/ar/:productSlug"
            element={
              <CustomerRoute>
                <Suspense fallback={<RouteSkeleton />}>
                  <ARViewPage />
                </Suspense>
              </CustomerRoute>
            }
          />
          <Route
            path="/native-ar"
            element={
              <CustomerRoute>
                <Suspense fallback={<RouteSkeleton />}>
                  <NativeARPage />
                </Suspense>
              </CustomerRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <CustomerRoute>
                <Suspense fallback={<CheckoutSkeleton />}>
                  <CheckoutPage />
                </Suspense>
              </CustomerRoute>
            }
          />
          <Route
            path="/checkout/payment-failed"
            element={
              <CustomerRoute>
                <Suspense fallback={<PaymentFailedSkeleton />}>
                  <PaymentFailedPage />
                </Suspense>
              </CustomerRoute>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={
              <CustomerRoute>
                <Suspense fallback={<OrderConfirmationSkeleton />}>
                  <OrderConfirmationPage />
                </Suspense>
              </CustomerRoute>
            }
          />
          <Route
            path="/track-order"
            element={
              <CustomerRoute>
                <Suspense fallback={<TrackOrderSkeleton />}>
                  <TrackOrderPage />
                </Suspense>
              </CustomerRoute>
            }
          />

          {/* Public info routes */}
          <Route
            path="/blog"
            element={
              <Suspense fallback={<BlogListSkeleton />}>
                <BlogsPage />
              </Suspense>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <Suspense fallback={<BlogPostSkeleton />}>
                <BlogDetailsPage />
              </Suspense>
            }
          />
          <Route
            path="/contact"
            element={
              <Suspense fallback={<ContactSkeleton />}>
                <ContactPage />
              </Suspense>
            }
          />
          <Route
            path="/faq"
            element={
              <Suspense fallback={<FaqSkeleton />}>
                <FAQPage />
              </Suspense>
            }
          />

          {/* Protected authenticated-customer routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Suspense fallback={<ProfileSkeleton />}>
                  <ProfilePage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Suspense fallback={<NotificationsSkeleton />}>
                  <NotificationsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <Suspense fallback={<NotificationsSkeleton />}>
                  <AnnouncementsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/newsletter/confirm"
            element={
              <Suspense fallback={<CenteredCardSkeleton />}>
                <NewsletterActionPage />
              </Suspense>
            }
          />
          <Route
            path="/newsletter/unsubscribe"
            element={
              <Suspense fallback={<CenteredCardSkeleton />}>
                <NewsletterActionPage />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<RouteSkeleton />}>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Routes>
      </ErrorBoundary>

      <ErrorBoundary>
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default App;
