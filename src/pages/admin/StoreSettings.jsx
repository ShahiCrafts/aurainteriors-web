import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Upload,
  Store,
} from "lucide-react";
import settingsApi from "../../api/settingsApi";
import { toast } from "../../lib/toast";
import formatError from "../../utils/errorHandler";

// Batch 3a — admin Store Settings page. Edits the Batch 1 settings
// sections identity / theme / contact / homepage / pages / seo via
// PUT /admin/settings/:section. Every default below mirrors the
// server defaults (services/settings/defaults.js), which in turn
// mirror the site's current live values — saving without changes is
// a no-op for the storefront.

const FONTS = [
  "DM Sans",
  "Inter",
  "Poppins",
  "Montserrat",
  "Roboto",
  "Lato",
  "Open Sans",
  "Playfair Display",
];

const BUTTON_RADIUS_OPTIONS = [
  { value: "rounded", label: "Rounded (current look)" },
  { value: "square", label: "Square" },
  { value: "pill", label: "Pill" },
];
const RADIUS_CSS = { rounded: "0.5rem", square: "0", pill: "9999px" };

const HOMEPAGE_SECTION_LABELS = {
  hero: "Hero",
  trustBanner: "Trust banner",
  shopByCategory: "Shop by category",
  featuredPieces: "Featured pieces",
  testimonials: "Testimonials",
};

const TABS = [
  { key: "identity", label: "Identity" },
  { key: "theme", label: "Theme" },
  { key: "contact", label: "Contact & Socials" },
  { key: "homepage", label: "Homepage" },
  { key: "pages", label: "Content Pages" },
  { key: "seo", label: "SEO" },
];

function defaultSettings() {
  return {
    identity: {
      storeName: "",
      tagline: "",
      supportEmail: "",
      logoUrl: "",
      logoDarkUrl: "",
      faviconUrl: "",
    },
    theme: {
      primaryColor: "#F27318",
      primaryHoverColor: "#D9620E",
      navyColor: "#1E2C4A",
      fontFamily: "DM Sans",
      buttonRadius: "rounded",
    },
    contact: {
      email: "",
      phone: "",
      address: "",
      hours: "",
      mapUrl: "",
      socials: {
        facebook: "",
        instagram: "",
        youtube: "",
        pinterest: "",
        tiktok: "",
        whatsapp: "",
        twitter: "",
        linkedin: "",
      },
    },
    homepage: {
      sections: {
        hero: true,
        trustBanner: true,
        shopByCategory: true,
        featuredPieces: true,
        testimonials: true,
      },
      sectionsOrder: [
        "hero",
        "trustBanner",
        "shopByCategory",
        "featuredPieces",
        "testimonials",
      ],
      heroSlides: [],
      promoBanner: {
        imageUrl: "",
        headline: "",
        subtext: "",
        buttonText: "",
        buttonLink: "",
        enabled: true,
      },
      announcementsEnabled: true,
      newsletterEnabled: true,
    },
    pages: {
      about: "",
      privacyPolicy: "",
      terms: "",
      shippingReturns: "",
      faq: [],
    },
    seo: {
      defaultTitle: "",
      metaDescription: "",
      ogImage: "",
    },
  };
}

function mergeSettings(fetched) {
  const base = defaultSettings();
  if (!fetched || typeof fetched !== "object") return base;
  const merged = { ...base };
  for (const section of Object.keys(base)) {
    if (!fetched[section] || typeof fetched[section] !== "object") continue;
    merged[section] = { ...base[section], ...fetched[section] };
  }
  merged.contact.socials = {
    ...base.contact.socials,
    ...(fetched.contact?.socials || {}),
  };
  merged.homepage.sections = {
    ...base.homepage.sections,
    ...(fetched.homepage?.sections || {}),
  };
  merged.homepage.promoBanner = {
    ...base.homepage.promoBanner,
    ...(fetched.homepage?.promoBanner || {}),
  };
  if (!Array.isArray(merged.homepage.heroSlides)) {
    merged.homepage.heroSlides = [];
  }
  if (!Array.isArray(merged.homepage.sectionsOrder)) {
    merged.homepage.sectionsOrder = base.homepage.sectionsOrder;
  }
  if (!Array.isArray(merged.pages.faq)) merged.pages.faq = [];
  return merged;
}

const inputClass =
  "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500";
const selectClass = `${inputClass} bg-white`;
const textareaClass = `${inputClass} min-h-28`;
const saveButtonClass =
  "inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50";
const smallButtonClass =
  "inline-flex items-center gap-1 px-3 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50";
const iconButtonClass =
  "p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40";

function Field({ label, children, helper }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {children}
      {helper && <p className="text-xs text-gray-400 mt-1">{helper}</p>}
    </div>
  );
}

// Text input + upload button; uploads go through the existing
// settings image endpoint (server category-image → Cloudinary
// pipeline) and the returned URL replaces the field value.
function ImageField({ label, value, onChange, helper }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const res = await settingsApi.uploadSettingsImage(file);
      if (res?.data?.url) onChange(res.data.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(formatError(err, "Image upload failed"));
    } finally {
      setUploading(false);
    }
  };
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
        <label
          className={`${smallButtonClass} shrink-0 cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept="image/*"
            aria-label={`Upload ${label}`}
            onChange={handleFile}
            className="hidden"
          />
        </label>
      </div>
    </Field>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={/^#[0-9a-fA-F]{6}$/.test(value || "") ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 shrink-0 border border-gray-200 rounded-xl bg-white cursor-pointer"
        />
        <input
          type="text"
          aria-label={`${label} hex`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#F27318"
          className={inputClass}
        />
      </div>
    </Field>
  );
}

function MoveButtons({ label, index, count, onMove }) {
  return (
    <span className="flex gap-1">
      <button
        type="button"
        aria-label={`Move ${label} up`}
        onClick={() => onMove(index, -1)}
        disabled={index === 0}
        className={iconButtonClass}
      >
        <ArrowUp className="w-4 h-4 text-gray-500" />
      </button>
      <button
        type="button"
        aria-label={`Move ${label} down`}
        onClick={() => onMove(index, 1)}
        disabled={index === count - 1}
        className={iconButtonClass}
      >
        <ArrowDown className="w-4 h-4 text-gray-500" />
      </button>
    </span>
  );
}

const emptySlide = () => ({
  imageUrl: "",
  headline: "",
  subtext: "",
  buttonText: "",
  buttonLink: "",
  enabled: true,
});

export default function StoreSettings() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState("identity");
  const [settings, setSettings] = useState(defaultSettings);
  const [savingSection, setSavingSection] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getSettings();
      setSettings(mergeSettings(res?.data?.settings));
      setLoadError(null);
    } catch (err) {
      setLoadError(formatError(err, "Failed to load store settings"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patchSection = (section, patch) =>
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...patch },
    }));

  const save = async (section, payload) => {
    setSavingSection(section);
    try {
      await settingsApi.updateSettingsSection(section, payload);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(formatError(err, "Failed to save settings"));
    } finally {
      setSavingSection(null);
    }
  };

  const saveButton = (section, label) => (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => save(section, settings[section])}
        disabled={savingSection === section}
        className={saveButtonClass}
      >
        {savingSection === section ? "Saving…" : label}
      </button>
    </div>
  );

  // ---- homepage helpers -------------------------------------------------
  const patchSlide = (index, field, value) =>
    patchSection("homepage", {
      heroSlides: settings.homepage.heroSlides.map((slide, i) =>
        i === index ? { ...slide, [field]: value } : slide,
      ),
    });

  const moveSlide = (index, delta) => {
    const next = [...settings.homepage.heroSlides];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    patchSection("homepage", { heroSlides: next });
  };

  const moveSectionOrder = (index, delta) => {
    const next = [...settings.homepage.sectionsOrder];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    patchSection("homepage", { sectionsOrder: next });
  };

  // ---- faq helpers --------------------------------------------------------
  const patchFaq = (index, field, value) =>
    patchSection("pages", {
      faq: settings.pages.faq.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-playfair">
            Store Settings
          </h1>
          <p className="text-gray-500 mt-1 font-dm-sans">
            Loading store settings…
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-playfair">
            Store Settings
          </h1>
          <p className="text-red-600 mt-2 font-dm-sans">{loadError}</p>
          <button onClick={load} className={`${saveButtonClass} mt-4`}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { identity, theme, contact, homepage, pages, seo } = settings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-playfair">
          Store Settings
        </h1>
        <p className="text-gray-500 mt-1 font-dm-sans">
          Your store's identity, look, homepage and content pages. Changes
          apply to the storefront the next time it loads its settings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Store settings sections">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={
              tab === key
                ? "px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium transition-colors"
                : "px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        {tab === "identity" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Store name">
                <input
                  type="text"
                  aria-label="Store name"
                  value={identity.storeName}
                  onChange={(e) =>
                    patchSection("identity", { storeName: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Tagline">
                <input
                  type="text"
                  aria-label="Tagline"
                  value={identity.tagline}
                  onChange={(e) =>
                    patchSection("identity", { tagline: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Support email">
                <input
                  type="email"
                  aria-label="Support email"
                  value={identity.supportEmail}
                  onChange={(e) =>
                    patchSection("identity", { supportEmail: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            <ImageField
              label="Logo URL"
              value={identity.logoUrl}
              onChange={(v) => patchSection("identity", { logoUrl: v })}
            />
            <ImageField
              label="Dark logo URL"
              value={identity.logoDarkUrl}
              onChange={(v) => patchSection("identity", { logoDarkUrl: v })}
              helper="Optional logo variant for dark backgrounds."
            />
            <ImageField
              label="Favicon URL"
              value={identity.faviconUrl}
              onChange={(v) => patchSection("identity", { faviconUrl: v })}
            />
            {saveButton("identity", "Save identity")}
          </>
        )}

        {tab === "theme" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <ColorField
                  label="Primary colour"
                  value={theme.primaryColor}
                  onChange={(v) =>
                    patchSection("theme", { primaryColor: v })
                  }
                />
                <ColorField
                  label="Primary hover colour"
                  value={theme.primaryHoverColor}
                  onChange={(v) =>
                    patchSection("theme", { primaryHoverColor: v })
                  }
                />
                <ColorField
                  label="Navy / header colour"
                  value={theme.navyColor}
                  onChange={(v) => patchSection("theme", { navyColor: v })}
                />
                <Field label="Font">
                  <select
                    aria-label="Font"
                    value={theme.fontFamily}
                    onChange={(e) =>
                      patchSection("theme", { fontFamily: e.target.value })
                    }
                    className={selectClass}
                  >
                    {FONTS.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Button style">
                  <select
                    aria-label="Button style"
                    value={theme.buttonRadius}
                    onChange={(e) =>
                      patchSection("theme", { buttonRadius: e.target.value })
                    }
                    className={selectClass}
                  >
                    {BUTTON_RADIUS_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Live preview — local unsaved values only */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Live preview
                </h3>
                <div
                  data-testid="theme-preview"
                  className="border border-gray-200 rounded-2xl overflow-hidden"
                  style={{ fontFamily: theme.fontFamily }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ backgroundColor: theme.navyColor }}
                  >
                    <span className="text-white font-semibold text-sm">
                      {identity.storeName || "Store"}
                    </span>
                    <span
                      className="text-white text-xs px-3 py-1.5 font-medium"
                      style={{
                        backgroundColor: theme.primaryColor,
                        borderRadius:
                          RADIUS_CSS[theme.buttonRadius] || "0.5rem",
                      }}
                    >
                      Shop now
                    </span>
                  </div>
                  <div className="p-4 space-y-3 bg-white">
                    <p className="text-sm font-semibold text-gray-900">
                      Featured piece
                    </p>
                    <p className="text-sm text-gray-500">
                      Buttons and accents update as you edit — nothing is
                      saved until you click Save theme.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        data-testid="preview-primary-button"
                        className="text-white text-sm px-4 py-2 font-medium"
                        style={{
                          backgroundColor: theme.primaryColor,
                          borderRadius:
                            RADIUS_CSS[theme.buttonRadius] || "0.5rem",
                        }}
                      >
                        Add to cart
                      </button>
                      <span
                        className="text-xs px-2 py-1 text-white"
                        style={{
                          backgroundColor: theme.primaryHoverColor,
                          borderRadius:
                            RADIUS_CSS[theme.buttonRadius] || "0.5rem",
                        }}
                      >
                        Hover colour
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {saveButton("theme", "Save theme")}
          </>
        )}

        {tab === "contact" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone">
                <input
                  type="text"
                  aria-label="Phone"
                  value={contact.phone}
                  onChange={(e) =>
                    patchSection("contact", { phone: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  type="text"
                  aria-label="WhatsApp"
                  value={contact.socials.whatsapp}
                  onChange={(e) =>
                    patchSection("contact", {
                      socials: {
                        ...contact.socials,
                        whatsapp: e.target.value,
                      },
                    })
                  }
                  placeholder="Number or wa.me link"
                  className={inputClass}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  aria-label="Contact email"
                  value={contact.email}
                  onChange={(e) =>
                    patchSection("contact", { email: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Opening hours">
                <input
                  type="text"
                  aria-label="Opening hours"
                  value={contact.hours}
                  onChange={(e) =>
                    patchSection("contact", { hours: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Address">
                <input
                  type="text"
                  aria-label="Address"
                  value={contact.address}
                  onChange={(e) =>
                    patchSection("contact", { address: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Map link">
                <input
                  type="text"
                  aria-label="Map link"
                  value={contact.mapUrl}
                  onChange={(e) =>
                    patchSection("contact", { mapUrl: e.target.value })
                  }
                  placeholder="https://maps.google.com/…"
                  className={inputClass}
                />
              </Field>
            </div>
            <h3 className="text-sm font-medium text-gray-700">Social links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ["facebook", "Facebook URL"],
                ["instagram", "Instagram URL"],
                ["tiktok", "TikTok URL"],
                ["youtube", "YouTube URL"],
                ["twitter", "Twitter / X URL"],
                ["linkedin", "LinkedIn URL"],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    type="text"
                    aria-label={label}
                    value={contact.socials[key] || ""}
                    onChange={(e) =>
                      patchSection("contact", {
                        socials: {
                          ...contact.socials,
                          [key]: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
              ))}
            </div>
            {saveButton("contact", "Save contact & socials")}
          </>
        )}

        {tab === "homepage" && (
          <>
            <h3 className="text-sm font-medium text-gray-700">Hero slides</h3>
            <div className="space-y-4">
              {homepage.heroSlides.map((slide, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-2xl p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Slide {index + 1}
                    </span>
                    <span className="flex items-center gap-1">
                      <MoveButtons
                        label={`slide ${index + 1}`}
                        index={index}
                        count={homepage.heroSlides.length}
                        onMove={moveSlide}
                      />
                      <button
                        type="button"
                        aria-label={`Remove slide ${index + 1}`}
                        onClick={() =>
                          patchSection("homepage", {
                            heroSlides: homepage.heroSlides.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                        className={iconButtonClass}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </span>
                  </div>
                  <ImageField
                    label={`Slide ${index + 1} image URL`}
                    value={slide.imageUrl}
                    onChange={(v) => patchSlide(index, "imageUrl", v)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Headline">
                      <input
                        type="text"
                        aria-label={`Slide ${index + 1} headline`}
                        value={slide.headline || ""}
                        onChange={(e) =>
                          patchSlide(index, "headline", e.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Button text">
                      <input
                        type="text"
                        aria-label={`Slide ${index + 1} button text`}
                        value={slide.buttonText || ""}
                        onChange={(e) =>
                          patchSlide(index, "buttonText", e.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <Field label="Subtext">
                    <textarea
                      aria-label={`Slide ${index + 1} subtext`}
                      value={slide.subtext || ""}
                      onChange={(e) =>
                        patchSlide(index, "subtext", e.target.value)
                      }
                      className={textareaClass}
                    />
                  </Field>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Button link">
                      <input
                        type="text"
                        aria-label={`Slide ${index + 1} button link`}
                        value={slide.buttonLink || ""}
                        onChange={(e) =>
                          patchSlide(index, "buttonLink", e.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Visible">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700 pt-2">
                        <input
                          type="checkbox"
                          aria-label={`Slide ${index + 1} enabled`}
                          checked={slide.enabled !== false}
                          onChange={(e) =>
                            patchSlide(index, "enabled", e.target.checked)
                          }
                          className="w-4 h-4 accent-teal-600"
                        />
                        Enabled
                      </label>
                    </Field>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                patchSection("homepage", {
                  heroSlides: [...homepage.heroSlides, emptySlide()],
                })
              }
              className={smallButtonClass}
            >
              <Plus className="w-4 h-4" /> Add slide
            </button>

            <h3 className="text-sm font-medium text-gray-700 pt-2">
              Promo banner
            </h3>
            <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
              <ImageField
                label="Promo image URL"
                value={homepage.promoBanner.imageUrl}
                onChange={(v) =>
                  patchSection("homepage", {
                    promoBanner: { ...homepage.promoBanner, imageUrl: v },
                  })
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Promo headline">
                  <input
                    type="text"
                    aria-label="Promo headline"
                    value={homepage.promoBanner.headline || ""}
                    onChange={(e) =>
                      patchSection("homepage", {
                        promoBanner: {
                          ...homepage.promoBanner,
                          headline: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Promo button text">
                  <input
                    type="text"
                    aria-label="Promo button text"
                    value={homepage.promoBanner.buttonText || ""}
                    onChange={(e) =>
                      patchSection("homepage", {
                        promoBanner: {
                          ...homepage.promoBanner,
                          buttonText: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Promo subtext">
                <textarea
                  aria-label="Promo subtext"
                  value={homepage.promoBanner.subtext || ""}
                  onChange={(e) =>
                    patchSection("homepage", {
                      promoBanner: {
                        ...homepage.promoBanner,
                        subtext: e.target.value,
                      },
                    })
                  }
                  className={textareaClass}
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Promo button link">
                  <input
                    type="text"
                    aria-label="Promo button link"
                    value={homepage.promoBanner.buttonLink || ""}
                    onChange={(e) =>
                      patchSection("homepage", {
                        promoBanner: {
                          ...homepage.promoBanner,
                          buttonLink: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Visible">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 pt-2">
                    <input
                      type="checkbox"
                      aria-label="Promo enabled"
                      checked={homepage.promoBanner.enabled !== false}
                      onChange={(e) =>
                        patchSection("homepage", {
                          promoBanner: {
                            ...homepage.promoBanner,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-teal-600"
                    />
                    Enabled
                  </label>
                </Field>
              </div>
            </div>

            <h3 className="text-sm font-medium text-gray-700 pt-2">
              Homepage sections
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                {Object.keys(HOMEPAGE_SECTION_LABELS).map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      aria-label={`Show ${HOMEPAGE_SECTION_LABELS[key]}`}
                      checked={homepage.sections[key] !== false}
                      onChange={(e) =>
                        patchSection("homepage", {
                          sections: {
                            ...homepage.sections,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-teal-600"
                    />
                    {HOMEPAGE_SECTION_LABELS[key]}
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    aria-label="Show announcements"
                    checked={homepage.announcementsEnabled !== false}
                    onChange={(e) =>
                      patchSection("homepage", {
                        announcementsEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-teal-600"
                  />
                  Announcements bar
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    aria-label="Show newsletter"
                    checked={homepage.newsletterEnabled !== false}
                    onChange={(e) =>
                      patchSection("homepage", {
                        newsletterEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-teal-600"
                  />
                  Newsletter signup
                </label>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Section order</p>
                <ul className="space-y-2">
                  {homepage.sectionsOrder.map((key, index) => (
                    <li
                      key={key}
                      className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-2.5"
                    >
                      <span className="text-sm text-gray-800">
                        {index + 1}.{" "}
                        {HOMEPAGE_SECTION_LABELS[key] || key}
                      </span>
                      <MoveButtons
                        label={`section ${key}`}
                        index={index}
                        count={homepage.sectionsOrder.length}
                        onMove={moveSectionOrder}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {saveButton("homepage", "Save homepage")}
          </>
        )}

        {tab === "pages" && (
          <>
            {[
              ["about", "About"],
              ["privacyPolicy", "Privacy Policy"],
              ["terms", "Terms & Conditions"],
              ["shippingReturns", "Shipping & Returns"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <textarea
                  aria-label={label}
                  value={pages[key] || ""}
                  onChange={(e) =>
                    patchSection("pages", { [key]: e.target.value })
                  }
                  className={`${textareaClass} min-h-40`}
                />
              </Field>
            ))}
            <h3 className="text-sm font-medium text-gray-700">FAQ</h3>
            <div className="space-y-4">
              {pages.faq.map((row, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Question {index + 1}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove FAQ ${index + 1}`}
                      onClick={() =>
                        patchSection("pages", {
                          faq: pages.faq.filter((_, i) => i !== index),
                        })
                      }
                      className={iconButtonClass}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <Field label="Question">
                    <input
                      type="text"
                      aria-label={`FAQ question ${index + 1}`}
                      value={row.question || ""}
                      onChange={(e) =>
                        patchFaq(index, "question", e.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Answer">
                    <textarea
                      aria-label={`FAQ answer ${index + 1}`}
                      value={row.answer || ""}
                      onChange={(e) =>
                        patchFaq(index, "answer", e.target.value)
                      }
                      className={textareaClass}
                    />
                  </Field>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                patchSection("pages", {
                  faq: [...pages.faq, { question: "", answer: "" }],
                })
              }
              className={smallButtonClass}
            >
              <Plus className="w-4 h-4" /> Add FAQ
            </button>
            {saveButton("pages", "Save content pages")}
          </>
        )}

        {tab === "seo" && (
          <>
            <Field label="Default page title">
              <input
                type="text"
                aria-label="Default page title"
                value={seo.defaultTitle}
                onChange={(e) =>
                  patchSection("seo", { defaultTitle: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Meta description">
              <textarea
                aria-label="Meta description"
                value={seo.metaDescription}
                onChange={(e) =>
                  patchSection("seo", { metaDescription: e.target.value })
                }
                className={textareaClass}
              />
            </Field>
            <ImageField
              label="OG image URL"
              value={seo.ogImage}
              onChange={(v) => patchSection("seo", { ogImage: v })}
              helper="Image shown when your store is shared on social media."
            />
            <p className="text-sm text-gray-500">
              Analytics &amp; marketing IDs — Google Analytics, Meta Pixel,
              TikTok Pixel, Search Console verification and the Google Maps
              API key — are managed under{" "}
              <Link
                to="/dashboard/integrations"
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Integrations → Analytics &amp; Marketing
              </Link>
              .
            </p>
            {saveButton("seo", "Save SEO")}
          </>
        )}
      </section>

      <p className="flex items-center gap-2 text-xs text-gray-400">
        <Store className="w-4 h-4" />
        These settings are read by the storefront from the public
        settings endpoint; nothing here changes the admin layout itself.
      </p>
    </div>
  );
}
