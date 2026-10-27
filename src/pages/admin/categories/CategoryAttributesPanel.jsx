import { AnimatePresence } from 'framer-motion';
import CategoryAttributesEditor from '../../../components/admin/catalog/CategoryAttributesEditor';

// Phase 7 split (from Categories.jsx) — the attributes-for-category
// panel: a thin wrapper over the existing CategoryAttributesEditor,
// rendered (with its AnimatePresence mount) exactly as the page
// rendered it before the split.
export default function CategoryAttributesPanel({
  attributesCategory,
  categories,
  setAttributesCategory,
}) {
  return (
    <>
    <AnimatePresence>
      {attributesCategory && (
        <CategoryAttributesEditor
          category={attributesCategory}
          categories={categories}
          onClose={() => setAttributesCategory(null)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
