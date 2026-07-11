import { useState, Suspense, lazy } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  LayoutGrid,
  Armchair,
  BedDouble,
  Lamp,
  UtensilsCrossed,
  ChefHat,
  Sofa,
  Leaf,
  Monitor,
  Scan,
} from "lucide-react";
import { useCategoryTree } from "../../hooks/product/useCategoryTan";

const ARViewModal = lazy(() => import("../modals/ARViewModal"));

const iconMap = {
  sofa: <Armchair size={15} />,
  bed: <BedDouble size={15} />,
  dining: <UtensilsCrossed size={15} />,
  living: <Sofa size={15} />,
  bedroom: <BedDouble size={15} />,
  kitchen: <ChefHat size={15} />,
  desk: <Monitor size={15} />,
  outdoor: <Leaf size={15} />,
  lighting: <Lamp size={15} />,
};

const getCategoryIcon = (categoryName) => {
  if (!categoryName) return <LayoutGrid size={15} />;
  const name = categoryName.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) return icon;
  }
  return <LayoutGrid size={15} />;
};

export default function CategoryBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categorySlug } = useParams();
  const [isArModalOpen, setIsArModalOpen] = useState(false);

  const { data: categoryTreeData } = useCategoryTree();
  const fetchedCategories = categoryTreeData?.data?.categories || [];

  const displayCategories = [
    { label: "All", icon: <LayoutGrid size={14} />, id: "", slug: "" },
    ...fetchedCategories.map((c) => ({
      label: c.name,
      icon: getCategoryIcon(c.name),
      id: c._id,
      slug: c.slug,
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
      <div className="sticky top-16 md:top-20 z-30 bg-white/85 backdrop-blur-md border-b border-[#F0EFED] shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex items-center font-dm-sans">
        {/* Scrollable category list */}
        <div className="flex items-center overflow-x-auto no-scrollbar flex-1 px-4 md:px-6 lg:px-8">
          {displayCategories.map((cat) => {
            const isActive = cat.slug
              ? categorySlug === cat.slug
              : location.pathname === "/shop" && cat.id === "";

            return (
              <div
                key={cat.label}
                className={`flex items-center gap-1.5 md:gap-2 pr-4 md:pr-9 py-3 md:py-4 text-[14px] md:text-[15px] whitespace-nowrap cursor-pointer transition-all duration-180 select-none hover:text-[#1A1714] shrink-0 ${isActive
                  ? "text-[#F27318] font-semibold"
                  : "text-[#7A7068] font-medium"
                  }`}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat.icon}
                {cat.label}
              </div>
            );
          })}
        </div>

        {/* AR button — outside the scroll container so it's always visible */}
        <div
          className="flex items-center gap-1 md:gap-1.5 px-3 md:px-[18px] py-2 md:py-2.5 text-[12px] md:text-[13px] font-semibold text-[#F27318] hover:text-[#D9620E] whitespace-nowrap cursor-pointer transition-all duration-200 border-l border-[#F0EFED] shrink-0
  "

          onClick={() => setIsArModalOpen(true)}
        >
          <Scan size={16} />
          <span className="hidden sm:inline">Try AR View</span>
          <span className="sm:hidden">AR</span>
        </div>
      </div>

      {/*
        ARViewModal is gated: only rendered (and its lazy chunk fetched)
        when the user actually clicks "Try AR View". Suspense fallback=null
        since the button already provides interaction feedback.
      */}
      {isArModalOpen && (
        <Suspense fallback={null}>
          <ARViewModal
            isOpen={isArModalOpen}
            onClose={() => setIsArModalOpen(false)}
            product={{
              _id: "demo-product",
              slug: "demo-product",
              modelUrl: "https://example.com/demo.glb",
            }}
          />
        </Suspense>
      )}
    </>
  );
}