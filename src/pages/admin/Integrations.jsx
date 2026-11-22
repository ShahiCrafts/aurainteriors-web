import { useState, useEffect, useCallback } from "react";
import { Plug, ArrowUp, ArrowDown, Copy, Check } from "lucide-react";
import integrationsApi from "../../api/integrationsApi";
import settingsApi from "../../api/settingsApi";
import SecretKeyControl from "../../components/admin/integrations/SecretKeyControl";
import ProviderCard from "../../components/admin/integrations/ProviderCard";
import {
  SettingsPage,
  SettingsShell,
  Card,
  Field,
  inputClass,
  selectClass,
  primaryButtonClass,
} from "../../components/admin/settings/ui";
import { toast } from "../../lib/toast";
import formatError from "../../utils/errorHandler";

const PROVIDERS = [
  { name: "groq", displayName: "Groq" },
  { name: "mistral", displayName: "Mistral" },
  { name: "openrouter", displayName: "OpenRouter" },
  { name: "gemini", displayName: "Gemini" },
  { name: "openai", displayName: "OpenAI" },
  { name: "anthropic", displayName: "Anthropic (Claude)" },
];
const PROVIDER_NAMES = PROVIDERS.map((p) => p.name);

const FEATURES = [
  { key: "chat", label: "Support chat" },
  { key: "insights", label: "AI insights" },
  { key: "productDescriptions", label: "Product descriptions" },
  { key: "knowledgeBase", label: "Knowledge base" },
];

const GOOGLE_REDIRECT_URI =
  "https://api.aurainteriors.live/api/v1/auth/google/callback";

const emptyProvider = () => ({ enabled: false, model: "", baseUrl: "" });

function defaultIntegrations() {
  return {
    ai: {
      fallbackOrder: [],
      providers: Object.fromEntries(
        PROVIDER_NAMES.map((n) => [n, emptyProvider()]),
      ),
      featureProviders: {
        chat: "",
        insights: "",
        productDescriptions: "",
        knowledgeBase: "",
      },
      chat: { temperature: 0.7, maxTokens: 1024 },
    },
    embeddings: { provider: "nvidia", model: "" },
    qdrant: { url: "" },
    cloudinary: { cloudName: "", apiKey: "" },
    google: { clientId: "" },
    brevo: { baseUrl: "" },
    esewa: { merchantId: "", environment: "" },
    khalti: { publicKey: "" },
    sms: { provider: "", senderId: "" },
    push: { senderId: "" },
  };
}

// Merge a fetched integrations config over the defaults so every field
// the page binds to exists even if the server omits empty sub-objects.
function mergeIntegrations(fetched) {
  const base = defaultIntegrations();
  if (!fetched || typeof fetched !== "object") return base;
  const merged = { ...base, ...fetched };
  merged.ai = {
    ...base.ai,
    ...(fetched.ai || {}),
    providers: { ...base.ai.providers },
    featureProviders: {
      ...base.ai.featureProviders,
      ...(fetched.ai?.featureProviders || {}),
    },
    chat: { ...base.ai.chat, ...(fetched.ai?.chat || {}) },
  };
  for (const name of PROVIDER_NAMES) {
    merged.ai.providers[name] = {
      ...emptyProvider(),
      ...(fetched.ai?.providers?.[name] || {}),
    };
  }
  if (!Array.isArray(merged.ai.fallbackOrder)) merged.ai.fallbackOrder = [];
  for (const key of [
    "embeddings",
    "qdrant",
    "cloudinary",
    "google",
    "brevo",
    "esewa",
    "khalti",
    "sms",
    "push",
  ]) {
    merged[key] = { ...base[key], ...(fetched[key] || {}) };
  }
  return merged;
}

const saveButtonClass = primaryButtonClass;

// Batch 3d: sections render as the shared Settings cards so this
// page matches the Store Settings design exactly.
function SectionCard({ title, description, children }) {
  return (
    <Card title={title} description={description}>
      <div className="space-y-5">{children}</div>
    </Card>
  );
}

export default function Integrations() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [config, setConfig] = useState(defaultIntegrations);
  const [seo, setSeo] = useState({
    googleAnalyticsId: "",
    metaPixelId: "",
    tiktokPixelId: "",
    searchConsoleVerification: "",
    googleMapsKey: "",
  });
  const [reindexing, setReindexing] = useState(false);
  const [reindexResult, setReindexResult] = useState(null);
  const [secrets, setSecrets] = useState({}); // service -> describe
  const [savingAi, setSavingAi] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  const [savingSeo, setSavingSeo] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [integrationsRes, settingsRes] = await Promise.all([
        integrationsApi.getIntegrations(),
        integrationsApi.getSettings(),
      ]);
      setConfig(mergeIntegrations(integrationsRes?.data?.config));
      const map = {};
      for (const entry of integrationsRes?.data?.secrets || []) {
        if (entry?.service) map[entry.service] = entry;
      }
      setSecrets(map);
      const fetchedSeo = settingsRes?.data?.settings?.seo || {};
      setSeo({
        googleAnalyticsId: fetchedSeo.googleAnalyticsId || "",
        metaPixelId: fetchedSeo.metaPixelId || "",
        tiktokPixelId: fetchedSeo.tiktokPixelId || "",
        searchConsoleVerification: fetchedSeo.searchConsoleVerification || "",
        googleMapsKey: fetchedSeo.googleMapsKey || "",
      });
      setLoadError(null);
    } catch (err) {
      setLoadError(formatError(err, "Failed to load integrations"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDescribeChange = useCallback((service, describe) => {
    if (!describe) return;
    setSecrets((prev) => ({ ...prev, [service]: describe }));
  }, []);

  const secretControl = (service, label, extra = {}) => (
    <SecretKeyControl
      service={service}
      label={label}
      describe={secrets[service]}
      onDescribeChange={handleDescribeChange}
      {...extra}
    />
  );

  // ---- config patching helpers -------------------------------------------
  const patchConfig = (patch) =>
    setConfig((prev) => ({ ...prev, ...patch }));
  const patchAi = (patch) =>
    setConfig((prev) => ({ ...prev, ai: { ...prev.ai, ...patch } }));
  const patchProvider = (name, field, value) =>
    setConfig((prev) => ({
      ...prev,
      ai: {
        ...prev.ai,
        providers: {
          ...prev.ai.providers,
          [name]: { ...prev.ai.providers[name], [field]: value },
        },
      },
    }));

  // Enabled providers in fallback order; enabled providers missing from
  // fallbackOrder append in canonical provider order.
  const fallbackList = (() => {
    const enabled = PROVIDER_NAMES.filter(
      (n) => config.ai.providers[n]?.enabled,
    );
    const ordered = config.ai.fallbackOrder.filter((n) =>
      enabled.includes(n),
    );
    return [...ordered, ...enabled.filter((n) => !ordered.includes(n))];
  })();

  const moveFallback = (index, delta) => {
    const next = [...fallbackList];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    patchAi({ fallbackOrder: next });
  };

  // ---- saves ---------------------------------------------------------------
  const saveIntegrations = async (sectionKey) => {
    if (sectionKey === "ai") setSavingAi(true);
    else setSavingSection(sectionKey);
    try {
      await integrationsApi.updateSettingsSection("integrations", config);
      toast.success("Integration settings saved");
    } catch (err) {
      toast.error(formatError(err, "Failed to save integration settings"));
    } finally {
      setSavingAi(false);
      setSavingSection(null);
    }
  };

  const saveSeo = async () => {
    setSavingSeo(true);
    try {
      await integrationsApi.updateSettingsSection("seo", seo);
      toast.success("Analytics settings saved");
    } catch (err) {
      toast.error(formatError(err, "Failed to save analytics settings"));
    } finally {
      setSavingSeo(false);
    }
  };

  const reindexKnowledge = async () => {
    setReindexing(true);
    setReindexResult(null);
    try {
      const res = await settingsApi.reindexKnowledge();
      const queued = res?.data?.queued ?? 0;
      setReindexResult(
        queued > 0
          ? `Queued ${queued} document${queued === 1 ? "" : "s"} for re-indexing.`
          : "No knowledge documents to re-index.",
      );
      toast.success("Knowledge base re-indexing scheduled");
    } catch (err) {
      toast.error(formatError(err, "Failed to schedule re-indexing"));
    } finally {
      setReindexing(false);
    }
  };

  const copyRedirectUri = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_REDIRECT_URI);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  if (loading) {
    return (
      <SettingsPage>
        <SettingsShell activeTab="integrations">
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-sm text-gray-500">
            Loading integration settings…
          </div>
        </SettingsShell>
      </SettingsPage>
    );
  }

  if (loadError) {
    return (
      <SettingsPage>
        <SettingsShell activeTab="integrations">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <p className="text-red-600 text-sm">{loadError}</p>
            <button onClick={load} className={`${saveButtonClass} mt-4`}>
              Retry
            </button>
          </div>
        </SettingsShell>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage>
      <SettingsShell activeTab="integrations">
        <div className="space-y-6">

      {/* 1. AI Providers */}
      <SectionCard
        title="AI Providers"
        description="Enable providers, set their models and keys, and choose the order they are tried in."
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {PROVIDERS.map(({ name, displayName }) => (
            <ProviderCard
              key={name}
              displayName={displayName}
              provider={config.ai.providers[name]}
              onChange={(field, value) => patchProvider(name, field, value)}
            >
              {secretControl(`ai.${name}`, `${displayName} API key`)}
            </ProviderCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fallback order */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Fallback order
            </h3>
            {fallbackList.length === 0 ? (
              <p className="text-sm text-gray-400">
                Enable a provider above to build the fallback order.
              </p>
            ) : (
              <ul className="space-y-2">
                {fallbackList.map((name, index) => (
                  <li
                    key={name}
                    className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-2.5"
                  >
                    <span className="text-sm text-gray-800">
                      {index + 1}.{" "}
                      {
                        PROVIDERS.find((p) => p.name === name)?.displayName ||
                        name
                      }
                    </span>
                    <span className="flex gap-1">
                      <button
                        type="button"
                        aria-label={`Move ${name} up`}
                        onClick={() => moveFallback(index, -1)}
                        disabled={index === 0}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
                      >
                        <ArrowUp className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${name} down`}
                        onClick={() => moveFallback(index, 1)}
                        disabled={index === fallbackList.length - 1}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
                      >
                        <ArrowDown className="w-4 h-4 text-gray-500" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Feature assignment + chat tuning */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">
              Feature assignment
            </h3>
            {FEATURES.map(({ key, label }) => (
              <Field key={key} label={label}>
                <select
                  aria-label={label}
                  value={config.ai.featureProviders[key] || ""}
                  onChange={(e) =>
                    patchAi({
                      featureProviders: {
                        ...config.ai.featureProviders,
                        [key]: e.target.value,
                      },
                    })
                  }
                  className={selectClass}
                >
                  <option value="">Auto (fallback order)</option>
                  {PROVIDERS.map(({ name, displayName }) => (
                    <option key={name} value={name}>
                      {displayName}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Chat temperature">
                <input
                  type="number"
                  aria-label="Chat temperature"
                  min={0}
                  max={2}
                  step={0.1}
                  value={config.ai.chat.temperature ?? ""}
                  onChange={(e) =>
                    patchAi({
                      chat: {
                        ...config.ai.chat,
                        temperature:
                          e.target.value === ""
                            ? ""
                            : Number(e.target.value),
                      },
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Chat max tokens">
                <input
                  type="number"
                  aria-label="Chat max tokens"
                  min={1}
                  value={config.ai.chat.maxTokens ?? ""}
                  onChange={(e) =>
                    patchAi({
                      chat: {
                        ...config.ai.chat,
                        maxTokens:
                          e.target.value === ""
                            ? ""
                            : Number(e.target.value),
                      },
                    })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => saveIntegrations("ai")}
            disabled={savingAi}
            className={saveButtonClass}
          >
            {savingAi ? "Saving…" : "Save AI settings"}
          </button>
        </div>
      </SectionCard>

      {/* 2. AI Search & Knowledge Base */}
      <SectionCard
        title="AI Search & Knowledge Base"
        description="Embeddings power product search and the support knowledge base."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Embeddings provider">
            <select
              aria-label="Embeddings provider"
              value={config.embeddings.provider || "nvidia"}
              onChange={(e) =>
                patchConfig({
                  embeddings: {
                    ...config.embeddings,
                    provider: e.target.value,
                  },
                })
              }
              className={selectClass}
            >
              <option value="nvidia">NVIDIA</option>
            </select>
          </Field>
          <Field label="Embeddings model">
            <input
              type="text"
              aria-label="Embeddings model"
              value={config.embeddings.model || ""}
              onChange={(e) =>
                patchConfig({
                  embeddings: {
                    ...config.embeddings,
                    model: e.target.value,
                  },
                })
              }
              placeholder="Embeddings model name"
              className={inputClass}
            />
          </Field>
        </div>
        {secretControl("embeddings.nvidia", "NVIDIA API key")}
        <Field label="Qdrant URL">
          <input
            type="text"
            aria-label="Qdrant URL"
            value={config.qdrant.url || ""}
            onChange={(e) =>
              patchConfig({ qdrant: { ...config.qdrant, url: e.target.value } })
            }
            placeholder="https://…"
            className={inputClass}
          />
        </Field>
        {secretControl("vector.qdrant", "Qdrant API key")}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={reindexKnowledge}
              disabled={reindexing}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {reindexing ? "Scheduling…" : "Re-index knowledge base"}
            </button>
            {reindexResult && (
              <span className="text-sm text-gray-500">{reindexResult}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => saveIntegrations("search")}
            disabled={savingSection === "search"}
            className={saveButtonClass}
          >
            {savingSection === "search" ? "Saving…" : "Save search settings"}
          </button>
        </div>
      </SectionCard>

      {/* 3. Google Sign-in */}
      <SectionCard
        title="Google Sign-in"
        description="OAuth credentials used for “Sign in with Google”."
      >
        <Field
          label="Client ID"
          helper="Create these in Google Cloud Console → APIs & Services → Credentials (OAuth 2.0 Client ID, Web application)."
        >
          <input
            type="text"
            aria-label="Google client ID"
            value={config.google.clientId || ""}
            onChange={(e) =>
              patchConfig({
                google: { ...config.google, clientId: e.target.value },
              })
            }
            placeholder="….apps.googleusercontent.com"
            className={inputClass}
          />
        </Field>
        {secretControl("auth.googleSecret", "Client secret")}
        <Field label="Redirect URI">
          <div className="flex gap-2">
            <input
              type="text"
              aria-label="Google redirect URI"
              value={GOOGLE_REDIRECT_URI}
              readOnly
              className={`${inputClass} bg-gray-50`}
            />
            <button
              type="button"
              onClick={copyRedirectUri}
              className="inline-flex items-center gap-1 px-3 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </Field>
        <p className="text-xs text-gray-400">
          Changes take effect the next time the server restarts.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => saveIntegrations("google")}
            disabled={savingSection === "google"}
            className={saveButtonClass}
          >
            {savingSection === "google" ? "Saving…" : "Save Google settings"}
          </button>
        </div>
      </SectionCard>

      {/* 4. Email (Brevo) */}
      <SectionCard title="Email (Brevo)" description="Transactional email delivery.">
        {secretControl("email.brevo", "Brevo API key")}
        <Field label="Brevo base URL">
          <input
            type="text"
            aria-label="Brevo base URL"
            value={config.brevo.baseUrl || ""}
            onChange={(e) =>
              patchConfig({
                brevo: { ...config.brevo, baseUrl: e.target.value },
              })
            }
            placeholder="https://api.brevo.com/v3"
            className={inputClass}
          />
        </Field>
        <p className="text-xs text-gray-400">
          Sender identity is configured in the store settings.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => saveIntegrations("email")}
            disabled={savingSection === "email"}
            className={saveButtonClass}
          >
            {savingSection === "email" ? "Saving…" : "Save email settings"}
          </button>
        </div>
      </SectionCard>

      {/* 5. Media (Cloudinary) */}
      <SectionCard title="Media (Cloudinary)" description="Image and media storage.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Cloud name">
            <input
              type="text"
              aria-label="Cloudinary cloud name"
              value={config.cloudinary.cloudName || ""}
              onChange={(e) =>
                patchConfig({
                  cloudinary: {
                    ...config.cloudinary,
                    cloudName: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="API key">
            <input
              type="text"
              aria-label="Cloudinary API key"
              value={config.cloudinary.apiKey || ""}
              onChange={(e) =>
                patchConfig({
                  cloudinary: {
                    ...config.cloudinary,
                    apiKey: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </Field>
        </div>
        {secretControl("media.cloudinarySecret", "API secret")}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => saveIntegrations("media")}
            disabled={savingSection === "media"}
            className={saveButtonClass}
          >
            {savingSection === "media" ? "Saving…" : "Save media settings"}
          </button>
        </div>
      </SectionCard>

      {/* 6. Payments */}
      <SectionCard title="Payments" description="eSewa and Khalti payment gateways.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="eSewa merchant ID">
            <input
              type="text"
              aria-label="eSewa merchant ID"
              value={config.esewa.merchantId || ""}
              onChange={(e) =>
                patchConfig({
                  esewa: { ...config.esewa, merchantId: e.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="eSewa environment">
            <input
              type="text"
              aria-label="eSewa environment"
              value={config.esewa.environment || ""}
              readOnly
              className={`${inputClass} bg-gray-50`}
            />
          </Field>
        </div>
        <p className="text-xs text-gray-400">
          Environment (sandbox/live) is controlled by the server
          configuration (ESEWA_ENV).
        </p>
        {secretControl("payments.esewaSecret", "eSewa secret key")}
        <Field label="Khalti public key">
          <input
            type="text"
            aria-label="Khalti public key"
            value={config.khalti.publicKey || ""}
            onChange={(e) =>
              patchConfig({
                khalti: { ...config.khalti, publicKey: e.target.value },
              })
            }
            className={inputClass}
          />
        </Field>
        {secretControl("payments.khalti", "Khalti secret key", {
          helper:
            "Khalti secret key is stored securely; checkout integration status depends on store configuration.",
        })}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => saveIntegrations("payments")}
            disabled={savingSection === "payments"}
            className={saveButtonClass}
          >
            {savingSection === "payments" ? "Saving…" : "Save payment settings"}
          </button>
        </div>
      </SectionCard>

      {/* 7. SMS & Push */}
      <SectionCard title="SMS & Push" description="SMS alerts and push notifications.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="SMS provider">
            <input
              type="text"
              aria-label="SMS provider"
              value={config.sms.provider || ""}
              onChange={(e) =>
                patchConfig({
                  sms: { ...config.sms, provider: e.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="SMS sender ID">
            <input
              type="text"
              aria-label="SMS sender ID"
              value={config.sms.senderId || ""}
              onChange={(e) =>
                patchConfig({
                  sms: { ...config.sms, senderId: e.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
        </div>
        {secretControl("sms.token", "SMS token")}
        <Field label="Push sender ID (FCM)">
          <input
            type="text"
            aria-label="Push sender ID"
            value={config.push.senderId || ""}
            onChange={(e) =>
              patchConfig({
                push: { ...config.push, senderId: e.target.value },
              })
            }
            className={inputClass}
          />
        </Field>
        {secretControl("push.fcm", "FCM server key")}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => saveIntegrations("smsPush")}
            disabled={savingSection === "smsPush"}
            className={saveButtonClass}
          >
            {savingSection === "smsPush" ? "Saving…" : "Save SMS & push settings"}
          </button>
        </div>
      </SectionCard>

      {/* 8. Analytics & Marketing */}
      <SectionCard
        title="Analytics & Marketing"
        description="Tracking IDs loaded on the storefront."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Google Analytics ID">
            <input
              type="text"
              aria-label="Google Analytics ID"
              value={seo.googleAnalyticsId}
              onChange={(e) =>
                setSeo({ ...seo, googleAnalyticsId: e.target.value })
              }
              placeholder="G-XXXXXXXXXX"
              className={inputClass}
            />
          </Field>
          <Field label="Meta Pixel ID">
            <input
              type="text"
              aria-label="Meta Pixel ID"
              value={seo.metaPixelId}
              onChange={(e) => setSeo({ ...seo, metaPixelId: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="TikTok Pixel ID">
            <input
              type="text"
              aria-label="TikTok Pixel ID"
              value={seo.tiktokPixelId}
              onChange={(e) =>
                setSeo({ ...seo, tiktokPixelId: e.target.value })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Search Console verification">
            <input
              type="text"
              aria-label="Search Console verification"
              value={seo.searchConsoleVerification}
              onChange={(e) =>
                setSeo({ ...seo, searchConsoleVerification: e.target.value })
              }
              className={inputClass}
            />
          </Field>
          <Field
            label="Google Maps API key"
            helper="Used for storefront map embeds. Browser keys are visible in page source by design — restrict this key by HTTP referrer in Google Cloud Console."
          >
            <input
              type="text"
              aria-label="Google Maps API key"
              value={seo.googleMapsKey}
              onChange={(e) =>
                setSeo({ ...seo, googleMapsKey: e.target.value })
              }
              placeholder="AIza…"
              className={inputClass}
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveSeo}
            disabled={savingSeo}
            className={saveButtonClass}
          >
            {savingSeo ? "Saving…" : "Save analytics settings"}
          </button>
        </div>
      </SectionCard>

          <p className="flex items-center gap-2 text-xs text-gray-400">
            <Plug className="w-4 h-4" />
            Secret values are write-only here: they can be replaced or
            removed, but never viewed.
          </p>
        </div>
      </SettingsShell>
    </SettingsPage>
  );
}
