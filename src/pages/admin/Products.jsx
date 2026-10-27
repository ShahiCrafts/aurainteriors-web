// Phase 7 split — the admin Products page was split into
// src/pages/admin/products/ (ProductListPage + ProductFormDrawer +
// tabs + hooks/useProductFormState). This module is a thin
// re-export shim so the admin router's existing import path
// (./pages/admin/Products) keeps working unchanged.
export { default } from "./products/ProductListPage";
