import { Link } from "react-router-dom";
import { Trash2, Headset, Phone, Mail, MapPin, Globe, ArrowRight } from "lucide-react";
import {
  Card,
  Field,
  inputClass,
  smallButtonClass,
} from "../ui";
import { UploadButton, SOCIAL_PLATFORMS, SocialChip } from "../fields";
import StorePreview from "../StorePreview";

// Store Identity tab (Batch 3d, reference image 2): identity fields
// + logo/favicon upload cards + a live Store Preview on the right,
// and the Store Information strip below (which binds the CONTACT
// section — single source of truth; this tab's Save persists both
// sections when dirty).

function LogoUploadCard({ title, value, onChange, dark = false, urlLabel }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div
        className={`relative border-2 border-dashed border-gray-200 rounded-xl h-32 flex items-center justify-center px-4 ${
          dark ? "bg-[#0F172A]" : "bg-white"
        }`}
      >
        {value ? (
          <img
            src={value}
            alt={title}
            className="max-h-20 w-auto object-contain"
          />
        ) : (
          <span className={`text-sm ${dark ? "text-white/50" : "text-gray-400"}`}>
            No logo uploaded
          </span>
        )}
        {value && (
          <button
            type="button"
            aria-label={`Remove ${title}`}
            onClick={() => onChange("")}
            className="absolute top-2 right-2 inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">
        Recommended size: 300 x 80px, PNG or SVG
      </p>
      <div className="flex gap-2 mt-3">
        <input
          type="text"
          aria-label={urlLabel}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Logo URL"
          className={inputClass}
        />
        <UploadButton
          label="Change Logo"
          ariaLabel={`Upload ${urlLabel}`}
          onUploaded={onChange}
        />
      </div>
    </div>
  );
}

export default function IdentityTab({
  identity,
  contact,
  theme,
  heroImage,
  onIdentity,
  onContact,
}) {
  const patchSocial = (key, value) =>
    onContact({ socials: { ...contact.socials, [key]: value } });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <Card
          title="Store Identity"
          description="Set your store name, tagline and logo. This will appear across your storefront, admin and emails."
          className="xl:col-span-3"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Store Name" required>
                <input
                  type="text"
                  aria-label="Store name"
                  value={identity.storeName}
                  onChange={(e) => onIdentity({ storeName: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Tagline">
                <input
                  type="text"
                  aria-label="Tagline"
                  value={identity.tagline}
                  onChange={(e) => onIdentity({ tagline: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Support email">
              <input
                type="email"
                aria-label="Support email"
                value={identity.supportEmail}
                onChange={(e) => onIdentity({ supportEmail: e.target.value })}
                className={inputClass}
              />
            </Field>
            <LogoUploadCard
              title="Logo Upload (Light Mode)"
              urlLabel="Logo URL"
              value={identity.logoUrl}
              onChange={(v) => onIdentity({ logoUrl: v })}
            />
            <LogoUploadCard
              title="Logo Upload (Dark Mode)"
              urlLabel="Dark logo URL"
              value={identity.logoDarkUrl}
              onChange={(v) => onIdentity({ logoDarkUrl: v })}
              dark
            />
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Favicon</p>
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center justify-center w-16 h-16 border border-gray-200 rounded-xl bg-white overflow-hidden shrink-0">
                  {identity.faviconUrl ? (
                    <img
                      src={identity.faviconUrl}
                      alt="Favicon"
                      className="max-h-10 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">None</span>
                  )}
                </span>
                <div className="space-y-2">
                  {identity.faviconUrl && (
                    <button
                      type="button"
                      aria-label="Remove Favicon"
                      onClick={() => onIdentity({ faviconUrl: "" })}
                      className={`${smallButtonClass} !py-1.5`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                  <p className="text-xs text-gray-400">
                    Recommended size: 32 x 32px, PNG or ICO
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      aria-label="Favicon URL"
                      value={identity.faviconUrl || ""}
                      onChange={(e) =>
                        onIdentity({ faviconUrl: e.target.value })
                      }
                      placeholder="Favicon URL"
                      className={`${inputClass} !w-56`}
                    />
                    <UploadButton
                      label="Change Favicon"
                      ariaLabel="Upload Favicon URL"
                      onUploaded={(v) => onIdentity({ faviconUrl: v })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Store Preview" className="xl:col-span-2">
          <StorePreview
            identity={identity}
            theme={theme}
            heroImage={heroImage}
          />
          <p className="text-xs text-gray-400 mt-3">
            Live preview from your unsaved values — the storefront
            updates when you save.
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        <Card title="Store Information" className="xl:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Field label="Phone">
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    aria-label="Phone"
                    value={contact.phone}
                    onChange={(e) => onContact({ phone: e.target.value })}
                    className={`${inputClass} !pl-10`}
                  />
                </div>
              </Field>
              <Field label="Email">
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    aria-label="Contact email"
                    value={contact.email}
                    onChange={(e) => onContact({ email: e.target.value })}
                    className={`${inputClass} !pl-10`}
                  />
                </div>
              </Field>
            </div>
            <div className="space-y-4">
              <Field label="Address">
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    aria-label="Address"
                    value={contact.address}
                    onChange={(e) => onContact({ address: e.target.value })}
                    className={`${inputClass} !pl-10`}
                  />
                </div>
              </Field>
              <Field label="Business Hours">
                <div className="relative">
                  <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    aria-label="Opening hours"
                    value={contact.hours}
                    onChange={(e) => onContact({ hours: e.target.value })}
                    placeholder="Set per-day hours in Contact & Social"
                    className={`${inputClass} !pl-10`}
                  />
                </div>
              </Field>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Social Media Links
              </p>
              <div className="space-y-2.5">
                {SOCIAL_PLATFORMS.slice(0, 4).map((platform) => (
                  <div key={platform.key} className="flex items-center gap-2.5">
                    <SocialChip platform={platform} />
                    <input
                      type="text"
                      aria-label={`${platform.label} URL`}
                      value={contact.socials[platform.key] || ""}
                      onChange={(e) =>
                        patchSocial(platform.key, e.target.value)
                      }
                      placeholder={"https://" + platform.key + ".com/…"}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-brand/10 !border-brand/20">
          <div className="flex flex-col items-start gap-2">
            <span className="flex items-center gap-2 text-brand-hover font-semibold">
              <Headset className="w-5 h-5" />
              Need Help?
            </span>
            <p className="text-sm text-brand-hover/70">
              If you're unsure about these settings, check the knowledge
              base for guides and answers.
            </p>
            <Link
              to="/dashboard/knowledge"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-brand/30 text-brand-hover rounded-lg text-sm font-medium hover:bg-brand/20 transition-colors"
            >
              View Documentation
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
