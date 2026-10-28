import { useState, useRef, useMemo, useCallback } from "react";
import {
  buildAttributesPayload,
  missingRequiredAttributes,
} from "../../../../utils/catalogAttributes";
import {
  useCreateProduct,
  useUpdateProduct,
} from "../../../../hooks/product/useProductTan";
import { toast } from "../../../../lib/toast";
import { getImageUrl as getImageUrlUtil } from "../../../../utils/imageUrl";
import formatError from "../../../../utils/errorHandler";
import { parseProductPriceStock } from "../../../../utils/adminForms";

// Phase 7 split (from Products.jsx) — the product form state
// machine: form values, image list, model list, catalog-attribute
// state, open/edit seeding, and submit payload construction. Logic
// moved verbatim from the page; the payload shape is pinned by
// tests/pages/admin/Products.formSubmission.test.jsx and
// ProductForm.catalog.test.jsx.
//
// Dead code NOT carried over (verified unused in the original
// file by grep — defined once, never referenced): the
// `colorOptions` and `materialOptions` arrays.
export default function useProductFormState({ categories }) {
  const fileInputRef = useRef(null);
  const modelFileInputRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [modelInputType, setModelInputType] = useState("url");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({}); // { [url]: 0-100 }
  const [showAllImages, setShowAllImages] = useState(false);
  const [modelFiles, setModelFiles] = useState([]); // New file uploads
  const [modelUrls, setModelUrls] = useState([]); // New URL entries
  const [existingModelFiles, setExistingModelFiles] = useState([]); // Existing models (both files and URLs)
  const [isDraggingModel, setIsDraggingModel] = useState(false);
  const [materialInput, setMaterialInput] = useState("");
  const [newModelUrl, setNewModelUrl] = useState(""); // For URL input field
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    price: "",
    originalPrice: "",
    stock: "",
    description: "",
    shortDescription: "",
    status: "active",
    modelUrl: "",
    sku: "",
    style: "",
    isFeatured: false,
    isNewArrival: false,
    dimensions: { width: "", height: "", depth: "" },
    weight: { value: "", unit: "kg" },
    materials: [],
    colors: [],
    productType: "",
    roomSlugs: [],
  });

  // Phase 6 (catalog): the dynamic attributes section reports its
  // resolution + values up here so Save can validate and build the
  // catalogAttributes payload with the shared catalog utils.
  const [catalogAttrState, setCatalogAttrState] = useState({
    resolved: [],
    values: {},
    passthrough: {},
  });
  const [showAttrErrors, setShowAttrErrors] = useState(false);
  const handleCatalogAttrChange = useCallback((state) => {
    setCatalogAttrState(state);
  }, []);

  // Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  // The product's stored catalog attribute values (edit mode) —
  // the dynamic section seeds from these and passes through any
  // keys the current resolution does not render.
  const storedCatalogAttributes = useMemo(
    () => editingProduct?.catalogAttributes || {},
    [editingProduct],
  );

  const handleAddColor = () => {
    const input = document.createElement("input");
    input.type = "color";
    input.value = "#000000";
    input.style.position = "fixed";
    input.style.top = "-100px";
    input.style.left = "-100px";
    input.style.opacity = "0";
    document.body.appendChild(input);

    const cleanup = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    input.addEventListener("change", (e) => {
      const newColor = e.target.value.toUpperCase();
      setProductForm((prev) => ({
        ...prev,
        colors: prev.colors.includes(newColor)
          ? prev.colors
          : [...prev.colors, newColor],
      }));
      cleanup();
    });

    input.addEventListener("blur", () => {
      setTimeout(cleanup, 300);
    });

    input.click();
  };

  const handleEditColor = (oldColor, currentHex) => {
    const input = document.createElement("input");
    input.type = "color";
    input.value = currentHex.toLowerCase();
    input.style.position = "fixed";
    input.style.top = "-100px";
    input.style.left = "-100px";
    input.style.opacity = "0";
    document.body.appendChild(input);

    const cleanup = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    input.addEventListener("change", (e) => {
      const newColor = e.target.value.toUpperCase();
      setProductForm((prev) => ({
        ...prev,
        colors: prev.colors.map((c) => (c === oldColor ? newColor : c)),
      }));
      cleanup();
    });

    input.addEventListener("blur", () => {
      setTimeout(cleanup, 300);
    });

    input.click();
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category: product.category?._id || product.category || "",
        price: product.price?.toString() || "",
        originalPrice: product.originalPrice?.toString() || "",
        stock: product.stock?.toString() || "",
        description: product.description || "",
        shortDescription: product.shortDescription || "",
        status: product.status || "active",
        modelUrl: product.modelUrl || "",
        sku: product.sku || "",
        style: product.style || "",
        isFeatured: product.isFeatured || false,
        isNewArrival: product.isNewArrival || false,
        dimensions: product.dimensions || { width: "", height: "", depth: "" },
        weight: product.weight || { value: "", unit: "kg" },
        materials: product.materials || [],
        colors: product.colors || [],
        productType: product.productType || "",
        roomSlugs: product.roomSlugs || [],
      });
      setModelInputType(
        product.modelUrl || product.modelFiles?.length > 0
          ? product.modelUrl
            ? "url"
            : "upload"
          : "url",
      );
      // Set existing images as previews
      if (product.images?.length > 0) {
        setImagePreviews(
          product.images.map((img) => ({
            url: getImageUrlUtil(img.url, "products"),
            existing: true,
            originalUrl: img.url,
          })),
        );
      } else {
        setImagePreviews([]);
      }
      setImageFiles([]);
      // Set existing model files (both uploaded and URL-based)
      if (product.modelFiles?.length > 0) {
        setExistingModelFiles(
          product.modelFiles.map((model) => ({
            ...model,
            existing: true,
          })),
        );
      } else {
        setExistingModelFiles([]);
      }
      setModelFiles([]);
      setModelUrls([]);
      setNewModelUrl("");
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        category: categories[0]?._id || "",
        price: "",
        originalPrice: "",
        stock: "",
        description: "",
        shortDescription: "",
        status: "active",
        modelUrl: "",
        sku: "",
        style: "",
        isFeatured: false,
        isNewArrival: false,
        dimensions: { width: "", height: "", depth: "" },
        weight: { value: "", unit: "kg" },
        materials: [],
        colors: [],
        productType: "",
        roomSlugs: [],
      });
      setModelInputType("url");
      setImageFiles([]);
      setImagePreviews([]);
      setModelFiles([]);
      setModelUrls([]);
      setExistingModelFiles([]);
      setNewModelUrl("");
    }
    setActiveTab("basic");
    setShowAllImages(false);
    setUploadProgress({});
    // The attributes section re-seeds from the product and reports
    // its resolution back through handleCatalogAttrChange.
    setCatalogAttrState({ resolved: [], values: {}, passthrough: {} });
    setShowAttrErrors(false);
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);

    // Create previews for new files with upload progress simulation
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result;
        setImagePreviews((prev) => [
          ...prev,
          { url: previewUrl, existing: false, file },
        ]);

        // Simulate upload progress
        setUploadProgress((prev) => ({ ...prev, [previewUrl]: 0 }));
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 25 + 10;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            // Remove from progress map after a short delay to show completion
            setTimeout(() => {
              setUploadProgress((prev) => {
                const next = { ...prev };
                delete next[previewUrl];
                return next;
              });
            }, 400);
          }
          setUploadProgress((prev) => ({
            ...prev,
            [previewUrl]: Math.min(progress, 100),
          }));
        }, 200);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleModelFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    addModelFiles(files);
  };

  const addModelFiles = (files) => {
    const validExtensions = [".glb", ".gltf", ".usdz"];
    const validFiles = [];

    for (const file of files) {
      const fileExtension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        toast.error(
          `Invalid file format: ${file.name}. Please upload .glb, .gltf, or .usdz files`,
        );
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File size exceeds 50MB limit: ${file.name}`);
        continue;
      }

      const format = fileExtension.replace(".", "");

      validFiles.push({
        file,
        name: file.name,
        size: file.size,
        format,
        platform: format === "usdz" ? "ios" : "android",
      });
    }

    if (validFiles.length > 0) {
      setModelFiles((prev) => [...prev, ...validFiles]);
      // Clear the URL input when files are uploaded
      setProductForm((prev) => ({ ...prev, modelUrl: "" }));
    }
  };

  const handleModelDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingModel(true);
  };

  const handleModelDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingModel(false);
  };

  const handleModelDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingModel(false);

    const files = Array.from(e.dataTransfer.files || []);
    addModelFiles(files);
  };

  const removeModelFile = (index, isExisting = false, isUrl = false) => {
    if (isExisting) {
      setExistingModelFiles((prev) => prev.filter((_, i) => i !== index));
    } else if (isUrl) {
      setModelUrls((prev) => prev.filter((_, i) => i !== index));
    } else {
      setModelFiles((prev) => prev.filter((_, i) => i !== index));
    }
    if (modelFileInputRef.current) {
      modelFileInputRef.current.value = "";
    }
  };

  const addModelUrl = () => {
    if (!newModelUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Validate URL format
    try {
      new URL(newModelUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    // Detect format from URL
    const url = newModelUrl.toLowerCase();
    let format = "";
    if (url.includes(".glb")) {
      format = "glb";
    } else if (url.includes(".gltf")) {
      format = "gltf";
    } else if (url.includes(".usdz")) {
      format = "usdz";
    } else {
      toast.error("URL must point to a .glb, .gltf, or .usdz file");
      return;
    }

    const platform = format === "usdz" ? "ios" : "android";

    setModelUrls((prev) => [
      ...prev,
      {
        url: newModelUrl.trim(),
        format,
        platform,
        isExternal: true,
      },
    ]);
    setNewModelUrl("");
  };

  const removeImage = (index) => {
    const preview = imagePreviews[index];
    if (preview.existing) {
      // Mark for removal on save
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      // Remove from new files
      setImageFiles((prev) =>
        prev.filter(
          (_, i) =>
            i !== index - imagePreviews.filter((p) => p.existing).length,
        ),
      );
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.category) {
      toast.error("Please fill in required fields");
      return;
    }

    // FE-45: price/stock go to the server as NUMBERS within its
    // bounds (price positive, stock integer >= 0 — product.validator).
    // The old code sent the raw input strings.
    const parsed = parseProductPriceStock(productForm);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }

    // Phase 6 (catalog): dynamic attributes validate client-side
    // with the same rules the server applies (required, bounds,
    // enum membership). A failure blocks the save, jumps to the
    // Attributes tab and shows the per-field errors there; the
    // server's own 400s still surface through the catch below.
    const missingAttrs = missingRequiredAttributes(
      catalogAttrState.resolved,
      catalogAttrState.values,
    );
    const builtAttrs = buildAttributesPayload(
      catalogAttrState.resolved,
      catalogAttrState.values,
      catalogAttrState.passthrough,
    );
    if (missingAttrs.length > 0 || Object.keys(builtAttrs.errors).length > 0) {
      setShowAttrErrors(true);
      setActiveTab("attributes");
      if (missingAttrs.length > 0) {
        toast.error(
          `Missing required attribute${missingAttrs.length > 1 ? "s" : ""}: ${missingAttrs
            .map((entry) => entry.label)
            .join(", ")}`,
        );
      } else {
        const [firstKey, firstError] = Object.entries(builtAttrs.errors)[0];
        toast.error(`${firstKey}: ${firstError}`);
      }
      return;
    }

    const formData = {
      name: productForm.name,
      category: productForm.category,
      price: parsed.values.price,
      stock: parsed.values.stock,
      status: productForm.status,
    };

    if (parsed.values.originalPrice !== undefined)
      formData.originalPrice = parsed.values.originalPrice;
    if (productForm.description) formData.description = productForm.description;
    if (productForm.shortDescription)
      formData.shortDescription = productForm.shortDescription;
    if (productForm.modelUrl) formData.modelUrl = productForm.modelUrl;
    if (productForm.sku) formData.sku = productForm.sku;
    if (productForm.style) formData.style = productForm.style;
    formData.isFeatured = productForm.isFeatured;
    formData.isNewArrival = productForm.isNewArrival;

    if (
      productForm.dimensions.width ||
      productForm.dimensions.height ||
      productForm.dimensions.depth
    ) {
      formData.dimensions = productForm.dimensions;
    }
    if (productForm.weight.value) {
      formData.weight = productForm.weight;
    }
    formData.materials = productForm.materials;
    formData.colors = productForm.colors;

    // Phase 6 (catalog): product type ("" clears an override),
    // rooms, and the dynamic attribute values built above.
    formData.productType = productForm.productType || "";
    formData.roomSlugs = productForm.roomSlugs;
    if (editingProduct || Object.keys(builtAttrs.payload).length > 0) {
      formData.catalogAttributes = builtAttrs.payload;
    }

    // Add new images
    if (imageFiles.length > 0) {
      formData.images = imageFiles;
    }

    // Add 3D model files if uploaded
    if (modelFiles.length > 0) {
      formData.modelFiles = modelFiles.map((m) => m.file);
    }

    // Add 3D model URLs
    if (modelUrls.length > 0) {
      formData.modelUrls = modelUrls.map((m) => ({
        url: m.url,
        format: m.format,
        platform: m.platform,
      }));
    }

    // Track removed images for update
    if (editingProduct) {
      const existingUrls = editingProduct.images?.map((img) => img.url) || [];
      const remainingUrls = imagePreviews
        .filter((p) => p.existing)
        .map((p) => p.originalUrl);
      const removedImages = existingUrls.filter(
        (url) => !remainingUrls.includes(url),
      );
      if (removedImages.length > 0) {
        formData.removeImages = removedImages;
      }

      // Track removed model files for update
      const existingModelUrls =
        editingProduct.modelFiles?.map((m) => m.url) || [];
      const remainingModelUrls = existingModelFiles.map((m) => m.url);
      const removedModelFiles = existingModelUrls.filter(
        (url) => !remainingModelUrls.includes(url),
      );
      if (removedModelFiles.length > 0) {
        formData.removeModelFiles = removedModelFiles;
      }
    }

    try {
      if (editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct._id,
          data: formData,
        });
        toast.success("Product updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Product created successfully");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(formatError(err, "Something went wrong"));
    }
  };

  const handleToggle = (field, value) => {
    if (field === "colors" || field === "materials") {
      setProductForm((prev) => ({
        ...prev,
        [field]: prev[field].includes(value)
          ? prev[field].filter((v) => v !== value)
          : [...prev[field], value],
      }));
    }
  };

  return {
    fileInputRef,
    modelFileInputRef,
    modalOpen,
    setModalOpen,
    editingProduct,
    activeTab,
    setActiveTab,
    modelInputType,
    setModelInputType,
    imageFiles,
    imagePreviews,
    uploadProgress,
    showAllImages,
    setShowAllImages,
    modelFiles,
    modelUrls,
    existingModelFiles,
    isDraggingModel,
    materialInput,
    setMaterialInput,
    newModelUrl,
    setNewModelUrl,
    productForm,
    setProductForm,
    catalogAttrState,
    showAttrErrors,
    handleCatalogAttrChange,
    storedCatalogAttributes,
    createMutation,
    updateMutation,
    handleOpenModal,
    handleImageChange,
    handleModelFileChange,
    handleModelDragOver,
    handleModelDragLeave,
    handleModelDrop,
    removeModelFile,
    addModelUrl,
    removeImage,
    handleSaveProduct,
    handleAddColor,
    handleEditColor,
    handleToggle,
  };
}
