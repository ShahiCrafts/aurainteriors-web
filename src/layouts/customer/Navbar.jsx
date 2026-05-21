import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiHeart,
  FiPackage,
  FiMapPin,
  FiSettings,
  FiLogOut,
  FiBell,
  FiMenu,
  FiX,
  FiLoader,
} from "react-icons/fi";
import CartSlider from "../../components/cart/CartSlider";
import useAuthStore from "../../store/authStore";
import useGuestCartStore from "../../store/guestCartStore";
import { useCart } from "../../hooks/cart/useCartTan";
import { useWishlist } from "../../hooks/cart/useWishlistTan";
import useDebounce from "../../hooks/useDebounce";
import { useProducts } from "../../hooks/product/useProductTan";

export default function Navbar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isAuthenticated, logout, openAuthModal } = useAuthStore();
  const { data: cartData } = useCart({ enabled: isAuthenticated });
  const { data: wishlistData } = useWishlist({ enabled: isAuthenticated });
  const guestCartItems = useGuestCartStore((state) => state.items);
  
  const cartCount = isAuthenticated
    ? cartData?.data?.cart?.totalItems || 0
    : guestCartItems.reduce((sum, item) => sum + item.quantity, 0);
    
  const wishlistCount = wishlistData?.data?.wishlist?.itemCount || 0;

  // Search State
  const [searchInput, setSearchInput] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);
  const searchRef = useRef(null);

  // Fetch search results
  const { data: searchResultsData, isLoading: isSearchLoading } = useProducts({
    search: debouncedSearch,
    limit: 5,
    status: "active",
    enabled: debouncedSearch.length >= 2,
  });

  const searchResults = searchResultsData?.data?.products || [];
  const showDropdown =
    isSearchFocused && debouncedSearch.length >= 2 && !isSearchLoading;

  // Handle click outside search
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

  const profileMenuItems = [
    { label: "My Profile", icon: <FiUser size={16} />, path: "/profile", state: null },
    { label: "My Wishlist", icon: <FiHeart size={16} />, path: "/profile", state: { activeTab: "wishlist" } },
    { label: "My Orders", icon: <FiPackage size={16} />, path: "/profile", state: { activeTab: "orders" } },
    {
      label: "Saved Addresses",
      icon: <FiMapPin size={16} />,
      path: "/profile",
      state: { activeTab: "saved-addresses" },
    },
    { label: "Settings", icon: <FiSettings size={16} />, path: "/settings", state: null },
  ];

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-[#F0EFED] font-dm-sans">
        <div className="px-4 md:px-9 h-16 md:h-20 flex items-center justify-between gap-3 md:gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 md:gap-[11px] cursor-pointer shrink-0 select-none no-underline"
          >
            <div className="text-[20px] md:text-[24px] font-black text-[#1A1714] tracking-tight leading-none">
              Decor<span className="text-[#F27318]">X</span>
            </div>
          </Link>

          {/* Desktop Search */}
          <div 
            ref={searchRef}
            className="hidden md:block flex-1 max-w-[560px] relative"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <FiSearch
                size={16}
                className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[#B8B4AE] pointer-events-none"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search furniture, décor, colours…"
                className="w-full py-[11px] pr-[100px] pl-[44px] border-[1.5px] border-[#DCDAD6] rounded-[10px] bg-[#FAFAFA] font-sans text-[14px] text-[#1A1714] outline-none transition-all duration-[220ms] focus:border-[#F27318] focus:bg-white focus:ring-[3px] focus:ring-[#F27318]/10 placeholder:text-[#B8B4AE]"
              />
              <div className="absolute right-[5px] top-1/2 -translate-y-1/2 flex items-center gap-2">
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="p-1 text-[#B8B4AE] hover:text-[#1A1714] transition-colors bg-transparent border-none cursor-pointer"
                  >
                    <FiX size={16} />
                  </button>
                )}
                {isSearchLoading && (
                  <FiLoader size={16} className="text-[#F27318] animate-spin" />
                )}
                <button 
                  type="submit"
                  className="bg-[#F27318] hover:bg-[#D9620E] text-white border-none rounded-[8px] px-[18px] py-[7px] font-sans text-[13.5px] font-semibold cursor-pointer transition-colors duration-200"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Search Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#F0EFED] rounded-[12px] shadow-[0_10px_40px_rgba(0,0,0,0.12)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                            to={`/product/${product.slug}`}
                            onClick={() => setIsSearchFocused(false)}
                            className="flex items-center gap-4 px-4 py-3 hover:bg-[#F9F8F6] transition-colors no-underline group"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F6F6F6] shrink-0 border border-[#F0EFED]">
                              <img
                                src={product.images?.[0]?.url || "/placeholder.png"}
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
                              <span className="text-[14px] font-bold text-[#F27318]">
                                NPR {product.price?.toLocaleString()}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link
                        to={`/shop?search=${encodeURIComponent(debouncedSearch)}`}
                        onClick={() => setIsSearchFocused(false)}
                        className="flex items-center justify-center p-4 border-t border-[#F0EFED] text-[13px] font-bold text-[#1A1714] hover:text-[#F27318] transition-colors no-underline bg-[#FAFAFA]"
                      >
                        See all results for "{debouncedSearch}"
                      </Link>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-[#F9F8F6] rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiSearch size={20} className="text-[#B8B4AE]" />
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

          {/* Mobile Action Icons */}
          <div className="flex md:hidden items-center gap-[18px] shrink-0 text-[#1A1714]">
            <button className="bg-transparent border-none p-0 flex items-center justify-center cursor-pointer text-[#1A1714] hover:text-[#F27318] transition-colors">
              <FiBell size={22} />
            </button>
            <button className="bg-transparent border-none p-0 flex items-center justify-center cursor-pointer text-[#1A1714] hover:text-[#F27318] transition-colors">
              <FiSearch size={22} />
            </button>
            <button className="bg-transparent border-none p-0 flex items-center justify-center cursor-pointer text-[#1A1714] hover:text-[#F27318] transition-colors">
              <FiMenu size={24} />
            </button>
          </div>

          {/* Desktop Action Icons */}
          <div className="hidden md:flex items-center gap-[6px] shrink-0">
            <button
              onClick={() =>
                !isAuthenticated
                  ? openAuthModal("login")
                  : navigate("/profile", { state: { activeTab: "wishlist" } })
              }
              className="flex flex-col items-center gap-[4px] px-2 md:px-[14px] py-[6px] rounded-[10px] cursor-pointer transition-colors duration-[180ms] text-[#6A6058] hover:text-[#1A1714] border-none bg-transparent font-sans relative group"
            >
              <FiHeart className="w-5 h-5 md:w-[22px] md:h-[22px]" />
              <span className="hidden md:block text-[11px] font-medium text-[#6A6058] group-hover:text-[#1A1714] whitespace-nowrap">
                Wishlist ({wishlistCount})
              </span>
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex flex-col items-center gap-[4px] px-2 md:px-[14px] py-[6px] rounded-[10px] cursor-pointer transition-colors duration-[180ms] text-[#6A6058] hover:text-[#1A1714] border-none bg-transparent font-sans relative group"
            >
              <FiShoppingCart className="w-5 h-5 md:w-[22px] md:h-[22px]" />
              <span className="hidden md:block text-[11px] font-medium text-[#6A6058] group-hover:text-[#1A1714] whitespace-nowrap">
                Cart ({cartCount})
              </span>
              {cartCount > 0 && (
                <span className="absolute top-[2px] md:top-[5px] right-[2px] md:right-[5px] w-[15px] h-[15px] md:w-[17px] md:h-[17px] rounded-full bg-[#F27318] text-white text-[8px] md:text-[9px] font-bold flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex flex-col items-center gap-[4px] px-2 md:px-[14px] py-[6px] rounded-[10px] cursor-pointer transition-colors duration-[180ms] text-[#6A6058] hover:text-[#1A1714] border-none bg-transparent font-sans relative group"
              >
                <FiUser className="w-5 h-5 md:w-[22px] md:h-[22px]" />
                <span className="hidden md:block text-[11px] font-medium text-[#6A6058] group-hover:text-[#1A1714] whitespace-nowrap">
                  Profile
                </span>
              </button>

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#F0EFED] rounded-[12px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-50 py-1 overflow-hidden animate-in fade-in zoom-in duration-200">
                    {/* Auth Action if NOT Logged In */}
                    {!isAuthenticated && (
                      <div className="p-4 border-b border-[#F0EFED]">
                        <button
                          onClick={() => {
                            openAuthModal("login");
                            setIsProfileOpen(false);
                          }}
                          className="flex items-center justify-center w-full h-10 bg-[#F27318] text-white text-[14px] font-bold rounded-[8px] hover:bg-[#D9620E] transition-all duration-200 border-none cursor-pointer shadow-sm"
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
                            className="text-[#F27318] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                          >
                            Click here
                          </button>
                        </p>
                      </div>
                    )}

                    {/* Menu Items (Always visible) */}
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
                          <span className="text-[#6A6058] group-hover/item:text-[#F27318] transition-colors">
                            {item.icon}
                          </span>
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Logout Action if Logged In */}
                    {isAuthenticated && (
                      <>
                        <div className="h-[1px] bg-[#F0EFED] my-1 mx-2" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-red-500 hover:bg-red-50 transition-colors border-none bg-transparent text-left cursor-pointer font-dm-sans group/logout"
                        >
                          <FiLogOut
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

      <CartSlider isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
