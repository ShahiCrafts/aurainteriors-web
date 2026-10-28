import { useState, useEffect, useRef, Suspense, lazy } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Package,
  MapPin,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import Skeleton, {
  WishlistActionSkeleton,
  CartActionSkeleton,
  ProfileActionSkeleton,
  ProfileMenuHeaderSkeleton,
} from "../../components/common/Skeleton";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";
import useGuestCartStore from "../../store/guestCartStore";
import { useCart } from "../../hooks/cart/useCartTan";
import { useWishlist } from "../../hooks/cart/useWishlistTan";
import useDebounce from "../../hooks/useDebounce";
import { useProducts } from "../../hooks/product/useProductTan";
import { getProductImageUrl } from "../../utils/imageUrl";
import { UserAvatar } from "../../components/common/InitialsAvatar";
import { formatNPR } from "../../utils/formatCurrency";

const CartSlider = lazy(() => import("../../components/cart/CartSlider"));

export default function Navbar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartEverOpened, setCartEverOpened] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const queryClient = useQueryClient();
  const { isAuthenticated, logout, openAuthModal, user } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      logout: state.logout,
      openAuthModal: state.openAuthModal,
      user: state.user,
    })),
  );
  const { data: cartData, isLoading: isCartLoading } = useCart({
    enabled: isAuthenticated,
  });
  const { data: wishlistData, isLoading: isWishlistLoading } = useWishlist({
    enabled: isAuthenticated,
  });
  const { items: guestCartItems } = useGuestCartStore(
    useShallow((state) => ({ items: state.items })),
  );

  const cartCount = isAuthenticated
    ? cartData?.data?.cart?.totalItems || 0
    : guestCartItems.reduce((sum, item) => sum + item.quantity, 0);

  const wishlistCount = wishlistData?.data?.wishlist?.itemCount || 0;

  const showCartSkeleton = isAuthenticated && isCartLoading;
  const showWishlistSkeleton = isAuthenticated && isWishlistLoading;
  const showProfileSkeleton = isAuthenticated && !user;

  const [searchInput, setSearchInput] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);
  const searchRef = useRef(null);

  const { data: searchResultsData, isLoading: isSearchLoading } = useProducts(
    { search: debouncedSearch, limit: 5, status: "active" },
    { enabled: debouncedSearch.length >= 2 },
  );

  const searchResults = searchResultsData?.data?.products || [];

  const showDropdown =
    isSearchFocused && debouncedSearch.length >= 2 && !isSearchLoading;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchInput.trim())}`);
      setIsSearchFocused(false);
    }
  };

  const handleOpenCart = () => {
    setIsCartOpen(true);
    if (!cartEverOpened) setCartEverOpened(true);
  };

  const profileMenuItems = [
    {
      label: "My Profile",
      icon: <User size={16} />,
      path: "/profile",
      state: { activeTab: "personal-information" },
    },
    {
      label: "My Wishlist",
      icon: <Heart size={16} />,
      path: "/profile",
      state: { activeTab: "wishlist" },
    },
    {
      label: "My Orders",
      icon: <Package size={16} />,
      path: "/profile",
      state: { activeTab: "orders" },
    },
    {
      label: "Saved Addresses",
      icon: <MapPin size={16} />,
      path: "/profile",
      state: { activeTab: "saved-addresses" },
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      return;
    }
    queryClient.clear();
    setIsProfileOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-[#F0EFED] font-dm-sans">
        <div className="px-4 md:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-3 md:gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 md:gap-[11px] cursor-pointer shrink-0 select-none no-underline"
          >
            <img
              src="/logo.png"
              alt="AuraInteriors Logo"
              className="h-8 md:h-10 w-auto object-contain"
            />
          </Link>

          <div
            ref={searchRef}
            className="hidden md:block flex-1 max-w-[560px] relative"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search furniture, décor, colours…"
                className="w-full py-[11px] pr-[100px] pl-11 border-[1.5px] border-neutral-300 rounded-[10px] bg-[#FAFAFA] font-sans text-[14px] text-neutral-400 focus:outline-none transition-all duration-220 focus:border-brand focus:bg-white placeholder:text-[#B8B4AE]"
              />
              <div className="absolute right-[5px] top-1/2 -translate-y-1/2 flex items-center gap-2">
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="p-1 text-[#B8B4AE] hover:text-[#1A1714] transition-colors bg-transparent border-none cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
                {isSearchLoading && (
                  <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                )}
                <button
                  type="submit"
                  className="bg-brand hover:bg-brand-hover text-white border-none rounded-lg px-[18px] py-[7px] font-sans text-[13.5px] font-semibold cursor-pointer transition-colors duration-200"
                >
                  Search
                </button>
              </div>
            </form>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#F0EFED] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-[420px] overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="p-3 border-b border-[#F0EFED] bg-[#FAFAFA]">
                        <span className="text-[11px] font-bold text-[#B8B4AE] uppercase tracking-wider">
                          Product Results
                        </span>
                      </div>
                      <div className="py-1">
                        {searchResults.map((product) => (
                          <Link
                            key={product._id}
                            to={`/product/${encodeURIComponent(product.slug)}`}
                            onClick={() => setIsSearchFocused(false)}
                            className="flex items-center gap-4 px-4 py-3 hover:bg-[#F9F8F6] transition-colors no-underline group"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F6F6F6] shrink-0 border border-[#F0EFED]">
                              <img
                                src={getProductImageUrl(product)}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[14px] font-bold text-[#1A1714] truncate mb-0.5">
                                {product.name}
                              </h4>
                              <p className="text-[12px] text-[#8C8782] truncate">
                                {product.category?.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[14px] font-bold text-brand">
                                {formatNPR(product.price)}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link
                        to={`/shop?search=${encodeURIComponent(debouncedSearch)}`}
                        onClick={() => setIsSearchFocused(false)}
                        className="flex items-center justify-center p-4 border-t border-[#F0EFED] text-[13px] font-bold text-[#1A1714] hover:text-brand transition-colors no-underline bg-[#FAFAFA]"
                      >
                        See all results for "{debouncedSearch}"
                      </Link>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-[#F9F8F6] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search size={20} className="text-[#B8B4AE]" />
                      </div>
                      <p className="text-[14px] font-medium text-[#1A1714]">
                        No products found for "{debouncedSearch}"
                      </p>
                      <p className="text-[12px] text-[#8C8782] mt-1">
                        Try searching for something else
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-[18px] shrink-0 text-[#1A1714]">
            <button className="bg-transparent border-none p-0 flex items-center justify-center cursor-pointer text-[#1A1714] hover:text-brand transition-colors">
              <Bell size={22} />
            </button>
            <button className="bg-transparent border-none p-0 flex items-center justify-center cursor-pointer text-[#1A1714] hover:text-brand transition-colors">
              <Search size={22} />
            </button>
            <button className="bg-transparent border-none p-0 flex items-center justify-center cursor-pointer text-[#1A1714] hover:text-brand transition-colors">
              <Menu size={24} />
            </button>
          </div>

          <div className="hidden md:flex items-start gap-1.5 shrink-0">
            {showWishlistSkeleton ? (
              <WishlistActionSkeleton />
            ) : (
              <button
                onClick={() =>
                  !isAuthenticated
                    ? openAuthModal("login")
                    : navigate("/profile", { state: { activeTab: "wishlist" } })
                }
                className="flex flex-col items-center gap-1 px-2 md:px-3.5 py-1.5 rounded-[10px] cursor-pointer transition-colors duration-180 text-[#6A6058] hover:text-[#1A1714] border-none bg-transparent font-sans relative group"
              >
                <Heart className="w-5 h-5 md:w-[22px] md:h-[22px]" />
                <span className="hidden md:block text-[12px] font-medium text-[#6A6058] group-hover:text-[#1A1714] whitespace-nowrap">
                  Wishlist ({wishlistCount})
                </span>
              </button>
            )}

            {showCartSkeleton ? (
              <CartActionSkeleton />
            ) : (
              <button
                onClick={handleOpenCart}
                className="flex flex-col items-center gap-1 px-2 md:px-3.5 py-1.5 rounded-[10px] cursor-pointer transition-colors duration-180 text-[#6A6058] hover:text-[#1A1714] border-none bg-transparent font-sans relative group"
              >
                <ShoppingCart className="w-5 h-5 md:w-[22px] md:h-[22px]" />
                <span className="hidden md:block text-[12px] font-medium text-[#6A6058] group-hover:text-[#1A1714] whitespace-nowrap">
                  Cart ({cartCount})
                </span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 p-2 right-1 w-[15px] h-[15px] md:w-[17px] md:h-[17px] rounded-full bg-brand text-white text-[8px] md:text-[9px] font-bold flex items-center justify-center border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            <div className="relative">
              {showProfileSkeleton ? (
                <ProfileActionSkeleton />
              ) : (
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex flex-col items-center gap-1 px-2 md:px-3.5 py-1.5 rounded-[10px] cursor-pointer transition-colors duration-180 text-[#6A6058] hover:text-[#1A1714] border-none bg-transparent font-sans relative group"
                >
                  {isAuthenticated && user ? (
                    <div className="flex items-center gap-1">
                      <UserAvatar
                        user={user}
                        alt="Profile"
                        className="w-10 h-10 rounded-full text-[10px] font-dm-sans"
                      />
                      <ChevronDown
                        size={12}
                        className="text-[#6A6058] group-hover:text-[#1A1714] transition-colors"
                      />
                    </div>
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  {!isAuthenticated && (
                    <span className="hidden md:block text-[11px] font-medium text-[#6A6058] group-hover:text-[#1A1714] whitespace-nowrap">
                      Profile
                    </span>
                  )}
                </button>
              )}

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-[#F0EFED] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-50 py-1 overflow-hidden animate-in fade-in zoom-in duration-200">
                    {isAuthenticated &&
                      (user ? (
                        <div className="px-4 py-3 border-b border-[#F0EFED] bg-[#FAFAFA] flex items-center gap-3">
                          <UserAvatar
                            user={user}
                            alt="Profile"
                            className="w-10 h-10 rounded-full text-xs font-dm-sans border border-neutral-100"
                          />
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-[#1A1714] truncate mb-0.5">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-[12px] text-[#8C8782] truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <ProfileMenuHeaderSkeleton />
                      ))}

                    {!isAuthenticated && (
                      <div className="p-4 border-b border-[#F0EFED]">
                        <button
                          onClick={() => {
                            openAuthModal("login");
                            setIsProfileOpen(false);
                          }}
                          className="flex items-center justify-center w-full h-10 bg-brand text-white text-[14px] font-bold rounded-lg hover:bg-brand-hover transition-all duration-200 border-none cursor-pointer shadow-sm"
                        >
                          Sign In
                        </button>
                        <p className="text-[12px] text-[#5A5248] text-center mt-3">
                          New Customer?{" "}
                          <button
                            onClick={() => {
                              openAuthModal("signup");
                              setIsProfileOpen(false);
                            }}
                            className="text-brand font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                          >
                            Click here
                          </button>
                        </p>
                      </div>
                    )}

                    <div className="py-1">
                      {profileMenuItems.map((item, idx) => (
                        <Link
                          key={idx}
                          to={item.path}
                          state={item.state}
                          onClick={(e) => {
                            if (!isAuthenticated) {
                              e.preventDefault();
                              openAuthModal("login");
                              setIsProfileOpen(false);
                            } else {
                              setIsProfileOpen(false);
                            }
                          }}
                          className="flex items-center gap-3 px-4 py-3 text-[14px] text-[#5A5248] hover:text-[#1A1714] hover:bg-[#F9F8F6] transition-colors no-underline group/item"
                        >
                          <span className="text-[#6A6058] group-hover/item:text-brand transition-colors">
                            {item.icon}
                          </span>
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      ))}
                    </div>

                    {isAuthenticated && (
                      <>
                        <div className="h-px bg-[#F0EFED] my-1 mx-2" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-red-500 hover:bg-red-50 transition-colors border-none bg-transparent text-left cursor-pointer font-dm-sans group/logout"
                        >
                          <LogOut
                            size={16}
                            className="group-hover/logout:translate-x-1 transition-transform"
                          />
                          <span className="font-medium">Logout</span>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {cartEverOpened && (
        <Suspense fallback={null}>
          <CartSlider
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
