import { Download, DollarSign, ShoppingBag, Box, Users } from 'lucide-react';
import { DashboardSkeleton } from '../../components/common/Skeleton';
import * as XLSX from 'xlsx';
import { useDashboardStats, useRevenueAnalytics, useCategorySales, useTopProducts } from '../../hooks/admin/useAnalyticsTan';
import { useAllOrders } from '../../hooks/order/useOrderTan';
import useAuthStore from '../../store/authStore';

// Extracted Components
import StatCard from '../../components/admin/dashboard/StatCard';
import RevenueChart from '../../components/admin/dashboard/RevenueChart';
import CategorySalesChart from '../../components/admin/dashboard/CategorySalesChart';
import SupportOverview from '../../components/admin/dashboard/SupportOverview';
import RecentOrdersTable from '../../components/admin/dashboard/RecentOrdersTable';
import AIInsights from '../../components/admin/dashboard/AIInsights';
import QuickActions from '../../components/admin/dashboard/QuickActions';

// Generates a small, stable (non-random) trend shape around a base value.
// Used only for metrics that don't yet have a real historical series.
function generatePlaceholderSparkline(baseValue, trendUp, points = 7) {
  const safeBase = Math.max(baseValue, 1);
  return Array.from({ length: points }, (_, i) => {
    const progress = i / (points - 1);
    const wave = Math.sin((i + safeBase) * 1.3) * 0.08;
    const direction = trendUp ? progress * 0.25 : -progress * 0.25;
    return Math.round(safeBase * (0.85 + direction + wave));
  });
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: revenueData, isLoading: revenueLoading } = useRevenueAnalytics(30);
  const { data: categoryData, isLoading: categoryLoading } = useCategorySales();
  const { data: topProductsData, isLoading: productsLoading } = useTopProducts();
  const { data: recentOrdersData, isLoading: ordersLoading } = useAllOrders({ limit: 6 });

  const stats = statsData?.data || {
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0
  };

  const chartData = revenueData?.data?.chartData || [];
  const pieData = categoryData?.data?.salesByCategory || [];
  const recentOrders = recentOrdersData?.data?.orders || [];

  // Real trend: last 7 days of actual revenue data
  const revenueSparkline = chartData.slice(-7).map((d) => d.revenue);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleDownloadReport = () => {
    try {
      const overviewData = [
        { Metric: 'Net Revenue', Value: stats.totalRevenue },
        { Metric: 'Total Orders', Value: stats.totalOrders },
        { Metric: 'Total Products', Value: stats.totalProducts },
        { Metric: 'Total Customers', Value: stats.totalUsers },
      ];

      const topProducts = topProductsData?.data?.topProducts || [];
      const productsData = topProducts.map(p => ({
        Name: p.name,
        Deals: p.sales,
        'Total Value': p.revenue,
      }));

      const ordersData = recentOrders.map(o => ({
        'Order ID': o.orderId,
        Customer: o.user?.fullName || o.guestInfo?.firstName || 'Guest',
        Status: o.orderStatus,
        Total: o.total,
        Date: new Date(o.createdAt).toLocaleDateString(),
      }));

      const wb = XLSX.utils.book_new();
      const wsOverview = XLSX.utils.json_to_sheet(overviewData);
      const wsProducts = XLSX.utils.json_to_sheet(productsData);
      const wsOrders = XLSX.utils.json_to_sheet(ordersData);

      XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Top Products');
      XLSX.utils.book_append_sheet(wb, wsOrders, 'Recent Orders');

      const fileName = `Aura_Interiors_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const formatRevenue = (amount) => {
    if (amount >= 100000) {
      return `NRs. ${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `NRs. ${(amount / 1000).toFixed(0)}K`;
    }
    return `NRs. ${amount.toLocaleString()}`;
  };

  const statCards = [
    {
      label: 'Net Revenue',
      value: formatRevenue(stats.totalRevenue),
      trend: '+0.4%',
      trendUp: true,
      trendLabel: 'vs last month',
      icon: DollarSign,
      color: 'emerald',
      sparklineData: revenueSparkline.length > 1 ? revenueSparkline : generatePlaceholderSparkline(stats.totalRevenue, true),
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      trend: '+32%',
      trendUp: true,
      trendLabel: 'vs last quarter',
      icon: ShoppingBag,
      color: 'blue',
      sparklineData: generatePlaceholderSparkline(stats.totalOrders, true),
    },
    {
      label: 'Products',
      value: stats.totalProducts,
      trend: '71%',
      trendUp: true,
      trendLabel: 'Goal: 100',
      icon: Box,
      color: 'orange',
      sparklineData: generatePlaceholderSparkline(stats.totalProducts, true),
    },
    {
      label: 'Customers',
      value: stats.totalUsers.toLocaleString(),
      trend: '+11%',
      trendUp: true,
      trendLabel: 'vs last quarter',
      icon: Users,
      color: 'purple',
      sparklineData: generatePlaceholderSparkline(stats.totalUsers, true),
    },
  ];

  if (statsLoading || revenueLoading || categoryLoading || productsLoading || ordersLoading) {
    return (
      <div className="p-6 space-y-5">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!statsData || !revenueData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
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
            {getGreeting()}, {user?.firstName || 'Admin'}
            <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className="text-gray-500 mt-0.5 text-sm">Here's what's happening with your store today.</p>
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

      {/* Main Charts Section - Sales Overview, Sales by Category, Support Overview */}
      {/* Main Charts Section - Sales Overview, Sales by Category, Support Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-5">
        <RevenueChart data={chartData} />
        <CategorySalesChart data={pieData} />
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