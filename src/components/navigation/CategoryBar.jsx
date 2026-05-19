import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { FiGrid } from "react-icons/fi";
import { TbSofa, TbBed, TbLamp2 } from "react-icons/tb";
import {
  MdTableRestaurant,
  MdKitchen,
  MdOutlineBedroomParent,
  MdOutlineLiving,
  MdOutlineYard,
  MdViewInAr,
} from "react-icons/md";
import { PiDesk } from "react-icons/pi";
import { useCategoryTree } from "../../hooks/product/useCategoryTan";
import ARViewModal from "../modals/ARViewModal";

const iconMap = {
  "sofas": <TbSofa size={15} />,
  "beds": <TbBed size={15} />,
  "dining": <MdTableRestaurant size={15} />,
  "living": <MdOutlineLiving size={15} />,
  "bedroom": <MdOutlineBedroomParent size={15} />,
  "kitchen": <MdKitchen size={15} />,
  "desks": <PiDesk size={15} />,
  "outdoor": <MdOutlineYard size={15} />,
  "lighting": <TbLamp2 size={15} />,
};

const getCategoryIcon = (categoryName) => {
  if (!categoryName) return <FiGrid size={15} />;
  const name = categoryName.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) return icon;
  }
  return <FiGrid size={15} />;
};

export default function CategoryBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categorySlug } = useParams();
  const [isArModalOpen, setIsArModalOpen] = useState(false);

  const { data: categoryTreeData } = useCategoryTree();
  const fetchedCategories = categoryTreeData?.data?.categories || [];

  const displayCategories = [
    { label: "All", icon: <FiGrid size={14} />, id: "", slug: "" },
    ...fetchedCategories.map((c) => ({
      label: c.name,
      icon: getCategoryIcon(c.name),
      id: c._id,
      slug: c.slug
    })),
  ];

  const handleCategoryClick = (cat) => {
    if (cat.id === "" || !cat.slug) {
      navigate("/shop");
    } else {
      navigate(`/shop/${cat.slug}`);
    }
  };

  return (
    <>
      <div className="sticky top-[64px] md:top-[80px] z-30 bg-white/85 backdrop-blur-md border-b border-[#F0EFED] px-4 md:px-9 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex items-center overflow-x-auto no-scrollbar font-dm-sans">
        {displayCategories.map((cat) => {
          const isActive = cat.slug 
            ? categorySlug === cat.slug 
            : (location.pathname === "/shop" && cat.id === "");

          return (
            <div
              key={cat.label}
              className={`flex items-center gap-[6px] md:gap-[8px] px-[16px] md:px-[22px] py-[12px] md:py-[16px] text-[14px] md:text-[15px] whitespace-nowrap cursor-pointer transition-all duration-[180ms] select-none hover:text-[#1A1714] shrink-0 ${isActive ? "text-[#F27318] font-bold" : "text-[#7A7068] font-medium"
                }`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat.icon}
              {cat.label}
            </div>
          );
        })}
        <div
          className="flex items-center gap-[4px] md:gap-[6px] ml-auto pl-[12px] md:pl-[18px] py-[8px] md:py-[10px] text-[12px] md:text-[13px] font-semibold text-[#F27318] hover:text-[#D9620E] whitespace-nowrap cursor-pointer transition-all duration-[180ms] select-none border-l border-[#F0EFED] shrink-0"
          onClick={() => setIsArModalOpen(true)}
        >
          <MdViewInAr size={16} />
          <span className="hidden sm:inline">Try AR View</span>
          <span className="sm:hidden">AR View</span>
        </div>
      </div>

      <ARViewModal
        isOpen={isArModalOpen}
        onClose={() => setIsArModalOpen(false)}
        product={{
          _id: "demo-product",
          slug: "demo-product",
          modelUrl: "https://example.com/demo.glb" // Demo placeholder to show options
        }}
      />
    </>
  );
}
