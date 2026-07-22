import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import "./styles/index.css";
import AuthCallback from "./components/auth/AuthCallback";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CustomerRoute from "./components/auth/CustomerRoute";

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER PORTAL — App.jsx
//
// This file is the root component for the customer build ONLY.
// It contains zero references to admin pages, layouts, or routes.
// The admin portal has its own entry point: main.admin.jsx → AdminApp.jsx
// ─────────────────────────────────────────────────────────────────────────────

const HomePage            = lazy(() => import("./pages/HomePage"));
const AuthModal           = lazy(() => import("./components/modals/AuthModal"));
const ChatWidget           = lazy(() => import("./components/chat/ChatWidget"));
const VerifyMagicLinkPage = lazy(() => import("./pages/auth/VerifyMagicLinkPage"));
const ProfilePage         = lazy(() => import("./pages/customer/ProfilePage"));
const NotificationsPage   = lazy(() => import("./pages/customer/NotificationsPage"));
const ShopPage            = lazy(() => import("./pages/shop/ShopPage"));
const BlogsPage           = lazy(() => import("./pages/blog/BlogsPage"));
const BlogDetailsPage     = lazy(() => import("./pages/blog/BlogDetailsPage"));
const ProductDetailsPage  = lazy(() => import("./pages/shop/ProductDetailsPage"));
const ARViewPage          = lazy(() => import("./pages/shop/ARViewPage"));
const NativeARPage        = lazy(() => import("./pages/shop/NativeARPage"));
const CheckoutPage        = lazy(() => import("./pages/checkout/CheckoutPage"));
const OrderConfirmationPage = lazy(() => import("./pages/customer/OrderConfirmationPage"));
const PaymentFailedPage   = lazy(() => import("./pages/checkout/PaymentFailedPage"));
const TrackOrderPage      = lazy(() => import("./pages/customer/TrackOrderPage"));
const ContactPage         = lazy(() => import("./pages/info/ContactPage"));
const FAQPage             = lazy(() => import("./pages/info/FAQPage"));
const NotFoundPage        = lazy(() => import("./pages/info/NotFoundPage"));
const AnnouncementsPage   = lazy(() => import("./pages/info/AnnouncementsPage"));

function LoadingSpinner() {
  return null;
}

function App() {
  return (
    <>
      {/* AuthModal: null fallback — renders nothing while chunk downloads */}
      <Suspense fallback={null}>
        <AuthModal />
      </Suspense>

      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <HomePage />
            </Suspense>
          }
        />

        {/* Auth Routes */}
        <Route path="/auth/verify" element={<VerifyMagicLinkPage />} />
        <Route path="/auth/success" element={<AuthCallback />} />

        {/* Customer-facing routes */}
        <Route path="/shop" element={<CustomerRoute><Suspense fallback={<LoadingSpinner />}><ShopPage /></Suspense></CustomerRoute>} />
        <Route path="/shop/:categorySlug" element={<CustomerRoute><Suspense fallback={<LoadingSpinner />}><ShopPage /></Suspense></CustomerRoute>} />
        <Route path="/product/:productSlug" element={<CustomerRoute><Suspense fallback={<LoadingSpinner />}><ProductDetailsPage /></Suspense></CustomerRoute>} />
        <Route path="/ar/:productSlug" element={<CustomerRoute><Suspense fallback={<LoadingSpinner />}><ARViewPage /></Suspense></CustomerRoute>} />
        <Route path="/native-ar" element={<CustomerRoute><Suspense fallback={<LoadingSpinner />}><NativeARPage /></Suspense></CustomerRoute>} />
        <Route path="/checkout" element={<CustomerRoute><Suspense fallback={<LoadingSpinner />}><CheckoutPage /></Suspense></CustomerRoute>} />
        <Route path="/checkout/payment-failed" element={<CustomerRoute><Suspense fallback={<LoadingSpinner />}><PaymentFailedPage /></Suspense></CustomerRoute>} />
        <Route path="/order-confirmation/:orderId" element={<CustomerRoute><Suspense fallback={<LoadingSpinner />}><OrderConfirmationPage /></Suspense></CustomerRoute>} />
        <Route path="/track-order" element={<CustomerRoute><Suspense fallback={<LoadingSpinner />}><TrackOrderPage /></Suspense></CustomerRoute>} />

        {/* Public info routes */}
        <Route path="/blog" element={<Suspense fallback={<LoadingSpinner />}><BlogsPage /></Suspense>} />
        <Route path="/blog/:slug" element={<Suspense fallback={<LoadingSpinner />}><BlogDetailsPage /></Suspense>} />
        <Route path="/contact" element={<Suspense fallback={<LoadingSpinner />}><ContactPage /></Suspense>} />
        <Route path="/faq" element={<Suspense fallback={<LoadingSpinner />}><FAQPage /></Suspense>} />

        {/* Protected authenticated-customer routes */}
        <Route path="/profile" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><ProfilePage /></Suspense></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><NotificationsPage /></Suspense></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><AnnouncementsPage /></Suspense></ProtectedRoute>} />

        {/* ⚠️  Catch-all 404 — this includes /admin, /dashboard, and any
             admin-looking path. Customers hitting those paths see a standard
             404 page. There is no login form, no hint that an admin exists. */}
        <Route path="*" element={<Suspense fallback={<LoadingSpinner />}><NotFoundPage /></Suspense>} />
      </Routes>

      {/* ChatWidget: null fallback — the FAB appears once chunk is ready */}
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </>
  );
}

export default App;
