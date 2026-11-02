import { useEffect } from "react";
import { applyHead } from "../../seo/seo.js";

export default function Seo({ title, description, path, image, type, noindex, jsonLd }) {
  useEffect(() => {
    applyHead({ title, description, path, image, type, noindex, jsonLd });
  }, [title, description, path, image, type, noindex, JSON.stringify(jsonLd || [])]);
  return null;
}
