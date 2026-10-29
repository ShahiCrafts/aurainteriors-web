import { formatDate } from "../../utils/formatDate";
import { useState } from "react";
import { Download, DollarSign, ShoppingBag, Box, Users } from "lucide-react";
import { DashboardSkeleton } from "../../components/common/Skeleton";
import {
  useDashboardStats,
  useRevenueAnalytics,
  useCategorySales,
  useTopProducts,
} from "../../hooks/admin/useAnalyticsTan";
import { useAllOrders } from "../../hooks/order/useOrderTan";
import useAuthStore from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";
import { formatNPR } from "../../utils/formatCurrency";
import {
  dashboardReportData,
  downloadExcel,
} from "../../utils/adminExcelExport";
import { Suspense, lazy } from "react";

// Extracted Components
import StatCard from "../../components/admin/dashboard/StatCard";
// PERF-021: recharts (vendor-charts) loads after the dashboard shell paints.
const RevenueChart = lazy(
  () => import("../../components/admin/dashboard/RevenueChart"),
);
import {
  revenuePeriodDays,
  DEFAULT_REVENUE_PERIOD,
} from "../../utils/revenuePeriod";
const CategorySalesChart = lazy(
  () => import("../../components/admin/dashboard/CategorySalesChart"),
);
import SupportOverview from "../../components/admin/dashboard/SupportOverview";
import RecentOrdersTable from "../../components/admin/dashboard/RecentOrdersTable";
import AIInsights from "../../components/admin/dashboard/AIInsights";
import QuickActions from "../../components/admin/dashboard/QuickActions";

export default function Dashboard() {
  const { user } = useAuthStore(useShallow((state) => ({ user: state.user })));
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const [revenuePeriod, setRevenuePeriod] = useState(DEFAULT_REVENUE_PERIOD);
  const { data: revenueData, isLoading: revenueLoading } = useRevenueAnalytics(
    revenuePeriodDays(revenuePeriod),
  );
  const { data: categoryData, isLoading: categoryLoading } = useCategorySales();
  const { data: topProductsData, isLoading: productsLoading } =
    useTopProducts();
  const { data: recentOrdersData, isLoading: ordersLoading } = useAllOrders({
    limit: 6,
  });

  const stats = statsData?.data || {
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
  };

  const chartData = revenueData?.data?.chartData || [];
  const pieData = categoryData?.data?.salesByCategory || [];
  const recentOrders = recentOrdersData?.data?.orders || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleDownloadReport = async () => {
    try {
      const topProducts = topProductsData?.data?.topProducts || [];
      const sheets = dashboardReportData({
        stats,
        topProducts,
        recentOrders,
        formatDate,
      });
      const fileName = `Aura_Interiors_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
      await downloadExcel(sheets, fileName);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    }
  };

  const formatRevenue = (amount) => {
    if (amount >= 100000) {
      return `NPR ${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `NPR ${(amount / 1000).toFixed(0)}K`;
    }
    return formatNPR(amount);
  };
  const statCards = [
    {
      label: "Net Revenue",
      value: formatRevenue(stats.totalRevenue),
      icon: DollarSign,
      color: "emerald",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      color: "blue",
    },
    {
      label: "Products",
      value: stats.totalProducts,
      icon: Box,
      color: "orange",
    },
    {
      label: "Customers",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "purple",
    },
  ];

  if (
    statsLoading ||
    revenueLoading ||
    categoryLoading ||
    productsLoading ||
    ordersLoading
  ) {
    return (
      <div className="p-6 space-y-5">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!statsData || !revenueData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-gray-500">
        <p>Failed to load dashboard data.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-6 space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {getGreeting()}, {user?.firstName || "Admin"}
            <span role="img" aria-label="wave">
              👋
            </span>
          </h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Here's what's happening with your store today.
          </p>
        </div>
        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-5">
        <Suspense
          fallback={
            <div className="animate-pulse bg-neutral-100 rounded-xl min-h-64" aria-hidden="true" />
          }
        >
          <RevenueChart
            data={chartData}
            period={revenuePeriod}
            onPeriodChange={setRevenuePeriod}
          />
        </Suspense>
        <Suspense
          fallback={
            <div className="animate-pulse bg-neutral-100 rounded-xl min-h-64" aria-hidden="true" />
          }
        >
          <CategorySalesChart data={pieData} />
        </Suspense>
        <SupportOverview />
      </div>

      {/* Bottom Section: Recent Orders (2 cols) + AI Insights / Quick Actions (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RecentOrdersTable orders={recentOrders} />
        </div>
        <div className="flex flex-col gap-6">
          <AIInsights />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
