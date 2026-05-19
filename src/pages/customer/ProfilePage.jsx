import { useState } from "react";
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
import useAuthStore from "../../store/authStore";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";
import CategoryBar from "../../components/navigation/CategoryBar";
import SavedAddresses from "../../components/profile/SavedAddresses";
import PersonalInformation from "../../components/profile/PersonalInformation";
import Wishlist from "../../components/profile/Wishlist";
import OrdersSection from "../../components/profile/OrdersSection";

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || "orders",
  );

  const navItems = [
    { id: "orders", label: "My Orders", icon: Package },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "personal-information", label: "Profile Details", icon: User },
    { id: "saved-addresses", label: "Saved Addresses", icon: MapPin },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <>
      <Navbar />
      <CategoryBar />

      <main className="min-h-screen bg-white pt-0 pb-20 font-dm-sans">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-9">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
            {/* Sidebar (Desktop) - Consistent Retail Aesthetic */}
            <aside className="hidden lg:block lg:w-64 shrink-0 pt-10 md:pt-14">
              <div className="sticky top-[120px]">
                <div className="space-y-10">
                  {/* Account Summary */}
                  <div>
                    <h3 className="text-[12px] font-black text-black/20 mb-4 uppercase tracking-[0.1em]">
                      DecorX Account
                    </h3>
                    <div className="flex items-center gap-3.5 group">
                      <div className="w-14 h-14 rounded-full bg-[#F27318] flex items-center justify-center text-white text-[15px] font-black shadow-sm">
                        {user?.firstName?.charAt(0)}
                        {user?.lastName?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[18px] font-semibold text-[#1A1714] truncate tracking-tight leading-none mb-2">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-[14px] text-black/40 font-medium truncate leading-none">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-neutral-100" />

                  {/* Navigation Links */}
                  <div>
                    <h3 className="text-[12px] font-black text-black/20 mb-6 uppercase tracking-[0.1em]">
                      Account Menu
                    </h3>
                    <nav className="flex flex-col space-y-8">
                      {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center text-[15px] transition-all duration-200 text-left tracking-tight ${
                              isActive
                                ? "text-[#F27318] font-medium"
                                : "text-[#1A1714]/60 font-medium hover:text-[#1A1714]"
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
                    className="text-[12px] font-black text-red-500/80 hover:text-red-600 transition-all duration-200 uppercase tracking-widest"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </aside>

            {/* Mobile Navigation - Simple Text Scroller */}
            <div className="lg:hidden flex items-center gap-6 overflow-x-auto no-scrollbar pt-6 pb-4 mb-8 border-b border-black/[0.03]">
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
            <div className="flex-1 pt-10 md:pt-14">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Components Container - No Cards, Just Pure Space */}
                  <div className="min-h-[500px]">
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

      <Footer />
    </>
  );
}
