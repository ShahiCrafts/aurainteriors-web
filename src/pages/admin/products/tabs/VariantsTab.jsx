import VariantEditor from "../../../../components/admin/catalog/VariantEditor";

// Phase 7 split (from Products.jsx) — the Variants tab (edit mode
// only): a thin wrapper over the EXISTING VariantEditor (not a
// rewrite). The drawer keeps it mounted-but-hidden, as the page
// did, so the variant list is ready when the tab opens.
export default function VariantsTab({ editingProduct }) {
  return <VariantEditor product={editingProduct} />;
}
