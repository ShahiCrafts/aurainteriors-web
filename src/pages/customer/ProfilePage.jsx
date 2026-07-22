import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MapPin,
  User,
  Heart,
  Package,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../store/authStore";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";
import CategoryBar from "../../components/navigation/CategoryBar";
import SavedAddresses from "../../components/profile/SavedAddresses";
import PersonalInformation from "../../components/profile/PersonalInformation";
import Wishlist from "../../components/profile/Wishlist";
import OrdersSection from "../../components/profile/OrdersSection";
import { getAvatarUrl } from "../../utils/imageUrl";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || "personal-information",
  );

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab]);

  const navItems = [
    { id: "personal-information", label: "Profile Details", icon: User },
    { id: "orders", label: "My Orders", icon: Package },
    { id: "saved-addresses", label: "Saved Addresses", icon: MapPin },
    { id: "wishlist", label: "Wishlist", icon: Heart },
  ];

  const handleLogout = () => {
    logout();
    queryClient.clear();
    window.location.href = "/";
  };

  return (
    <>
      <Navbar />
      <CategoryBar />

      {/* Fixed-height, non-scrolling shell. Page never scrolls; only the right panel scrolls internally. */}
      <main className="h-[calc(100vh-138px)] bg-neutral-100 font-dm-sans overflow-hidden">
        <div className="w-full h-full">
          <div className="flex flex-col lg:flex-row items-stretch gap-6 h-full">

            {/* Left Column: Sidebar Card — truly pinned, no sticky, no scroll */}
            <aside className="w-full lg:w-[320px] xl:w-[380px] shrink-0 bg-white h-full overflow-hidden flex flex-col p-6 lg:p-8 space-y-8">
              {/* Account Summary */}
              <div>
                <h3 className="text-[15px] font-medium text-[#1A1714]/30 mb-4">
                  Aura Interiors Account
                </h3>
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-[#F27318] text-white text-[15px] font-black shadow-sm shrink-0">
                    {user?.avatar ? (
                      <img
                        src={getAvatarUrl(user)}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        {user?.firstName?.charAt(0)}
                        {user?.lastName?.charAt(0)}
                      </>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[18px] font-semibold text-[#1A1714] leading-none mb-1.5">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[15px] text-black/40 leading-none">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-neutral-100" />

              {/* Navigation Links */}
              <div>
                <h3 className="text-[15px] font-medium text-[#1A1714]/30 mb-5">
                  Account Menu
                </h3>
                <nav className="flex flex-col space-y-3">
                  {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center text-[16px] transition-all duration-200 text-left tracking-tight px-4 py-3 rounded-lg w-full font-medium ${
                          isActive
                            ? "bg-[#FFF8F2] text-[#F27318] font-bold border-l-4 border-[#F27318]"
                            : "text-[#1A1714]/60 hover:text-[#1A1714] hover:bg-neutral-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="w-full h-px bg-neutral-100" />

              {/* Actions */}
              <button
                onClick={handleLogout}
                className="text-[15px] font-semibold text-red-500/80 hover:text-red-600 transition-all duration-200 block text-left mt-auto px-4"
              >
                Sign Out
              </button>
            </aside>

            {/* Right Column: Content Panel — fills remaining height exactly, scrolls internally only if needed */}
            <div className="flex-1 w-full bg-white p-6 lg:p-8 flex flex-col h-full overflow-y-auto">
              {/* Mobile Navigation - Simple Text Scroller */}
              <div className="lg:hidden flex items-center gap-6 overflow-x-auto no-scrollbar pb-4 mb-8 border-b border-black/[0.03] shrink-0">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`text-[14px] whitespace-nowrap font-bold transition-all ${
                      activeTab === item.id
                        ? "text-[#F27318] border-b-2 border-[#F27318] pb-1"
                        : "text-black/40"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="text-[14px] whitespace-nowrap font-bold text-red-500 ml-auto"
                >
                  Logout
                </button>
              </div>

              {/* Content Section - High Fidelity Editorial Layout */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  {/* Components Container */}
                  <div className="flex-1 flex flex-col min-h-0">
                    {activeTab === "personal-information" && (
                      <PersonalInformation />
                    )}
                    {activeTab === "orders" && <OrdersSection />}
                    {activeTab === "wishlist" && <Wishlist />}
                    {activeTab === "saved-addresses" && <SavedAddresses />}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}