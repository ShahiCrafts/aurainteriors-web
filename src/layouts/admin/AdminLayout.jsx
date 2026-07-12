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
} from "lucide-react";
import NotificationBell from "../../components/common/NotificationBell";
import ConfirmationDialog from "../../components/modals/ConfirmationDialog";
import useAuthStore from "../../store/authStore";
import useAdminNotificationSocket from "../../hooks/admin/useAdminNotificationSocket";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
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

  const token = useMemo(() => localStorage.getItem("token"), []);

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

  const handleSignOut = () => {
    signOut();
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
      {/* Sidebar Overlay (mobile) - covers full screen including header */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - starts from the very top of the page */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-100 z-50 transform transition-all duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } ${isCollapsed ? "w-20" : "w-72"}`}
      >
        <div className="flex flex-col h-full relative">
          <div
            className={`w-full flex items-center border-b border-gray-100 ${isCollapsed
              ? "justify-center h-20 px-0"
              : "justify-between h-20 px-5"
              }`}
          >
            {!isCollapsed && (
              <Link to="/dashboard" className="flex items-center min-w-0 shrink">
                <img
                  src="/admin-logo.png"
                  alt="Aura"
                  className="w-48 h-auto object-contain transition-all duration-300"
                />
              </Link>
            )}

            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-2 rounded-lg text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700 transition-colors shrink-0"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar pb-28 pt-8">
            {menuGroups.map((group) => (
              <div key={group.title}>
                {!isCollapsed ? (
                  <h3 className="px-5 text-[12px] font-medium text-gray-400 uppercase mb-3 truncate">
                    {group.title}
                  </h3>
                ) : (
                  <div className="h-px bg-gray-100 my-4 mx-2" />
                )}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.id}
                      item={item}
                      active={isActive(item.path)}
                      isCollapsed={isCollapsed}
                      onClick={() => setMobileMenuOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Top Navbar - sits only to the right of the sidebar, not full width */}
      <header
        className={`fixed top-0 right-0 left-0 h-20 bg-white border-b border-gray-100 z-30 flex items-center gap-4 px-4 sm:px-6 transition-all duration-300 ease-in-out ${isCollapsed ? "lg:left-20" : "lg:left-72"
          }`}
      >
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 -ml-2 text-gray-600 shrink-0"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Search bar */}
        <div className="hidden md:flex w-110">
          <div className="relative w-full">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search customers, orders, products, conversations..."
              className="w-full pl-10 pr-14 py-2.5 bg-gray-100/90 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 bg-white border border-gray-200 rounded-md px-1.5 py-0.5">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-3 sm:gap-4 ml-auto">
          {/* Online / Offline status */}
          <div className="relative hidden sm:block" ref={statusRef}>
            <button
              onClick={() => setStatusMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100/90 transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${onlineStatus === "online" ? "bg-emerald-500" : "bg-gray-400"
                  }`}
              />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {onlineStatus}
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {statusMenuOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-lg py-1.5 z-50">
                <button
                  onClick={() => {
                    setOnlineStatus("online");
                    setStatusMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Online
                </button>
                <button
                  onClick={() => {
                    setOnlineStatus("offline");
                    setStatusMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  Offline
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <NotificationBell user={user} token={token} />

          <div className="h-8 w-px bg-gray-100 hidden sm:block" />

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 pl-1 rounded-xl hover:bg-gray-50 py-1.5 pr-2 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-600/10 flex items-center justify-center text-teal-700 font-bold text-sm border border-teal-100 shrink-0">
                {user?.firstName?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="text-right hidden xl:block">
                <p className="text-[14px] font-bold text-gray-900 leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] font-bold text-teal-600 mt-1 uppercase tracking-wider">
                  Administrator
                </p>
              </div>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider mt-0.5">
                    Administrator
                  </p>
                </div>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setHelpModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <HelpCircle size={16} />
                  Help & Support
                </button>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setPolicyModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <ShieldCheck size={16} />
                  Privacy & Policies
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setLogoutModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50/50"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area - no padding here, each page controls its own */}
      <div
        className={`min-h-screen pt-20 transition-all duration-300 ease-in-out ${isCollapsed ? "lg:ml-20" : "lg:ml-72"
          }`}
      >
        <main className="min-h-[calc(100vh-5rem)]">
          <Outlet />
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
                    let targetUrl = toast.actionUrl.replace("/admin", "/dashboard");
                    const orderId = toast.data?.orderId;
                    if (orderId) {
                      targetUrl += `?highlight=${orderId}`;
                    }
                    navigate(targetUrl);
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setHelpModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <HelpCircle size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Help & Support</h3>
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
          </div>
        </div>
      )}

      {/* Privacy & Policy Terms Modal */}
      {policyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setPolicyModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Privacy & Policies</h3>
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
          </div>
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

function NavLink({ item, active, isCollapsed, onClick }) {
  return (
    <Link
      to={item.path}
      onClick={onClick}
      title={isCollapsed ? item.label : undefined}
      className={`group flex items-center px-4.5 py-2.5 mx-2.5 rounded-lg transition-all duration-200 relative overflow-hidden focus:outline-none ${isCollapsed ? "justify-center gap-0 px-2" : "gap-3.5"} ${active
        ? "bg-teal-50 text-teal-700 font-semibold"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
        }`}
    >

      <item.icon
        className={`w-5 h-5 shrink-0 transition-all duration-200 ${active ? "text-teal-600" : "text-gray-400 group-hover:text-gray-700"
          }`}
        strokeWidth={active ? 2.5 : 2}
      />

      {!isCollapsed && (
        <span className="flex-1 text-[15px] tracking-tight truncate">
          {item.label}
        </span>
      )}
    </Link>
  );
}