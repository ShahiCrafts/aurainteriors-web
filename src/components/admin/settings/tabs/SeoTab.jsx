import { useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Mic,
  Camera,
  Upload,
  RefreshCw,
  ExternalLink,
  Globe,
} from "lucide-react";
import {
  Card,
  Field,
  Toggle,
  inputClass,
  textareaClass,
  selectClass,
  smallButtonClass,
} from "../ui";
import settingsApi from "../../../../api/settingsApi";
import { toast } from "../../../../lib/toast";
import formatError from "../../../../utils/errorHandler";

// SEO tab (Batch 3d, reference image 5). Left: SEO defaults with a
// live Google-result preview. Bottom: the Batch 3d feature gates
// (seo.features), indexing + canonical/language/noindex controls —
// every one is consumed by the storefront runtime head
// (src/seo/seo.js applyHead + SiteSettingsEffects). There is NO
// "Regenerate Sitemap" button and NO robots.txt editor: the
// sitemap is generated at build time on this static-host stack, so
// those controls could not be made real and are not shown.

const FEATURE_ROWS = [
  ["productSchema", "Enable Structured Data (Product Schema)"],
  ["breadcrumbs", "Enable Breadcrumbs"],
  ["openGraph", "Enable Open Graph Tags"],
  ["twitterCards", "Enable Twitter Cards"],
  ["autoGenerateMeta", "Auto-generate Meta Tags"],
];

const LANGUAGE_OPTIONS = [
  { value: "en-NP", label: "English (Nepal)" },
  { value: "ne", label: "Nepali" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
];

const NOINDEX_OPTIONS = [
  ["cart", "Cart"],
  ["checkout", "Checkout"],
  ["profile", "Profile"],
  ["orders", "Orders"],
  ["wishlist", "Wishlist"],
];

function GoogleWordmark() {
  const letters = [
    ["G", "#4285F4"],
    ["o", "#EA4335"],
    ["o", "#FBBC05"],
    ["g", "#4285F4"],
    ["l", "#34A853"],
    ["e", "#EA4335"],
  ];
  return (
    <span className="text-[26px] font-medium tracking-tight" aria-label="Google">
      {letters.map(([ch, color], i) => (
        <span key={i} style={{ color }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

export default function SeoTab({ seo, identity, onSeo }) {
  const [previewNonce, setPreviewNonce] = useState(0);
  const patchFeature = (key, value) =>
    onSeo({ features: { ...seo.features, [key]: value } });
  const toggleNoindex = (key, checked) =>
    onSeo({
      noindexPages: checked
        ? [...seo.noindexPages, key]
        : seo.noindexPages.filter((p) => p !== key),
    });

  const previewTitle = (seo.defaultTitle || "").replaceAll(
    "{store_name}",
    identity.storeName || "",
  );
  const sitemapUrl = `${(seo.siteUrl || "").replace(/\/+$/, "")}/sitemap.xml`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <Card
          title="SEO Defaults"
          description="Set default SEO values for your store."
        >
          <div className="space-y-5">
            <Field
              label="Default Title Pattern"
              required
              helper="Use {store_name} to insert your store name — it is substituted wherever this pattern is used."
            >
              <input
                type="text"
                aria-label="Default title pattern"
                value={seo.defaultTitle}
                onChange={(e) => onSeo({ defaultTitle: e.target.value })}
                placeholder="{store_name} – Buy Furniture Online in Nepal"
                className={inputClass}
              />
            </Field>
            <div>
              <Field label="Meta Description" required>
                <textarea
                  aria-label="Meta description"
                  value={seo.metaDescription}
                  onChange={(e) =>
                    onSeo({ metaDescription: e.target.value })
                  }
                  className={`${textareaClass} !min-h-20`}
                />
              </Field>
              <p className="text-xs text-gray-400 text-right mt-1">
                {(seo.metaDescription || "").length}/160
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">
                Default Share Image
              </p>
              <div className="flex gap-3">
                <span className="relative w-28 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                  {seo.ogImage ? (
                    <>
                      <img
                        src={seo.ogImage}
                        alt="Share image"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Remove share image"
                        onClick={() => onSeo({ ogImage: "" })}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/55 text-white hover:bg-black/75"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="flex w-full h-full items-center justify-center text-xs text-gray-400">
                      No image
                    </span>
                  )}
                </span>
                <label className="flex-1 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-5 h-5 text-brand" />
                  <span className="text-sm font-medium text-brand">
                    Upload Image
                  </span>
                  <span className="text-xs text-gray-400">
                    Recommended: 1200 x 630px, JPG or PNG
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    aria-label="Upload OG image"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      try {
                        const res =
                          await settingsApi.uploadSettingsImage(file);
                        if (res?.data?.url) onSeo({ ogImage: res.data.url });
                        toast.success("Image uploaded");
                      } catch (err) {
                        toast.error(
                          formatError(err, "Image upload failed"),
                        );
                      }
                    }}
                  />
                </label>
              </div>
              <input
                type="text"
                aria-label="OG image URL"
                value={seo.ogImage || ""}
                onChange={(e) => onSeo({ ogImage: e.target.value })}
                placeholder="Or paste an image URL"
                className={`${inputClass} mt-3`}
              />
            </div>
            <p className="text-sm text-gray-500">
              Analytics &amp; marketing IDs — Google Analytics, Meta
              Pixel, TikTok Pixel, Search Console verification and the
              Google Maps API key — are managed under{" "}
              <Link
                to="/dashboard/integrations"
                className="text-brand hover:text-brand-hover font-medium"
              >
                Integrations → Analytics &amp; Marketing
              </Link>
              .
            </p>
          </div>
        </Card>

        <Card
          title="SEO Preview"
          description="See how your SEO looks on search engines."
        >
          <div className="border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-4">
              <GoogleWordmark />
              <span className="flex-1 flex items-center justify-between gap-3 border border-gray-200 rounded-full shadow-sm px-4 py-2.5">
                <span className="text-sm text-gray-700 truncate">
                  {(identity.storeName || "your store").toLowerCase()}
                </span>
                <span className="flex items-center gap-3 text-gray-400 shrink-0">
                  <X className="w-4 h-4" />
                  <Mic className="w-4 h-4" />
                  <Camera className="w-4 h-4" />
                </span>
              </span>
            </div>
            <div className="flex gap-5 text-xs text-gray-500 border-b border-gray-100 pb-2">
              <span className="text-brand font-medium border-b-2 border-brand -mb-2.5 pb-2">
                All
              </span>
              <span>Shopping</span>
              <span>Images</span>
              <span>Videos</span>
              <span>News</span>
              <span>More</span>
              <span className="ml-auto">Tools</span>
            </div>
            <div key={previewNonce} className="flex gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-gray-50 overflow-hidden shrink-0">
                {identity.faviconUrl ? (
                  <img
                    src={identity.faviconUrl}
                    alt=""
                    className="w-5 h-5 object-contain"
                  />
                ) : (
                  <Globe className="w-4 h-4 text-gray-400" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-gray-900">
                  {identity.storeName || "Your store"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {seo.siteUrl}
                </p>
                <p className="text-lg text-brand-hover leading-snug mt-1">
                  {previewTitle || "Your page title"}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {seo.metaDescription || "Your meta description"}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewNonce((n) => n + 1)}
                className={smallButtonClass}
              >
                <RefreshCw className="w-4 h-4 text-brand" />
                Refresh Preview
              </button>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card
          title="Structured Data & SEO Features"
          description="Enable features to help search engines understand your store."
        >
          <div className="space-y-4">
            {FEATURE_ROWS.map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-sm text-gray-700">{label}</span>
                <Toggle
                  ariaLabel={label}
                  checked={seo.features[key] !== false}
                  onChange={(v) => patchFeature(key, v)}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Sitemap & Indexing"
          description="Help search engines discover your content."
        >
          <div className="space-y-5">
            <Field label="Sitemap URL">
              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label="Sitemap URL"
                  value={sitemapUrl}
                  readOnly
                  className={`${inputClass} bg-gray-50`}
                />
                <button
                  type="button"
                  aria-label="Open sitemap"
                  onClick={() =>
                    window.open(sitemapUrl, "_blank", "noopener")
                  }
                  className="p-2.5 border border-gray-200 rounded-lg text-brand hover:bg-brand/10 transition-colors shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </Field>
            <div className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-medium text-gray-700">
                  Search Engine Indexing
                </span>
                <span className="block text-xs text-gray-400">
                  Allow search engines to index your store
                </span>
              </span>
              <Toggle
                ariaLabel="Search Engine Indexing"
                checked={seo.indexingEnabled !== false}
                onChange={(v) => onSeo({ indexingEnabled: v })}
              />
            </div>
            <p className="text-xs text-gray-400">
              The sitemap itself is generated when the storefront is
              built and deployed, so it always reflects the current
              catalogue.
            </p>
          </div>
        </Card>

        <Card
          title="Advanced SEO Settings"
          description="Fine-tune SEO settings for better results."
        >
          <div className="space-y-5">
            <Field
              label="Canonical URL"
              helper="Leave empty to use the default domain."
            >
              <input
                type="text"
                aria-label="Canonical URL"
                value={seo.canonicalUrl}
                onChange={(e) => onSeo({ canonicalUrl: e.target.value })}
                placeholder="https://www.example.com"
                className={inputClass}
              />
            </Field>
            <Field label="Default Language">
              <select
                aria-label="Default language"
                value={seo.defaultLanguage}
                onChange={(e) => onSeo({ defaultLanguage: e.target.value })}
                className={selectClass}
              >
                {LANGUAGE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Noindex Pages
              </p>
              <div className="space-y-2">
                {NOINDEX_OPTIONS.map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2.5 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      aria-label={`Noindex ${label}`}
                      checked={seo.noindexPages.includes(key)}
                      onChange={(e) => toggleNoindex(key, e.target.checked)}
                      className="w-4 h-4 accent-brand"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Checked pages get a "noindex, nofollow" robots tag on
                the live storefront.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
