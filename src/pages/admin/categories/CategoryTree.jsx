import {
  Edit2,
  Trash2,
  Plus,
  Image,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
} from 'lucide-react';
import ImageWithFallback from '../../../components/fallbacks/ImageWithFallback';
import { getCategoryImageUrl } from '../../../utils/imageUrl';
import {
  subtreeProductCount,
  categoryParentId,
} from '../../../utils/categoryTree';

// Phase 7 split (from Categories.jsx) — the hierarchical tree
// rendering: expand/collapse, subtree product counts, sibling
// reorder and the row actions. Markup moved verbatim; tree state
// comes from hooks/useCategoryTree in the page.
export default function CategoryTree({
  treeRows,
  siblingIdsByParent,
  toggleExpand,
  handleMoveCategory,
  reorderMutation,
  deleteMutation,
  setAttributesCategory,
  handleAddCategory,
  handleEditCategory,
  confirmDelete,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="divide-y divide-gray-50">
        {treeRows.map(({ category, depth, hasChildren, isExpanded }) => {
          const directCount = category.productCount || 0;
          const subtreeCount = subtreeProductCount(category);
          const siblings = siblingIdsByParent.get(categoryParentId(category) || 'root') || [];
          const siblingIndex = siblings.indexOf(String(category._id));
          return (
            <div
              key={category._id}
              data-testid={`category-row-${category.slug}`}
              className="flex items-center gap-3 pr-5 py-3.5 hover:bg-gray-50/60 transition-colors"
              style={{ paddingLeft: `${20 + depth * 28}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(category._id)}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${category.name}`}
                  className="p-1 hover:bg-gray-100 rounded-md text-gray-500 shrink-0"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <span className="w-6 shrink-0" />
              )}
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                {category.image ? (
                  <ImageWithFallback
                    src={getCategoryImageUrl(category.image)}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{category.name}</span>
                  <span className="font-mono text-xs text-gray-400">/{category.slug}</span>
                  {category.productType ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {category.productType}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {directCount} products
                  {subtreeCount !== directCount ? ` · ${subtreeCount} incl. subcategories` : ''}
                </p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize shrink-0 ${
                category.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {category.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => handleMoveCategory(category, -1)}
                  disabled={siblingIndex <= 0 || reorderMutation.isPending}
                  aria-label={`Move ${category.name} up`}
                  title="Move up"
                  className="p-1.5 hover:bg-slate-100 text-gray-500 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveCategory(category, 1)}
                  disabled={siblingIndex < 0 || siblingIndex >= siblings.length - 1 || reorderMutation.isPending}
                  aria-label={`Move ${category.name} down`}
                  title="Move down"
                  className="p-1.5 hover:bg-slate-100 text-gray-500 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setAttributesCategory(category)}
                  className="p-1.5 hover:bg-slate-100 text-gray-500 rounded-full transition-colors"
                  title="Attributes"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleAddCategory(category._id)}
                  className="p-1.5 hover:bg-slate-100 text-gray-500 rounded-full transition-colors"
                  title="Add subcategory"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleEditCategory(category)}
                  className="p-1.5 hover:bg-slate-100 text-gray-500 rounded-full transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => confirmDelete(category._id)}
                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                  disabled={deleteMutation.isPending}
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
