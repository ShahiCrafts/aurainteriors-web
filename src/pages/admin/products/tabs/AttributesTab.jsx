import DynamicAttributesSection from "../../../../components/admin/catalog/DynamicAttributesSection";

// Phase 7 split (from Products.jsx) — the Attributes tab: a thin
// wrapper over the EXISTING DynamicAttributesSection (not a
// rewrite). The drawer keeps it mounted-but-hidden, as the page
// did, so required-attribute validation works even if the tab was
// never opened.
export default function AttributesTab({ form }) {
  const {
    productForm,
    storedCatalogAttributes,
    showAttrErrors,
    handleCatalogAttrChange,
  } = form;

  return (
    <DynamicAttributesSection
      categoryId={productForm.category}
      productType={productForm.productType}
      storedAttributes={storedCatalogAttributes}
      showErrors={showAttrErrors}
      onChange={handleCatalogAttrChange}
    />
  );
}
