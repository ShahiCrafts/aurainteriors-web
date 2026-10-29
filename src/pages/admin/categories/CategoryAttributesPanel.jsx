import { AnimatePresence } from "framer-motion";
import CategoryAttributesEditor from "../../../components/admin/catalog/CategoryAttributesEditor";

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
