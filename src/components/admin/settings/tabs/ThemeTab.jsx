import { Check, Moon, Shapes, Layers } from "lucide-react";
import { Card, Field, Toggle, selectClass } from "../ui";
import { ColorField } from "../fields";
import StorePreview from "../StorePreview";

// Theme & Branding tab (Batch 3d, reference image 3). All controls
// bind theme.* fields; the previews render the LOCAL unsaved values.

export const FONTS = [
  "DM Sans",
  "Inter",
  "Poppins",
  "Montserrat",
  "Roboto",
  "Lato",
  "Open Sans",
  "Playfair Display",
];

const FONT_DESCRIPTORS = {
  "DM Sans": "Modern • Clean • Readable",
  Inter: "Neutral • Clean • Readable",
  Poppins: "Geometric • Friendly • Rounded",
  Montserrat: "Bold • Geometric • Display",
  Roboto: "Neutral • Mechanical • Readable",
  Lato: "Warm • Humanist • Friendly",
  "Open Sans": "Open • Friendly • Readable",
  "Playfair Display": "Elegant • Serif • Editorial",
};

const HEADER_STYLES = [
  { value: "light", label: "Light", bar: "#ffffff" },
  { value: "navy", label: "Navy", bar: "#1E2C4A" },
  { value: "black", label: "Black", bar: "#000000" },
];

const BUTTON_STYLES = [
  { value: "rounded", label: "Rounded" },
  { value: "square", label: "Square" },
  { value: "pill", label: "Pill" },
];

const RADIUS_CSS = { rounded: "0.5rem", square: "0", pill: "9999px" };

function HeaderStyleThumb({ option, selected, onSelect, navyColor }) {
  const bar =
    option.value === "navy" ? navyColor || option.bar : option.bar;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`Header style ${option.label}`}
      onClick={() => onSelect(option.value)}
      className="text-left group"
    >
      <span
        className={`relative block rounded-lg border-2 overflow-hidden transition-colors ${
          selected
            ? "border-blue-600"
            : "border-gray-200 group-hover:border-gray-300"
        }`}
      >
        <span className="block h-4" style={{ backgroundColor: bar }} />
        <span className="block h-9 bg-gray-50 p-1.5 space-y-1">
          <span className="block h-1.5 w-3/4 bg-gray-200 rounded" />
          <span className="block h-1.5 w-1/2 bg-gray-200 rounded" />
        </span>
        {selected && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-[1.125rem] h-[1.125rem] rounded-full bg-blue-600 text-white">
            <Check className="w-3 h-3" />
          </span>
        )}
      </span>
      <span
        className={`block text-xs mt-1.5 text-center ${selected ? "text-blue-700 font-medium" : "text-gray-500"}`}
      >
        {option.label}
      </span>
    </button>
  );
}

export default function ThemeTab({ theme, identity, heroImage, onTheme }) {
  const radius = RADIUS_CSS[theme.buttonRadius] || "0.5rem";
  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
      <div className="xl:col-span-3 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <Card
            title="Brand Colours"
            description="Set your brand colours for a consistent look."
            className="lg:col-span-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ColorField
                label="Primary Colour"
                value={theme.primaryColor}
                onChange={(v) => onTheme({ primaryColor: v })}
              />
              <ColorField
                label="Accent Colour"
                value={theme.primaryHoverColor}
                onChange={(v) => onTheme({ primaryHoverColor: v })}
              />
              <ColorField
                label="Header Background"
                value={theme.navyColor}
                onChange={(v) => onTheme({ navyColor: v })}
              />
            </div>
          </Card>

          <Card
            title="Typography"
            description="Choose your preferred fonts."
            className="lg:col-span-2"
          >
            <Field label="Font Family">
              <select
                aria-label="Font"
                value={theme.fontFamily}
                onChange={(e) => onTheme({ fontFamily: e.target.value })}
                className={selectClass}
              >
                {FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-center gap-4 border border-gray-100 rounded-xl px-4 py-3 mt-4 bg-gray-50/60">
              <span
                className="text-4xl font-bold text-gray-900"
                style={{ fontFamily: theme.fontFamily }}
              >
                Aa
              </span>
              <span>
                <span className="block text-sm font-medium text-gray-900">
                  {theme.fontFamily}
                </span>
                <span className="block text-xs text-gray-400">
                  {FONT_DESCRIPTORS[theme.fontFamily] ||
                    "Clean • Readable"}
                </span>
              </span>
            </div>
          </Card>
        </div>

        <Card
          title="Header & Buttons"
          description="Customize header and button styles."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Header Style">
              <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Header style">
                {HEADER_STYLES.map((option) => (
                  <HeaderStyleThumb
                    key={option.value}
                    option={option}
                    navyColor={theme.navyColor}
                    selected={theme.headerStyle === option.value}
                    onSelect={(v) => onTheme({ headerStyle: v })}
                  />
                ))}
              </div>
            </Field>
            <Field label="Button Style">
              <div className="flex flex-wrap gap-2">
                {BUTTON_STYLES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={theme.buttonRadius === value}
                    onClick={() => onTheme({ buttonRadius: value })}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                      theme.buttonRadius === value
                        ? "border-blue-600 text-blue-700 bg-blue-50"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <ColorField
              label="Button Colour"
              value={theme.primaryColor}
              onChange={(v) => onTheme({ primaryColor: v })}
            />
          </div>
        </Card>

        <Card
          title="Theme Customizer"
          description="Fine-tune your store's theme with a live preview."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ColorField
              label="Background Colour"
              value={theme.backgroundColor}
              onChange={(v) => onTheme({ backgroundColor: v })}
            />
            <div className="space-y-4">
              {[
                {
                  key: "darkMode",
                  label: "Enable Dark Mode",
                  Icon: Moon,
                  helper:
                    "Darkens the storefront page background and base text colour.",
                },
                {
                  key: "roundedCards",
                  label: "Enable Rounded Cards",
                  Icon: Shapes,
                  helper: "Rounds card corners across the storefront.",
                },
                {
                  key: "showShadows",
                  label: "Show Shadows",
                  Icon: Layers,
                  helper: "Shows the soft card shadow on the storefront.",
                },
              ].map(({ key, label, Icon, helper }) => (
                <div key={key} className="flex items-start justify-between gap-3">
                  <span className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <Icon className="w-[1.125rem] h-[1.125rem]" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-gray-800">
                        {label}
                      </span>
                      <span className="block text-xs text-gray-400">
                        {helper}
                      </span>
                    </span>
                  </span>
                  <Toggle
                    ariaLabel={label}
                    checked={theme[key]}
                    onChange={(v) => onTheme({ [key]: v })}
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="xl:col-span-2 space-y-6">
        <Card title="Live Preview">
          <StorePreview
            identity={identity}
            theme={theme}
            heroImage={heroImage}
            testId="theme-preview"
          />
        </Card>
        <Card
          title="Typography Preview"
          description="See how your text will look across the store."
        >
          <div style={{ fontFamily: theme.fontFamily }}>
            <h3 className="text-xl font-bold text-gray-900">
              Heading Example
            </h3>
            <div className="flex items-end justify-between gap-4 mt-2">
              <p className="text-sm text-gray-500">
                This is a sample paragraph to show how your selected
                font and colours look on the website.
              </p>
              <button
                type="button"
                data-testid="preview-primary-button"
                className="shrink-0 text-white text-sm font-medium px-4 py-2.5"
                style={{
                  backgroundColor: theme.primaryColor,
                  borderRadius: radius,
                }}
              >
                Button Example
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
