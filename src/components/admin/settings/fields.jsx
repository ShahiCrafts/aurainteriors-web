import { useState } from "react";
import { Upload, Facebook, Instagram, Youtube, Twitter, Linkedin, Music2, MessageCircle, Pin } from "lucide-react";
import settingsApi from "../../../api/settingsApi";
import { toast } from "../../../lib/toast";
import formatError from "../../../utils/errorHandler";
import { inputClass, smallButtonClass, Field } from "./ui";

// Shared field components for the Settings tabs (Batch 3d).

export function UploadButton({ label, onUploaded, ariaLabel }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const res = await settingsApi.uploadSettingsImage(file);
      if (res?.data?.url) onUploaded(res.data.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(formatError(err, "Image upload failed"));
    } finally {
      setUploading(false);
    }
  };
  return (
    <label
      className={`${smallButtonClass} shrink-0 cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
    >
      <Upload className="w-4 h-4" />
      {uploading ? "Uploading…" : label}
      <input
        type="file"
        accept="image/*"
        aria-label={ariaLabel}
        onChange={handleFile}
        className="hidden"
      />
    </label>
  );
}

// URL text input + upload button (the 3a ImageField, restyled).
export function ImageField({ label, value, onChange, helper }) {
  return (
    <Field label={label} helper={helper}>
      <div className="flex gap-2">
        <input
          type="text"
          aria-label={label}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        <UploadButton
          label="Upload"
          ariaLabel={`Upload ${label}`}
          onUploaded={onChange}
        />
      </div>
    </Field>
  );
}

// Colour control in the reference style: round swatch (native
// picker), hex text input. Aria labels keep the 3a test contract:
// "<Label> picker" and "<Label> hex".
export function ColorField({ label, value, onChange }) {
  const valid = /^#[0-9a-fA-F]{6}$/.test(value || "");
  return (
    <Field label={label}>
      <div className="flex items-center gap-2.5 border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand">
        <span className="relative w-7 h-7 shrink-0 rounded-full border border-gray-200 overflow-hidden">
          <span
            className="absolute inset-0"
            style={{ backgroundColor: valid ? value : "#ffffff" }}
          />
          <input
            type="color"
            aria-label={`${label} picker`}
            value={valid ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </span>
        <input
          type="text"
          aria-label={`${label} hex`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#F27318"
          className="w-full text-sm text-gray-900 focus:outline-none uppercase"
        />
      </div>
    </Field>
  );
}

// Social platforms the contact section supports, with brand chip
// colours (lucide has no TikTok/Pinterest/WhatsApp glyphs — the
// closest generic icons stand in, on the brand colour).
export const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook", Icon: Facebook, chip: "#1877F2" },
  { key: "instagram", label: "Instagram", Icon: Instagram, chip: "#E1306C" },
  { key: "tiktok", label: "TikTok", Icon: Music2, chip: "#000000" },
  { key: "youtube", label: "YouTube", Icon: Youtube, chip: "#FF0000" },
  { key: "pinterest", label: "Pinterest", Icon: Pin, chip: "#E60023" },
  { key: "whatsapp", label: "WhatsApp", Icon: MessageCircle, chip: "#25D366" },
  { key: "twitter", label: "Twitter / X", Icon: Twitter, chip: "#000000" },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin, chip: "#0A66C2" },
];

export function SocialChip({ platform }) {
  const { Icon, chip } = platform;
  return (
    <span
      className="flex items-center justify-center w-8 h-8 rounded-lg text-white shrink-0"
      style={{ backgroundColor: chip }}
      aria-hidden="true"
    >
      <Icon className="w-4 h-4" />
    </span>
  );
}
