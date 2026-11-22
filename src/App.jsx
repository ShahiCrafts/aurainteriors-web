import { Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { dismissSplash } from "./lib/splash";
import "./styles/index.css";
import ErrorBoundary from "./components/common/ErrorBoundary";
import useSiteSettingsStore from "./store/siteSettingsStore";
import SiteSettingsEffects from "./components/common/SiteSettingsEffects";
import MaintenancePage, { useMaintenanceMode } from "./pages/info/MaintenancePage";

import {
  RouteSkeleton,
  CatalogPageSkeleton,
  ProductDetailsSkeleton,
  HomeSkeleton,
  CheckoutSkeleton,
  ProfileSkeleton,
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
const ContentPage = lazy(() => import("./pages/info/ContentPage"));
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
  const { enabled: maintenanceEnabled } = useMaintenanceMode();
  // First commit is on screen: the branded splash has done its job.
  // Exception: the auth return routes (/auth/success, /auth/verify) keep
  // the splash up until sign-in completes — those pages dismiss it
  // themselves right before navigating home. Without this, the splash
  // faded out on mount and revealed a SECOND loading screen underneath
  // (the auth page's own loader), so users saw two loaders in a row
  // after login.
  useEffect(() => {
    // Batch 3b: kick off the public site-settings load once. The store
    // starts at built-in defaults identical to today's site, so this
    // never blocks or changes first paint; it only swaps values if the
    // server answers with admin-edited settings.
    useSiteSettingsStore.getState().load();
    if (window.location.pathname.startsWith("/auth/")) return;
    dismissSplash();
  }, []);
  if (maintenanceEnabled) {
    return (
      <>
        <SiteSettingsEffects />
        <MaintenancePage />
      </>
    );
  }
  return (
    <>
      <SiteSettingsEffects />
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
          {/* Batch 3b (NEW): static content pages the footer has always
              linked to — they 404'd before this batch. Copy comes from
              site settings (pages.*). */}
          <Route
            path="/about"
            element={
              <Suspense fallback={<RouteSkeleton />}>
                <ContentPage title="About Us" settingsKey="about" path="/about" />
              </Suspense>
            }
          />
          <Route
            path="/privacy"
            element={
              <Suspense fallback={<RouteSkeleton />}>
                <ContentPage
                  title="Privacy Policy"
                  settingsKey="privacyPolicy"
                  path="/privacy"
                />
              </Suspense>
            }
          />
          <Route
            path="/terms"
            element={
              <Suspense fallback={<RouteSkeleton />}>
                <ContentPage
                  title="Terms & Conditions"
                  settingsKey="terms"
                  path="/terms"
                />
              </Suspense>
            }
          />
          <Route
            path="/shipping"
            element={
              <Suspense fallback={<RouteSkeleton />}>
                <ContentPage
                  title="Shipping & Delivery"
                  settingsKey="shippingReturns"
                  path="/shipping"
                />
              </Suspense>
            }
          />
          <Route
            path="/returns"
            element={
              <Suspense fallback={<RouteSkeleton />}>
                <ContentPage
                  title="Returns & Refunds"
                  settingsKey="shippingReturns"
                  path="/returns"
                />
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
