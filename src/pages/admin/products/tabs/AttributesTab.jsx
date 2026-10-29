import DynamicAttributesSection from "../../../../components/admin/catalog/DynamicAttributesSection";

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
