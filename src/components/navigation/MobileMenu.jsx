import { useState } from "react";
import { Link } from "react-router-dom";
import { FiX, FiGrid, FiChevronRight } from "react-icons/fi";
import { TbSofa, TbBed, TbLamp2 } from "react-icons/tb";
import { MdTableRestaurant, MdKitchen, MdOutlineBedroomParent, MdOutlineLiving, MdOutlineYard } from "react-icons/md";
import { PiDesk } from "react-icons/pi";
import { useCategoryTree } from "../../hooks/product/useCategoryTan";

const iconMap = {
  "sofas": <TbSofa size={18} />,
  "beds": <TbBed size={18} />,
  "dining": <MdTableRestaurant size={18} />,
  "living": <MdOutlineLiving size={18} />,
  "bedroom": <MdOutlineBedroomParent size={18} />,
  "kitchen": <MdKitchen size={18} />,
  "desks": <PiDesk size={18} />,
  "outdoor": <MdOutlineYard size={18} />,
  "lighting": <TbLamp2 size={18} />,
};

const getCategoryIcon = (categoryName) => {
  if (!categoryName) return <FiGrid size={18} />;
  const name = categoryName.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) return icon;
  }
  return <FiGrid size={18} />;
};

export default function MobileMenu({ isOpen, onClose }) {
  const { data: categoryTreeData } = useCategoryTree();
  const fetchedCategories = categoryTreeData?.data?.categories || [];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-all duration-300" 
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 w-[280px] bg-white z-[70] transform transition-transform duration-300 ease-out font-dm-sans flex flex-col shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0EFED]">
          <div className="text-[20px] font-bold text-[#1A1714] tracking-[-0.03em]">
            Decor<em className="text-[#F27318] not-italic">X</em>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-[#B8B4AE] hover:text-[#1A1714] transition-colors rounded-full hover:bg-[#F9F8F6]">
            <FiX size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-5">
          <div className="px-4 mb-2">
            <h3 className="text-[11px] font-extrabold text-[#B8B4AE] tracking-[0.1em] uppercase mb-4 px-2">Categories</h3>
            <div className="space-y-1">
              <Link to="/products" onClick={onClose} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9F8F6] transition-colors text-[#1A1714] font-medium group no-underline">
                <div className="flex items-center gap-3">
                  <span className="text-[#F27318] bg-[#FFF3EB] p-2 rounded-lg group-hover:bg-[#F27318] group-hover:text-white transition-colors"><FiGrid size={18} /></span>
                  <span>All Categories</span>
                </div>
                <FiChevronRight size={16} className="text-[#DCDAD6] group-hover:text-[#F27318] transition-colors" />
              </Link>
              
              {fetchedCategories.map((cat) => (
                <Link key={cat._id || cat.name} to={`/products?category=${cat.name}`} onClick={onClose} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9F8F6] transition-colors text-[#1A1714] font-medium group no-underline">
                  <div className="flex items-center gap-3">
                    <span className="text-[#6A6058] bg-[#F6F6F6] p-2 rounded-lg group-hover:bg-[#F27318] group-hover:text-white transition-colors">{getCategoryIcon(cat.name)}</span>
                    <span>{cat.name}</span>
                  </div>
                  <FiChevronRight size={16} className="text-[#DCDAD6] group-hover:text-[#F27318] transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
