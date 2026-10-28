import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import "./styles/index.css";

// ─── Admin components — only imported in this file ───────────────────────────
// This file is ONLY loaded by the admin entry point (main.admin.jsx).
// The customer entry point (main.jsx) never references this file,
// so Rollup emits zero bytes of these modules into the customer bundle.
// ─────────────────────────────────────────────────────────────────────────────
import AdminRoute from "./components/auth/AdminRoute";

import AdminLoginPage from "./pages/admin/AdminLoginPage";
const AdminLayout = lazy(() => import("./layouts/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminAttributes = lazy(() => import("./pages/admin/Attributes"));
const AdminProductTypes = lazy(() => import("./pages/admin/ProductTypes"));
const AdminRooms = lazy(() => import("./pages/admin/Rooms"));
const AdminCollections = lazy(() => import("./pages/admin/Collections"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminDiscounts = lazy(() => import("./pages/admin/Discounts"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const AdminPromotions = lazy(() => import("./pages/admin/Promotions"));
const AdminAnnouncements = lazy(() => import("./pages/admin/Announcements"));
const AdminSupportChats = lazy(() => import("./pages/admin/SupportChats"));
const AdminKnowledgeBase = lazy(() => import("./pages/admin/KnowledgeBase"));
const AdminContacts = lazy(() => import("./pages/admin/Contacts"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const NotFoundPage = lazy(() => import("./pages/info/NotFoundPage"));

import Skeleton, { DashboardSkeleton } from "./components/common/Skeleton";

function AdminPageSkeleton() {
  return (
    <div
      className="p-8 min-h-screen bg-neutral-50 font-dm-sans space-y-6"
      aria-busy="true"
    >
      <span role="status" className="sr-only">
        Loading…
      </span>
      <div
        className="flex justify-between items-center pb-6 border-b border-neutral-200"
        aria-hidden="true"
      >
        <Skeleton className="w-48 h-8 rounded-lg" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
      <DashboardSkeleton />
    </div>
  );
}

export default function AdminApp() {
  return (
    <div className="admin-theme min-h-screen">
      <Routes>
        {/* Root redirect → /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public admin login */}
        <Route path="/login" element={<AdminLoginPage />} />

        {/* Protected admin dashboard group — requires valid admin JWT */}
        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminLayout />
              </Suspense>
            </AdminRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminDashboard />
              </Suspense>
            }
          />
          <Route
            path="categories"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminCategories />
              </Suspense>
            }
          />
          <Route
            path="attributes"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminAttributes />
              </Suspense>
            }
          />
          <Route
            path="product-types"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminProductTypes />
              </Suspense>
            }
          />
          <Route
            path="rooms"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminRooms />
              </Suspense>
            }
          />
          <Route
            path="collections"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminCollections />
              </Suspense>
            }
          />
          <Route
            path="products"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminProducts />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminOrders />
              </Suspense>
            }
          />
          <Route
            path="discounts"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminDiscounts />
              </Suspense>
            }
          />
          <Route
            path="promotions"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminPromotions />
              </Suspense>
            }
          />
          <Route
            path="announcements"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminAnnouncements />
              </Suspense>
            }
          />
          <Route
            path="reviews"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminReviews />
              </Suspense>
            }
          />
          <Route
            path="support"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminSupportChats />
              </Suspense>
            }
          />
          <Route
            path="knowledge"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminKnowledgeBase />
              </Suspense>
            }
          />
          <Route
            path="contacts"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminContacts />
              </Suspense>
            }
          />
          <Route
            path="users"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminUsers />
              </Suspense>
            }
          />
        </Route>

        {/* Catch-all 404 */}
        <Route
          path="*"
          element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
    </div>
  );
}
