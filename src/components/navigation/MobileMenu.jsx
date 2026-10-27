import { shopCategoryUrl } from "../../utils/shopFilters";
import { useRef, useState } from "react";
import { useDialogBehaviour } from "../common/useDialogBehaviour";
import { Link } from "react-router-dom";
import { FiX, FiGrid, FiChevronRight, FiChevronDown } from "react-icons/fi";
import { TbSofa, TbBed, TbLamp2 } from "react-icons/tb";
import { MdTableRestaurant, MdKitchen, MdOutlineBedroomParent, MdOutlineLiving, MdOutlineYard } from "react-icons/md";
import { PiDesk } from "react-icons/pi";
import { useCategoryTree } from "../../hooks/product/useCategoryTan";
import { useRooms, useCollections } from "../../hooks/catalog/useCatalogTan";

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

const childrenOf = (category) => {
  const nested = Array.isArray(category?.subcategories) && category.subcategories.length
    ? category.subcategories
    : category?.children;
  return Array.isArray(nested) ? nested.filter((child) => child && child.slug) : [];
};

// Phase 7 (catalog): one category row — link plus an expand
// toggle when the category has children; children render
// recursively (indented) while expanded.
function CategoryRow({ category, depth, expanded, onToggle, onClose }) {
  const children = childrenOf(category);
  const isExpanded = expanded.has(category.slug);
  return (
    <div>
      <div
        className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9F8F6] transition-colors text-[#1A1714] font-medium group"
        style={depth > 0 ? { marginLeft: depth * 14 } : undefined}
      >
        <Link
          to={category.slug ? shopCategoryUrl(category.slug) : "/shop"}
          onClick={onClose}
          className="flex flex-1 items-center gap-3 no-underline text-[#1A1714]"
        >
          <span className="text-[#6A6058] bg-[#F6F6F6] p-2 rounded-lg group-hover:bg-[#F27318] group-hover:text-white transition-colors">{getCategoryIcon(category.name)}</span>
          <span>{category.name}</span>
          {typeof category.productCount === "number" && (
            <span aria-hidden="true" className="text-[11px] font-bold text-black/25">{category.productCount}</span>
          )}
        </Link>
        {children.length > 0 ? (
          <button
            type="button"
            onClick={() => onToggle(category.slug)}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${category.name} subcategories`}
            className="p-1.5 text-[#B8B4AE] hover:text-[#F27318] transition-colors"
          >
            {isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
          </button>
        ) : (
          <FiChevronRight size={16} className="text-[#DCDAD6] group-hover:text-[#F27318] transition-colors" />
        )}
      </div>
      {isExpanded &&
        children.map((child) => (
          <CategoryRow
            key={child._id || child.slug}
            category={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onClose={onClose}
          />
        ))}
    </div>
  );
}

export default function MobileMenu({ isOpen, onClose }) {
  // FE-64: navigation drawer — treated as a dialog for Escape/focus
  // purposes while open; while closed it is inert and aria-hidden so
  // its links leave the tab order and accessibility tree (previously
  // they stayed focusable behind a -translate-x-full transform).
  const panelRef = useRef(null);
  useDialogBehaviour({ open: isOpen, onClose, containerRef: panelRef });
  const { data: categoryTreeData } = useCategoryTree();
  const fetchedCategories = categoryTreeData?.data?.categories || [];
  // Phase 7 (catalog): Rooms + Collections sections — the two
  // other navigation axes, linking to their landing pages.
  const { data: roomsData } = useRooms();
  const rooms = roomsData?.data?.rooms || roomsData?.data || [];
  const { data: collectionsData } = useCollections();
  const collections = collectionsData?.data?.collections || collectionsData?.data || [];
  const [expanded, setExpanded] = useState(() => new Set());
  const toggleExpanded = (slug) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

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
        ref={panelRef}
        role={isOpen ? "dialog" : undefined}
        aria-modal={isOpen ? "true" : undefined}
        aria-label="Menu"
        aria-hidden={!isOpen || undefined}
        inert={!isOpen}
        tabIndex={-1}
        className={`fixed inset-y-0 left-0 w-[280px] bg-white z-[70] transform transition-transform duration-300 ease-out font-dm-sans flex flex-col shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0EFED]">
          <div className="text-[20px] font-bold text-[#1A1714] tracking-[-0.03em]">
            Decor<em className="text-[#F27318] not-italic">X</em>
          </div>
          <button onClick={onClose} aria-label="Close menu" className="p-2 -mr-2 text-[#B8B4AE] hover:text-[#1A1714] transition-colors rounded-full hover:bg-[#F9F8F6]">
            <FiX size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-5">
          <div className="px-4 mb-2">
            <h3 className="text-[11px] font-extrabold text-[#B8B4AE] tracking-[0.1em] uppercase mb-4 px-2">Categories</h3>
            <div className="space-y-1">
              <Link to="/shop" onClick={onClose} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9F8F6] transition-colors text-[#1A1714] font-medium group no-underline">
                <div className="flex items-center gap-3">
                  <span className="text-[#F27318] bg-[#FFF3EB] p-2 rounded-lg group-hover:bg-[#F27318] group-hover:text-white transition-colors"><FiGrid size={18} /></span>
                  <span>All Categories</span>
                </div>
                <FiChevronRight size={16} className="text-[#DCDAD6] group-hover:text-[#F27318] transition-colors" />
              </Link>
              
              {fetchedCategories.map((cat) => (
                <CategoryRow
                  key={cat._id || cat.slug || cat.name}
                  category={cat}
                  depth={0}
                  expanded={expanded}
                  onToggle={toggleExpanded}
                  onClose={onClose}
                />
              ))}
            </div>
          </div>

          {rooms.length > 0 && (
            <div className="px-4 mb-2 mt-6">
              <h3 className="text-[11px] font-extrabold text-[#B8B4AE] tracking-[0.1em] uppercase mb-4 px-2">Rooms</h3>
              <div className="space-y-1">
                {rooms.map((room) => (
                  <Link key={room.slug} to={`/rooms/${encodeURIComponent(room.slug)}`} onClick={onClose} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9F8F6] transition-colors text-[#1A1714] font-medium group no-underline">
                    <span>{room.label}</span>
                    <FiChevronRight size={16} className="text-[#DCDAD6] group-hover:text-[#F27318] transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {collections.length > 0 && (
            <div className="px-4 mb-2 mt-6">
              <h3 className="text-[11px] font-extrabold text-[#B8B4AE] tracking-[0.1em] uppercase mb-4 px-2">Collections</h3>
              <div className="space-y-1">
                {collections.map((collection) => (
                  <Link key={collection.slug} to={`/collections/${encodeURIComponent(collection.slug)}`} onClick={onClose} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9F8F6] transition-colors text-[#1A1714] font-medium group no-underline">
                    <span>{collection.label}</span>
                    <FiChevronRight size={16} className="text-[#DCDAD6] group-hover:text-[#F27318] transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
