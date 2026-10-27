import {
  Menu,
  X,
  Search,
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import NotificationBell from "../../components/common/NotificationBell";

// Phase 7 split (from AdminLayout.jsx) — the admin topbar: mobile
// menu toggle, search, online-status menu, notification bell and
// the profile menu (Help / Privacy / Sign Out open the layout's
// Dialog modals via the setter props). Markup moved verbatim.
export default function AdminTopbar({
  isCollapsed,
  mobileMenuOpen,
  setMobileMenuOpen,
  searchValue,
  setSearchValue,
  searchInputRef,
  statusRef,
  statusMenuOpen,
  setStatusMenuOpen,
  onlineStatus,
  setOnlineStatus,
  user,
  token,
  profileRef,
  profileMenuOpen,
  setProfileMenuOpen,
  setHelpModalOpen,
  setPolicyModalOpen,
  setLogoutModalOpen,
}) {
  return (
    <>
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
    </>
  );
}
