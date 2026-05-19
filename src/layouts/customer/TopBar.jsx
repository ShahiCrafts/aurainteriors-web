import {
  FiMapPin,
  FiTruck,
  FiTag,
  FiUsers,
  FiHelpCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDefaultAddress } from "../../hooks/profile/useAddressTan";
import useAuthStore from "../../store/authStore";

const G = "#F27318";

const topOffers = [
  { icon: <FiTruck size={12} />, text: "Free delivery on orders above ₹5,000" },
  { icon: <FiTag size={12} />, text: "Use DECOR15 — flat 15% off sitewide" },
];

const topLinks = [
  { icon: <FiUsers size={14} />, label: "Become a Partner" },
  { icon: <FiHelpCircle size={14} />, label: "Help" },
];

export default function TopBar() {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const { defaultAddress, isLoading } = useDefaultAddress();

  const handleAddressClick = () => {
    if (isAuthenticated) {
      navigate("/profile", { state: { activeTab: "saved-addresses" } });
    } else {
      openAuthModal("login");
    }
  };

  const addressText = isAuthenticated
    ? isLoading
      ? "Loading..."
      : defaultAddress
        ? `${defaultAddress.city} ${defaultAddress.postalCode}`
        : "No default address"
    : "Kathmandu 44600";

  return (
    <div className="hidden md:flex bg-[#f6f6f6] px-4 md:px-6 lg:px-9 h-10 md:h-11 items-center justify-between font-dm-sans">
      <div className="flex items-center gap-3 lg:gap-[18px]">
        <div
          onClick={handleAddressClick}
          className="flex items-center gap-1 sm:gap-[5px] text-xs sm:text-sm text-[#5A5248] cursor-pointer shrink-0"
        >
          <FiMapPin size={14} color={G} className="shrink-0" />
          <span className="hidden sm:inline">Deliver to</span>
          <span className="font-bold text-[#1A1714] border-b-[1.5px] border-dashed border-[#F27318]">
            {addressText}
          </span>
        </div>
        <div className="hidden lg:block w-[1px] h-[18px] bg-[#DDDBD8]" />
        <div className="hidden lg:flex items-center gap-[14px]">
          {topOffers.map((o, i) => (
            <div key={i} className="flex items-center gap-[14px]">
              <div className="flex items-center gap-[5px] text-[13px] text-[#5A5248] whitespace-nowrap">
                <span className="text-[#F27318] shrink-0">{o.icon}</span>
                <span>{o.text}</span>
              </div>
              {i < topOffers.length - 1 && (
                <div className="w-[1px] h-[14px] bg-[#DDDBD8]" />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-[2px] overflow-x-auto scrollbar-hide">
        {topLinks.map((l, i) => (
          <div key={l.label} className="flex items-center gap-1 sm:gap-[2px]">
            {i > 0 && (
              <div className="hidden sm:block w-[1px] h-[14px] md:h-[18px] bg-[#DDDBD8] mx-1 sm:mx-0" />
            )}
            <span className="flex items-center gap-1 sm:gap-[5px] text-[11px] sm:text-[13.5px] font-light text-[#6A6058] cursor-pointer px-2 sm:px-[9px] py-[5px] rounded-[7px] whitespace-nowrap transition-all duration-[180ms] hover:bg-[#ECEAE6] hover:text-[#1A1714]">
              <span className="text-[#F27318] shrink-0">{l.icon}</span>
              <span className="hidden sm:inline">{l.label}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
