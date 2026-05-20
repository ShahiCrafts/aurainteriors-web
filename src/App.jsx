import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import "./styles/index.css";
import TopBar from "./layouts/customer/TopBar";
import Navbar from "./layouts/customer/Navbar";
import CategoryBar from "./components/navigation/CategoryBar";
import Hero from "./components/sections/Hero";
import FeaturedPieces from "./components/sections/FeaturedPieces";
import BlogSection from "./components/sections/BlogSection";
import Testimonials from "./components/sections/Testimonials";
import BrandMarquee from "./components/sections/BrandMarquee";
import TrustBanner from "./components/sections/TrustBanner";
import Footer from "./layouts/customer/Footer";
import AuthCallback from "./components/auth/AuthCallback";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import CustomerRoute from "./components/auth/CustomerRoute";
import useAuthStore from "./store/authStore";
import AuthModal from "./components/modals/AuthModal";

// Chat Widget
import ChatWidget from "./components/chat/ChatWidget";

// Lazy load all page components

const VerifyMagicLinkPage = lazy(() => import("./pages/auth/VerifyMagicLinkPage"));

const ProfilePage = lazy(() => import("./pages/customer/ProfilePage"));
const NotificationsPage = lazy(
  () => import("./pages/customer/NotificationsPage"),
);
const ShopPage = lazy(() => import("./pages/shop/ShopPage"));
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

// Lazy load admin components
const AdminLayout = lazy(() => import("./layouts/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminDiscounts = lazy(() => import("./pages/admin/Discounts"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const AdminPromotions = lazy(() => import("./pages/admin/Promotions"));
const AdminAnnouncements = lazy(() => import("./pages/admin/Announcements"));
const AdminSupportChats = lazy(() => import("./pages/admin/SupportChats"));
const AdminContacts = lazy(() => import("./pages/admin/Contacts"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white font-dm-sans">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F27318] mb-4"></div>
      <p className="text-[#1A1714] text-[14px] font-bold tracking-widest uppercase opacity-20">Loading</p>
    </div>
  );
}

function HomePage() {
  const { isAuthenticated, user } = useAuthStore();

  // Redirect admin users to admin dashboard
  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <>
      <TopBar />
      <Navbar />
      <CategoryBar />

      <main className="min-h-screen">
        <Hero />
        <TrustBanner />
        <FeaturedPieces />
        <BlogSection />
        <Testimonials />
        <Footer />
      </main>
    </>
  );
}

function App() {
  return (
    <>
      <AuthModal />
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Auth Routes */}
        <Route path="/auth/verify" element={<VerifyMagicLinkPage />} />

        {/* Customer-facing routes - redirect admins to admin dashboard */}
        <Route
          path="/shop"
          element={
            <CustomerRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ShopPage />
              </Suspense>
            </CustomerRoute>
          }
        />
        <Route
          path="/shop/:categorySlug"
          element={
            <CustomerRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ShopPage />
              </Suspense>
            </CustomerRoute>
          }
        />
        <Route
          path="/product/:productSlug"
          element={
            <CustomerRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ProductDetailsPage />
              </Suspense>
            </CustomerRoute>
          }
        />
        <Route
          path="/ar/:productSlug"
          element={
            <CustomerRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ARViewPage />
              </Suspense>
            </CustomerRoute>
          }
        />
        <Route
          path="/native-ar"
          element={
            <CustomerRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <NativeARPage />
              </Suspense>
            </CustomerRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <CustomerRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <CheckoutPage />
              </Suspense>
            </CustomerRoute>
          }
        />
        <Route
          path="/checkout/payment-failed"
          element={
            <CustomerRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <PaymentFailedPage />
              </Suspense>
            </CustomerRoute>
          }
        />
        <Route
          path="/order-confirmation/:orderId"
          element={
            <CustomerRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <OrderConfirmationPage />
              </Suspense>
            </CustomerRoute>
          }
        />
        <Route
          path="/track-order"
          element={
            <CustomerRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <TrackOrderPage />
              </Suspense>
            </CustomerRoute>
          }
        />

        <Route
          path="/blog"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <BlogsPage />
            </Suspense>
          }
        />
        <Route
          path="/blog/:slug"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <BlogDetailsPage />
            </Suspense>
          }
        />
        <Route
          path="/contact"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ContactPage />
            </Suspense>
          }
        />
        <Route
          path="/faq"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <FAQPage />
            </Suspense>
          }
        />



        {/* Protected customer routes - requires auth + not admin */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ProfilePage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <NotificationsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <AnnouncementsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <AdminLayout />
              </Suspense>
            </AdminRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminDashboard />
              </Suspense>
            }
          />
          <Route
            path="categories"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminCategories />
              </Suspense>
            }
          />
          <Route
            path="products"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminProducts />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminOrders />
              </Suspense>
            }
          />
          <Route
            path="discounts"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminDiscounts />
              </Suspense>
            }
          />
          <Route
            path="promotions"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminPromotions />
              </Suspense>
            }
          />
          <Route
            path="announcements"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminAnnouncements />
              </Suspense>
            }
          />
          <Route
            path="reviews"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminReviews />
              </Suspense>
            }
          />
          <Route
            path="support"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminSupportChats />
              </Suspense>
            }
          />
          <Route
            path="contacts"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminContacts />
              </Suspense>
            }
          />
          <Route
            path="users"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminUsers />
              </Suspense>
            }
          />
        </Route>

        {/* Auth Callback Route */}
        <Route path="/auth/success" element={<AuthCallback />} />

        {/* Catch-all route for 404 */}
        <Route
          path="*"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>

      {/* Chat Widget - Only for customers */}
      <ChatWidget />
    </>
  );
}

export default App;
