import { API_V1_URL, SOCKET_URL } from '../config/constants';
import { validateMediaUrl, isAbsoluteUrlCandidate, cleanUrlValue } from './safeUrl';

/**
 * Centralized image URL construction utility
 * Handles external URLs, Unsplash photo IDs, and local uploads
 *
 * FE-03: every absolute URL now routes through validateMediaUrl
 * (src/utils/safeUrl.js) — https + host allowlist, never a verbatim
 * passthrough. Rejected values resolve to the caller's fallback.
 */

const API_BASE_URL = API_V1_URL;
const UPLOADS_BASE_URL = SOCKET_URL;
const UNSPLASH_BASE_URL = "https://images.unsplash.com";

// Default fallback images
export const FALLBACK_IMAGES = {
  product: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop",
  avatar: null, // FE-06: no placeholder service — InitialsAvatar renders locally
  blog: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80",
  category: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop",
  chat: null
};

/**
 * Check if URL is an Unsplash photo ID
 */
const isUnsplashPhotoId = (url) => {
  return typeof url === "string" && url.startsWith("photo-");
};

/**
 * Construct full image URL from a path
 * @param {string} path - Image path or URL
 * @param {string} type - Type of image: 'products', 'avatars', 'categories', 'blogs', 'models', 'chat'
 * @param {string} fallback - Fallback URL if path is empty
 * @returns {string} Full image URL
 */
export const getImageUrl = (path, type = "products", fallback = null) => {
  const resolveFallback = () =>
    fallback || FALLBACK_IMAGES[type.replace(/s$/, "")] || FALLBACK_IMAGES.product;

  // Return fallback if no path
  if (typeof path !== "string" || !path.trim()) {
    return resolveFallback();
  }

  path = path.trim();

  // FE-03: absolute URLs (any scheme, protocol-relative, backslash-led)
  // are validated against the allowlist — never returned verbatim.
  if (isAbsoluteUrlCandidate(path)) {
    return validateMediaUrl(path, { fallback: resolveFallback() });
  }

  // Handle Cloudinary URLs that might be missing the protocol
  // (defensive). FE-03: this is a HOST check now, not a substring
  // check — "res.cloudinary.com" anywhere else in the string (an
  // attacker host ending in that label, or a path segment on another
  // host) is validated as the absolute URL it actually is and
  // rejected to the fallback.
  if (path.includes('res.cloudinary.com')) {
    const candidate = path.startsWith('//') ? `https:${path}` : `https://${path}`;
    return validateMediaUrl(candidate, { fallback: resolveFallback() });
  }

  // If it's an Unsplash photo ID, construct full Unsplash URL
  if (isUnsplashPhotoId(path)) {
    if (path.includes("?")) {
      return `${UNSPLASH_BASE_URL}/${path}`;
    }
    return `${UNSPLASH_BASE_URL}/${path}?auto=format&fit=crop&w=800&q=80`;
  }

  // Remove potential leading slashes
  let cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // If the path already includes 'uploads/', assume it's a full path from root
  if (cleanPath.startsWith("uploads/")) {
    return `${UPLOADS_BASE_URL}/${cleanPath}`;
  }

  // If the path already includes the type (e.g., 'products/'), prepend 'uploads/'
  if (cleanPath.startsWith(`${type}/`)) {
    return `${UPLOADS_BASE_URL}/uploads/${cleanPath}`;
  }

  // Otherwise, construct full path with uploads/ and type/
  return `${UPLOADS_BASE_URL}/uploads/${type}/${cleanPath}`;
};

/**
 * FE-54 — sized variants for responsive images.
 *
 * The standard responsive widths for content imagery. Every variant
 * is a REAL transform of the source — a different width AND WebP
 * format — never the same file re-labelled with a new width.
 */
export const IMAGE_VARIANT_WIDTHS = [600, 1200, 1920];

/**
 * Only hosts with a KNOWN transform scheme are rewritten:
 *  - res.cloudinary.com: a transformation segment
 *    `w_<width>,q_auto,f_webp` is applied immediately after
 *    `/image/upload/` (before any version segment / public id). When
 *    the URL already carries a transformation segment, its size,
 *    quality and format params (w/q/f/dpr) are REPLACED with the
 *    requested ones — any other params (crop, gravity, …) are kept —
 *    so every requested width yields a genuinely different file
 *    instead of collapsing to the one pre-baked variant.
 *  - images.unsplash.com / plus.unsplash.com (imgix): the `w` query
 *    param is set to the requested width and `fm=webp` forces WebP
 *    delivery (the `auto=format` param is dropped — `fm` wins).
 * Every other host (the app's own uploads origin, S3, …) has no known
 * scheme here: the resolved URL is returned BYTE-IDENTICAL, never
 * corrupted with a guessed parameter.
 *
 * The input first goes through getImageUrl, so all FE-03 validation
 * applies unchanged: hostile / non-allowlisted values resolve to the
 * caller's fallback BEFORE any transform is considered, and a
 * transform is only ever applied to a validated URL.
 */
const CLOUDINARY_TRANSFORM_SEGMENT = /^([a-z]{1,3}_[^,/]+)(,[a-z]{1,3}_[^,/]+)*$/;

function applySizeTransform(resolvedUrl, width) {
  let url;
  try {
    url = new URL(resolvedUrl);
  } catch {
    return resolvedUrl; // site-relative resolved path — no scheme to apply
  }

  if (url.hostname === "res.cloudinary.com") {
    const marker = "/image/upload/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return resolvedUrl;
    const afterUpload = url.pathname.slice(markerIndex + marker.length);
    const segments = afterUpload.split("/");
    const firstSegment = segments[0];
    // A first segment counts as an existing transformation only when
    // it is comma-joined or carries a size/format param — a lone
    // folder name that merely looks like `key_value` is path, not a
    // transform, and stays in place.
    const looksLikeTransform =
      CLOUDINARY_TRANSFORM_SEGMENT.test(firstSegment) &&
      (firstSegment.includes(",") || /^(w|q|f|dpr)_/.test(firstSegment));
    let keptParams = [];
    if (looksLikeTransform) {
      keptParams = firstSegment
        .split(",")
        .filter((param) => !["w", "q", "f", "dpr"].includes(param.split("_")[0]));
      segments.shift();
    }
    const transform = [`w_${width}`, "q_auto", "f_webp", ...keptParams].join(",");
    url.pathname =
      url.pathname.slice(0, markerIndex + marker.length) +
      transform +
      "/" +
      segments.join("/");
    return url.href;
  }

  if (url.hostname === "images.unsplash.com" || url.hostname === "plus.unsplash.com") {
    url.searchParams.set("w", String(width));
    url.searchParams.set("fm", "webp");
    url.searchParams.delete("auto");
    if (!url.searchParams.has("q")) url.searchParams.set("q", "80");
    return url.href;
  }

  return resolvedUrl;
}

function sanitizeWidth(width) {
  const w = Math.round(Number(width));
  return Number.isFinite(w) && w > 0 ? w : null;
}

/**
 * Resolve an image and, where the host supports it, request a variant
 * of the given pixel width. Invalid widths return the resolved URL
 * unchanged.
 */
export const getSizedImageUrl = (path, width, options = {}) => {
  const { type = "products", fallback = null } = options;
  const resolved = getImageUrl(path, type, fallback);
  const w = sanitizeWidth(width);
  if (!w || typeof resolved !== "string") return resolved;
  return applySizeTransform(resolved, w);
};

/**
 * Build a srcSet string from the sized variants, or undefined when
 * the host has no transform scheme (every variant would be the same
 * URL — a srcSet of identical URLs would lie to the browser).
 */
export const buildImageSrcSet = (path, widths, options = {}) => {
  if (!Array.isArray(widths) || widths.length === 0) return undefined;
  const seen = new Set();
  const entries = [];
  for (const width of widths) {
    const w = sanitizeWidth(width);
    if (!w) continue;
    const url = getSizedImageUrl(path, w, options);
    if (typeof url !== "string" || seen.has(url)) continue;
    seen.add(url);
    entries.push(`${url} ${w}w`);
  }
  return entries.length >= 2 ? entries.join(", ") : undefined;
};

const primaryImagePath = (product) =>
  product?.images?.find((img) => img.isPrimary)?.url ||
  product?.images?.[0]?.url ||
  product?.primaryImage ||
  product?.image;

/**
 * Get product image URL
 */
export const getProductImageUrl = (product, fallback = null) => {
  // FE-03: no external-URL short-circuit — getImageUrl validates
  // absolute values through validateMediaUrl and joins relative ones.
  return getImageUrl(primaryImagePath(product), "products", fallback || FALLBACK_IMAGES.product);
};

/**
 * FE-54: srcSet for a product's primary image (see buildImageSrcSet —
 * undefined when the image's host has no transform scheme).
 */
export const getProductImageSrcSet = (product, widths = IMAGE_VARIANT_WIDTHS, fallback = null) => {
  return buildImageSrcSet(primaryImagePath(product), widths, {
    type: "products",
    fallback: fallback || FALLBACK_IMAGES.product,
  });
};

/**
 * Get avatar URL for a user.
 *
 * FE-06: returns ONLY a real, validated avatar URL or null. The
 * previous implementation built an external placeholder-service
 * URL carrying the user's full name for every avatar-less user —
 * customer PII leaving for a third party on every render. Callers
 * render <UserAvatar> / <InitialsAvatar>
 * (src/components/common/InitialsAvatar.jsx) on null; no URL is
 * ever constructed from a name.
 *
 * A stored avatar value that fails media validation also yields
 * null here (getImageUrl would otherwise substitute the product
 * fallback photo, which is not an avatar): absolute values are
 * validated directly, relative values keep the uploads-joining
 * behaviour.
 */
export const getAvatarUrl = (user) => {
  const avatar = user?.avatar;
  if (typeof avatar !== "string" || !avatar.trim()) return null;
  if (isAbsoluteUrlCandidate(avatar)) {
    return validateMediaUrl(avatar, { fallback: null });
  }
  if (cleanUrlValue(avatar)?.includes("res.cloudinary.com")) {
    return validateMediaUrl(`https://${cleanUrlValue(avatar)}`, {
      fallback: null,
    });
  }
  return getImageUrl(avatar, "avatars");
};

/**
 * Get blog image URL
 */
export const getBlogImageUrl = (imagePath) => {
  return getImageUrl(imagePath, "blogs", FALLBACK_IMAGES.blog);
};

/**
 * Get category image URL
 */
export const getCategoryImageUrl = (imagePath) => {
  return getImageUrl(imagePath, "categories", FALLBACK_IMAGES.category);
};

/**
 * Get chat attachment URL
 */
export const getChatImageUrl = (imagePath) => {
  return getImageUrl(imagePath, "chat");
};

/**
 * Resolve one AR model URL. Absolute values must pass
 * validateMediaUrl (the S3/Cloudinary/API allowlist); relative values
 * keep the uploads-joining behaviour. A rejected absolute value is
 * null — never the product-image fallback (a JPEG is not a GLB).
 */
const resolveModelUrl = (rawUrl) => {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) return null;
  if (isAbsoluteUrlCandidate(rawUrl)) {
    return validateMediaUrl(rawUrl, { fallback: null });
  }
  if (cleanUrlValue(rawUrl)?.includes('res.cloudinary.com')) {
    return validateMediaUrl(`https://${cleanUrlValue(rawUrl)}`, { fallback: null });
  }
  return getImageUrl(rawUrl, "models");
};

/**
 * Get model URL for AR
 */
export const getModelUrl = (product, format = null) => {
  if (product?.modelFiles?.length > 0) {
    let model;
    if (format) {
      model = product.modelFiles.find(m => m.format === format);
    } else {
      model = product.modelFiles.find(m => m.format === "glb" || m.format === "gltf");
    }

    if (model) {
      return resolveModelUrl(model.url);
    }
  }

  if (product?.modelUrl) {
    return resolveModelUrl(product.modelUrl);
  }

  return null;
};

export default {
  getImageUrl,
  getSizedImageUrl,
  buildImageSrcSet,
  getProductImageUrl,
  getProductImageSrcSet,
  getAvatarUrl,
  getBlogImageUrl,
  getCategoryImageUrl,
  getChatImageUrl,
  getModelUrl,
  FALLBACK_IMAGES,
  IMAGE_VARIANT_WIDTHS,
};
