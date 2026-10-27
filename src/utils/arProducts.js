// FE-30: shared predicates for the AR entry pages (NativeARPage and
// ARViewPage). Both pages carry a synthetic intro product that is a
// demo scene, not a purchasable catalog item, and both need the same
// "does this product have a native-AR (glb/gltf) model" test.

// The synthetic intro/demo product. It may be displayed and placed in
// AR, but it must never reach either cart: the server cart API would
// reject (or worse, accept) a product id that does not exist.
export const isIntroProduct = (product) =>
  !!product && (product._id === "intro" || product.slug === "intro");

// A product can participate in native AR only if it carries a glb/gltf
// model, via modelFiles or the legacy modelUrl field.
export const hasArModel = (product) =>
  !!product &&
  (product.modelFiles?.some((m) => m.format === "glb" || m.format === "gltf") ||
    product.modelUrl?.includes(".glb") ||
    product.modelUrl?.includes(".gltf"));
