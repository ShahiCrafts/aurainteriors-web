import { useState, useMemo, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Bell,
  Menu,
  X,
  Tag,
  MessageSquare,
  Percent,
  LogOut,
  Megaphone,
  Headphones,
  Mail,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Layers,
  DoorOpen,
  LayoutGrid,
} from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import NotificationBell from "../../components/common/NotificationBell";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import ConfirmationDialog from "../../components/modals/ConfirmationDialog";
import Dialog from "../../components/common/Dialog";
import useAuthStore from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";
import useAdminNotificationSocket from "../../hooks/admin/useAdminNotificationSocket";
import { safeActionUrl } from "../../utils/safeUrl";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore(useShallow((state) => ({ user: state.user, token: state.token, logout: state.logout })));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("admin_sidebar_collapsed") === "true";
  });

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState("online");
  const [searchValue, setSearchValue] = useState("");

  const profileRef = useRef(null);
  const statusRef = useRef(null);
  const searchInputRef = useRef(null);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin_sidebar_collapsed", String(next));
      return next;
    });
  };



  // Admin notification socket hook
  const {
    adminNotifications,
    unreadAdminCount,
    getNotificationIcon,
    dismissNotification,
  } = useAdminNotificationSocket(token, user?._id || user?.id, user?.role);

  // Show toast when new admin notification arrives
  useEffect(() => {
    if (adminNotifications.length > 0) {
      const latestNotification = adminNotifications[0];
      if (latestNotification.timestamp) {
        const notificationTime = new Date(latestNotification.timestamp).getTime();
        const now = Date.now();
        if (now - notificationTime < 5000) {
          addToast(latestNotification);
        }
      }
    }
  }, [adminNotifications.length]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cmd/Ctrl + K focuses the search bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Add toast notification
  const addToast = (notification) => {
    const toastId = Date.now();
    setToasts((prev) => [...prev, { ...notification, id: toastId }]);

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 5000);
  };

  // Remove toast
  const removeToast = (toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  const handleSignOut = async () => {
    try { await logout(); } catch { return; }
    setLogoutModalOpen(false);
    navigate("/");
  };

  const menuGroups = [
    {
      title: "Overview",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          path: "/dashboard",
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          id: "products",
          label: "Products",
          icon: Package,
          path: "/dashboard/products",
        },
        {
          id: "categories",
          label: "Categories",
          icon: Tag,
          path: "/dashboard/categories",
        },
        {
          id: "attributes",
          label: "Attributes",
          icon: SlidersHorizontal,
          path: "/dashboard/attributes",
        },
        {
          id: "product-types",
          label: "Product Types",
          icon: Layers,
          path: "/dashboard/product-types",
        },
        {
          id: "rooms",
          label: "Rooms",
          icon: DoorOpen,
          path: "/dashboard/rooms",
        },
        {
          id: "collections",
          label: "Collections",
          icon: LayoutGrid,
          path: "/dashboard/collections",
        },
        {
          id: "orders",
          label: "Orders",
          icon: ShoppingCart,
          path: "/dashboard/orders",
        },
        { id: "users", label: "Users", icon: Users, path: "/dashboard/users" },
      ],
    },
    {
      title: "Communication",
      items: [
        {
          id: "support",
          label: "Support Chat",
          icon: Headphones,
          path: "/dashboard/support",
        },
        {
          id: "knowledge",
          label: "Knowledge Base",
          icon: BookOpen,
          path: "/dashboard/knowledge",
        },
        {
          id: "contacts",
          label: "Contacts",
          icon: Mail,
          path: "/dashboard/contacts",
        },
        {
          id: "reviews",
          label: "Reviews",
          icon: MessageSquare,
          path: "/dashboard/reviews",
        },
      ],
    },
    {
      title: "Marketing",
      items: [
        {
          id: "discounts",
          label: "Discounts",
          icon: Percent,
          path: "/dashboard/discounts",
        },
        {
          id: "promotions",
          label: "Promotions",
          icon: Megaphone,
          path: "/dashboard/promotions",
        },
        {
          id: "announcements",
          label: "Announcements",
          icon: Bell,
          path: "/dashboard/announcements",
        },
      ],
    },
  ];

  const isActive = (path) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50/50 font-dm-sans text-slate-900">
      <AdminSidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        menuGroups={menuGroups}
        isActive={isActive}
      />

      <AdminTopbar
        isCollapsed={isCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        searchInputRef={searchInputRef}
        statusRef={statusRef}
        statusMenuOpen={statusMenuOpen}
        setStatusMenuOpen={setStatusMenuOpen}
        onlineStatus={onlineStatus}
        setOnlineStatus={setOnlineStatus}
        user={user}
        token={token}
        profileRef={profileRef}
        profileMenuOpen={profileMenuOpen}
        setProfileMenuOpen={setProfileMenuOpen}
        setHelpModalOpen={setHelpModalOpen}
        setPolicyModalOpen={setPolicyModalOpen}
        setLogoutModalOpen={setLogoutModalOpen}
      />

      {/* Main Content Area - no padding here, each page controls its own */}
      <div
        className={`min-h-screen pt-20 transition-all duration-300 ease-in-out ${isCollapsed ? "lg:ml-20" : "lg:ml-72"
          }`}
      >
        <main className="min-h-[calc(100vh-5rem)]">
          {/* Route-level boundary (FE-56/FE-17): wraps the Outlet so a
              crashed admin page degrades in place while the admin shell
              (sidebar/header) stays alive; reset on navigation. */}
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Toast Notifications Container */}
      <div className="fixed z-50 flex flex-col gap-3 w-full max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-sm bottom-4 right-4 sm:bottom-6 sm:right-6 ml-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 animate-slide-in-right flex items-start gap-3"
            style={{
              animation: "slideInRight 0.3s ease-out",
            }}
          >
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-lg shrink-0">
              {toast.type === "order:new" && "🛒"}
              {toast.type === "order:cancelled" && "❌"}
              {toast.type === "return:requested" && "↩️"}
              {toast.type === "review:new" && "⭐"}
              {toast.type === "contact:new" && "✉️"}
              {toast.type === "chat:started" && "💬"}
              {!["order:new", "order:cancelled", "return:requested", "review:new", "contact:new", "chat:started"].includes(toast.type) && "🔔"}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {toast.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                {toast.description}
              </p>
              {toast.actionUrl && (
                <button
                  onClick={() => {
                    // FE-04: same safeActionUrl validation as
                    // NotificationBell — null means do not navigate
                    // (the toast is still dismissed).
                    const targetUrl = safeActionUrl(toast.actionUrl, {
                      highlight: toast.data?.orderId,
                      inAppOnly: true,
                    });
                    if (targetUrl) {
                      navigate(targetUrl);
                    }
                    removeToast(toast.id);
                  }}
                  className="text-xs text-teal-600 font-medium mt-1 hover:text-teal-700"
                >
                  View Details →
                </button>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Help Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Dialog open={helpModalOpen} onClose={() => setHelpModalOpen(false)} labelledBy="admin-help-title" className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setHelpModalOpen(false)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <HelpCircle size={20} />
              </div>
              <h3 id="admin-help-title" className="text-lg font-bold text-gray-900">Help & Support</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
              <p>Welcome to Aura Interiors Admin Panel. Here you can manage products, coordinate orders, and interact with customer chats.</p>
              <p>For technical inquiries or system configuration issues, please contact your systems administrator or write to <span className="font-semibold text-teal-600">admin-support@aurainteriors.com</span>.</p>
            </div>
            <button
              onClick={() => setHelpModalOpen(false)}
              className="w-full mt-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors shadow-sm text-sm"
            >
              Okay
            </button>
          </Dialog>
        </div>
      )}

      {/* Privacy & Policy Terms Modal */}
      {policyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Dialog open={policyModalOpen} onClose={() => setPolicyModalOpen(false)} labelledBy="admin-policy-title" className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setPolicyModalOpen(false)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <ShieldCheck size={20} />
              </div>
              <h3 id="admin-policy-title" className="text-lg font-bold text-gray-900">Privacy & Policies</h3>
            </div>
            <div className="space-y-4 text-xs text-gray-600 overflow-y-auto max-h-[300px] pr-2 leading-relaxed">
              <section>
                <h4 className="font-bold text-gray-800 mb-1">1. Data Confidentiality</h4>
                <p>All administrative credentials, customer information, transaction data, and conversation transcripts are strictly confidential. Staff members must secure their credentials at all times.</p>
              </section>
              <section>
                <h4 className="font-bold text-gray-800 mb-1">2. AI Copilot Guidelines</h4>
                <p>AI suggestions are meant to support support flows. Please review any generated replies or suggested text carefully before transmission to prevent incorrect policy advice.</p>
              </section>
              <section>
                <h4 className="font-bold text-gray-800 mb-1">3. Customer Information Protection</h4>
                <p>Do not export personal details or order transcripts unless authorized by a senior systems manager for troubleshooting purposes.</p>
              </section>
            </div>
            <button
              onClick={() => setPolicyModalOpen(false)}
              className="w-full mt-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors shadow-sm text-sm"
            >
              Close Policies
            </button>
          </Dialog>
        </div>
      )}

      <ConfirmationDialog
        isOpen={logoutModalOpen}
        title="Sign Out?"
        message="Are you sure you want to sign out from the admin panel?"
        onConfirm={handleSignOut}
        onCancel={() => setLogoutModalOpen(false)}
        confirmText="Sign Out"
        type="logout"
      />
    </div>
  );
}

