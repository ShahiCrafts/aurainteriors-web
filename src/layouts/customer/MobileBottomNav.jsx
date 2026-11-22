import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutGrid, Heart, User } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import useAuthStore from "../../store/authStore";
import { UserAvatar } from "../../components/common/InitialsAvatar";

// Mobile bottom navigation (design mockup): Home / Categories /
// Wishlist / Profile. The fourth slot is the PROFILE AVATAR — the
// signed-in user's photo (or initials circle), a generic person icon
// when signed out — not the cart. Rendered from the Navbar so it
// appears on every customer page that carries the header; hidden
// from md up and on checkout (where it would fight the purchase
// actions). Body bottom padding for the bar's height lives in
// index.css (mobile only) so page content is never hidden behind it.
export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal, user } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      openAuthModal: state.openAuthModal,
      user: state.user,
    })),
  );

  if (location.pathname.startsWith("/checkout")) return null;

  const path = location.pathname;
  const activeTab = location.state?.activeTab;
  const homeActive = path === "/";
  const categoriesActive =
    path.startsWith("/shop") ||
    path.startsWith("/collections") ||
    path.startsWith("/rooms");
  const wishlistActive = path.startsWith("/profile") && activeTab === "wishlist";
  const profileActive = path.startsWith("/profile") && !wishlistActive;

  const itemClass = (active) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 bg-transparent border-none cursor-pointer font-dm-sans transition-colors ${
      active ? "text-brand" : "text-[#6A6058]"
    }`;
  const labelClass = (active) =>
    `text-[10px] leading-3 ${active ? "font-bold" : "font-medium"}`;

  const handleWishlist = () => {
    if (!isAuthenticated) {
      openAuthModal("login");
    } else {
      navigate("/profile", { state: { activeTab: "wishlist" } });
    }
  };

  const handleProfile = () => {
    if (!isAuthenticated) {
      openAuthModal("login");
    } else {
      navigate("/profile", { state: { activeTab: "personal-information" } });
    }
  };

  return (
    <nav
      aria-label="Mobile"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#F0EFED] font-dm-sans"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch px-2">
        <Link to="/" className={`${itemClass(homeActive)} no-underline`}>
          <Home size={22} strokeWidth={homeActive ? 2.4 : 2} />
          <span className={labelClass(homeActive)}>Home</span>
        </Link>
        <Link
          to="/shop"
          className={`${itemClass(categoriesActive)} no-underline`}
        >
          <LayoutGrid size={22} strokeWidth={categoriesActive ? 2.4 : 2} />
          <span className={labelClass(categoriesActive)}>Categories</span>
        </Link>
        <button
          type="button"
          onClick={handleWishlist}
          className={itemClass(wishlistActive)}
        >
          <Heart size={22} strokeWidth={wishlistActive ? 2.4 : 2} />
          <span className={labelClass(wishlistActive)}>Wishlist</span>
        </button>
        <button
          type="button"
          onClick={handleProfile}
          className={itemClass(profileActive)}
          aria-label="Profile"
        >
          {isAuthenticated && user ? (
            <UserAvatar
              user={user}
              className={`w-6.5 h-6.5 rounded-full text-[10px] ${
                profileActive ? "ring-2 ring-brand ring-offset-1" : ""
              }`}
            />
          ) : (
            <User size={22} strokeWidth={profileActive ? 2.4 : 2} />
          )}
          <span className={labelClass(profileActive)}>Profile</span>
        </button>
      </div>
    </nav>
  );
}
