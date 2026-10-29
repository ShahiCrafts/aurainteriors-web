import {
  shopCategoryUrl,
  selectedCategorySlugs,
} from "../../utils/shopFilters";
import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  Suspense,
  lazy,
} from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
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
  ChevronDown,
} from "lucide-react";
import { useCategoryTree } from "../../hooks/product/useCategoryTan";
import { CategoryBarSkeletonContent } from "../common/Skeleton";
import { useArCatalogProducts } from "../../hooks/product/useArCatalogTan";
import { hasArModel } from "../../utils/arProducts";

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
  if (typeof categoryName !== "string") {
    return <LayoutGrid size={15} />;
  }

  const name = categoryName.toLowerCase();

  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) return icon;
  }

  return <LayoutGrid size={15} />;
};

export default function CategoryBar() {
  const [searchParams] = useSearchParams();
  const selectedCategories = selectedCategorySlugs(searchParams);
  const location = useLocation();
  const rootRef = useRef(null);
  const triggers = useRef({});
  const [openSlug, setOpenSlug] = useState(null);
  const [popupLayout, setPopupLayout] = useState({
    left: 16,
    width: 260,
    columns: 1,
  });
  const [isArModalOpen, setIsArModalOpen] = useState(false);
  const { data: categoryTreeData, isLoading } = useCategoryTree();
  const categoryData = categoryTreeData?.data?.categories;
  const categories = Array.isArray(categoryData)
    ? categoryData.filter(
      (item) => item && typeof item.slug === "string" && item.slug,
    )
    : [];
  const { data: arCatalogData } = useArCatalogProducts();
  const products = arCatalogData?.data?.products;
  const arProduct =
    (Array.isArray(products) ? products : []).find(hasArModel) || null;
  const openCategory = categories.find((item) => item.slug === openSlug);
  const isAllActive =
    location.pathname === "/shop" && selectedCategories.length === 0;
  const childrenOf = (item) => {
    const nested =
      Array.isArray(item?.subcategories) && item.subcategories.length
        ? item.subcategories
        : item?.children;
    return Array.isArray(nested)
      ? nested.filter(
        (child) => child && typeof child.slug === "string" && child.slug,
      )
      : [];
  };
  const categoryPath = (item) => shopCategoryUrl(item.slug);
  const containsActive = (item) =>
    selectedCategories.includes(item.slug) ||
    childrenOf(item).some(containsActive);

  const groups = childrenOf(openCategory);
  const isGrouped = groups.some((item) => childrenOf(item).length > 0);

  const renderDescendants = (items, nested = false) => (
    <ul
      className={
        nested
          ? "ml-3 mt-1.5 space-y-1.5 border-l border-[#F0EFED] pl-3"
          : "space-y-2.5"
      }
    >
      {items.map((item) => {
        const descendants = childrenOf(item);
        return (
          <li key={item._id || item.slug}>
            <Link
              to={categoryPath(item)}
              onClick={() => setOpenSlug(null)}
              aria-current={
                selectedCategories.includes(item.slug) ? "page" : undefined
              }
              className={`block py-0.5 text-sm transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand ${containsActive(item) ? "text-brand" : "text-[#7A7068]"}`}
            >
              {item.name}
              {typeof item.productCount === "number" && (
                <span
                  aria-hidden="true"
                  className="ml-2 text-xs font-medium text-[#B8B4AE]"
                >
                  {item.productCount}
                </span>
              )}
            </Link>
            {descendants.length > 0 && renderDescendants(descendants, true)}
          </li>
        );
      })}
    </ul>
  );

  useLayoutEffect(() => {
    if (!openSlug) return;
    const measure = () => {
      const root = rootRef.current?.getBoundingClientRect();
      const trigger =
        triggers.current[openSlug]?.parentElement?.getBoundingClientRect();
      if (!root || !trigger) return;
      const available = Math.max(0, root.width - 32);
      const desiredColumns = isGrouped
        ? Math.min(Math.max(groups.length, 1), 4)
        : 1;
      const desiredWidth = isGrouped
        ? desiredColumns * 200 + (desiredColumns - 1) * 24 + 40
        : 260;
      const width = Math.min(desiredWidth, available);
      const left = Math.max(
        16,
        Math.min(trigger.left - root.left, root.width - width - 16),
      );
      const columns = Math.min(
        desiredColumns,
        Math.max(1, Math.floor((width - 40 + 24) / 224)),
      );
      setPopupLayout((previous) =>
        previous.left === left &&
          previous.width === width &&
          previous.columns === columns
          ? previous
          : { left, width, columns },
      );
    };
    measure();
    window.addEventListener("resize", measure);
    rootRef.current?.addEventListener("scroll", measure, true);
    const root = rootRef.current;
    return () => {
      window.removeEventListener("resize", measure);
      root?.removeEventListener("scroll", measure, true);
    };
  }, [openSlug, isGrouped, groups.length]);

  useEffect(() => {
    setOpenSlug(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!openSlug) return;
    const outside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpenSlug(null);
    };
    const escape = (event) => {
      if (event.key === "Escape") {
        setOpenSlug(null);
        triggers.current[openSlug]?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [openSlug]);

  return (
    <>
      <div
        ref={rootRef}
        className="sticky top-16 md:top-20 z-40 bg-white border-b border-[#F0EFED] font-dm-sans"
        onMouseLeave={() => setOpenSlug(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setOpenSlug(null);
        }}
      >
        <nav aria-label="Product categories" className="flex items-center">
          <div
            className="flex flex-1 items-center overflow-x-auto no-scrollbar px-4 md:px-6 lg:px-8"
            aria-busy={isLoading}
          >
            {!isLoading && (
              <div
                className="flex shrink-0 items-center whitespace-nowrap pr-6.5 py-2.5 text-[14px] md:pr-8.5 md:py-3 md:text-[15px]"
                onMouseEnter={() => setOpenSlug(null)}
              >
                <Link
                  to="/shop"
                  onClick={() => setOpenSlug(null)}
                  aria-current={isAllActive ? "page" : undefined}
                  className={`flex items-center gap-1.5 md:gap-2 py-1 font-medium transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-brand ${isAllActive ? "text-brand" : "text-[#7A7068] hover:text-[#1A1714]"}`}
                >
                  <LayoutGrid size={15} />
                  <span>All</span>
                </Link>
              </div>
            )}
            {categories.map((category) => {
              const expanded = openSlug === category.slug;
              return (
                <div
                  key={category._id || category.slug}
                  className="flex shrink-0 items-center whitespace-nowrap pr-4 py-2.5 text-[14px] md:pr-6 md:py-3 md:text-[15px]"
                  onMouseEnter={() => setOpenSlug(category.slug)}
                >
                  <Link
                    to={categoryPath(category)}
                    onClick={() => setOpenSlug(null)}
                    aria-current={
                      selectedCategories.includes(category.slug)
                        ? "page"
                        : undefined
                    }
                    className={`flex items-center gap-1.5 md:gap-2 py-1 font-medium transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-brand ${containsActive(category) || expanded ? "text-brand" : "text-[#7A7068] hover:text-[#1A1714]"}`}
                  >
                    {getCategoryIcon(category.name)}
                    <span>{category.name}</span>
                  </Link>
                  <button
                    ref={(element) => {
                      triggers.current[category.slug] = element;
                    }}
                    type="button"
                    aria-label={`Show ${category.name} subcategories`}
                    aria-expanded={expanded}
                    aria-controls="category-subcategories"
                    onClick={() => setOpenSlug(expanded ? null : category.slug)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setOpenSlug(category.slug);
                        requestAnimationFrame(() =>
                          rootRef.current
                            ?.querySelector("#category-subcategories a")
                            ?.focus(),
                        );
                      }
                    }}
                    className={`relative ml-1 inline-flex h-8 w-6 shrink-0 items-center justify-start rounded cursor-pointer transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-brand ${expanded ? "text-brand" : "text-[#7A7068] hover:text-[#1A1714]"}`}
                  >
                    <ChevronDown
                      size={14}
                      aria-hidden="true"
                      className={`transition-transform duration-300 ease-in-out motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
              );
            })}
            {isLoading && (
              <>
                <span className="sr-only" role="status">
                  Loading categories
                </span>
                <CategoryBarSkeletonContent />
              </>
            )}
          </div>
          {arProduct && (
            <button
              type="button"
              onClick={() => {
                setOpenSlug(null);
                setIsArModalOpen(true);
              }}
              className="flex shrink-0 items-center gap-1.5 border-l border-[#F0EFED] px-4 py-2.5 text-xs font-semibold text-brand hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Scan size={16} />
              <span className="hidden sm:inline">Try AR View</span>
              <span className="sm:hidden">AR</span>
            </button>
          )}
        </nav>

        {openCategory && (
          <nav
            id="category-subcategories"
            aria-label={`${openCategory.name} subcategories`}
            style={{ left: popupLayout.left, width: popupLayout.width }}
            className="absolute top-full z-50 max-h-[min(70vh,560px)] overflow-y-auto rounded-b-xl border border-[#E5E2DE] bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
          >
            {childrenOf(openCategory).length > 0 ? (
              <div
                className={
                  isGrouped ? "grid gap-x-6 gap-y-5" : "flex flex-col gap-0.5"
                }
                style={
                  isGrouped
                    ? {
                      gridTemplateColumns: `repeat(${popupLayout.columns}, minmax(0, 1fr))`,
                    }
                    : undefined
                }
              >
                {childrenOf(openCategory).map((child) => (
                  <div key={child._id || child.slug}>
                    <Link
                      to={categoryPath(child)}
                      onClick={() => setOpenSlug(null)}
                      className={`${isGrouped ? "mb-2 font-semibold" : "py-2 font-medium"} block text-sm hover:text-brand ${containsActive(child) ? "text-brand" : "text-[#1A1714]"}`}
                    >
                      {child.name}
                      {typeof child.productCount === "number" && (
                        <span
                          aria-hidden="true"
                          className="ml-2 text-xs font-medium text-[#B8B4AE]"
                        >
                          {child.productCount}
                        </span>
                      )}
                    </Link>
                    {childrenOf(child).length > 0 &&
                      renderDescendants(childrenOf(child))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7A7068]">
                Explore the full {openCategory.name} collection.
              </p>
            )}
          </nav>
        )}
      </div>
      {isArModalOpen && arProduct && (
        <Suspense fallback={null}>
          <ARViewModal
            isOpen={isArModalOpen}
            onClose={() => setIsArModalOpen(false)}
            product={arProduct}
          />
        </Suspense>
      )}
    </>
  );
}
