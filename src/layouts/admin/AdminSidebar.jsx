import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

function NavLink({ item, active, isCollapsed, onClick }) {
  return (
    <Link
      to={item.path}
      onClick={onClick}
      title={isCollapsed ? item.label : undefined}
      className={`group flex items-center px-4.5 py-2.5 mx-2.5 rounded-lg transition-all duration-200 relative overflow-hidden focus:outline-none ${isCollapsed ? "justify-center gap-0 px-2" : "gap-3.5"} ${
        active
          ? "bg-teal-50 text-teal-700 font-semibold"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
      }`}
    >
      <item.icon
        className={`w-5 h-5 shrink-0 transition-all duration-200 ${
          active ? "text-teal-600" : "text-gray-400 group-hover:text-gray-700"
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

// Phase 7 split (from AdminLayout.jsx) — the admin sidebar: mobile
// scrim + collapsible nav rail. Markup moved verbatim; state stays
// in AdminLayout and arrives as props. (The scrim is the backdrop
// for the always-mounted nav drawer, not a modal — Phase 6 note.)
export default function AdminSidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
  isCollapsed,
  toggleCollapse,
  menuGroups,
  isActive,
}) {
  return (
    <>
      {/* Sidebar Overlay (mobile) - covers full screen including header */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - starts from the very top of the page */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-100 z-50 transform transition-all duration-300 ease-in-out ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "w-20" : "w-72"}`}
      >
        <div className="flex flex-col h-full relative">
          <div
            className={`w-full flex items-center border-b border-gray-100 ${
              isCollapsed
                ? "justify-center h-20 px-0"
                : "justify-between h-20 px-5"
            }`}
          >
            {!isCollapsed && (
              <Link
                to="/dashboard"
                className="flex items-center min-w-0 shrink"
              >
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
              {isCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
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
    </>
  );
}
