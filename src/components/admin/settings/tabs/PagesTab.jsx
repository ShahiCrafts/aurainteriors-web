import { useRef } from "react";
import {
  Info,
  Shield,
  FileText,
  Truck,
  RotateCcw,
  HelpCircle,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  Card,
  Field,
  inputClass,
  textareaClass,
  smallButtonClass,
  iconButtonClass,
} from "../ui";

// Content Pages tab (Batch 3d): the Batch 3a editor restyled into
// the reference card design — an "Editable Pages" list at the top
// (Edit jumps to the matching editor card) above the editors
// themselves. Content is stored as Markdown/plain text and rendered
// on the storefront content pages (Batch 3b).

const PAGE_DEFS = [
  { key: "about", label: "About Us", Icon: Info },
  { key: "privacyPolicy", label: "Privacy Policy", Icon: Shield },
  { key: "termsOfService", label: "Terms of Service", Icon: FileText },
  { key: "shippingInfo", label: "Shipping Info", Icon: Truck },
  { key: "returnsRefunds", label: "Returns & Refunds", Icon: RotateCcw },
  { key: "faq", label: "FAQ", Icon: HelpCircle },
];

const emptyFaq = () => ({ question: "", answer: "" });

export default function PagesTab({ pages, onPages }) {
  const editorRefs = useRef({});

  const patchFaq = (index, field, value) =>
    onPages({
      faq: pages.faq.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    });

  const scrollToEditor = (key) => {
    const el = editorRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      const field = el.querySelector("textarea, input");
      if (field) field.focus({ preventScroll: true });
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title="Editable Pages"
        description="Edit the content of your store's pages."
      >
        <ul className="divide-y divide-gray-100">
          {PAGE_DEFS.map(({ key, label, Icon }) => (
            <li
              key={key}
              className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <Icon className="w-5 h-5" />
              </span>
              <span className="flex-1 text-sm font-medium text-gray-800">
                {label}
              </span>
              <button
                type="button"
                onClick={() => scrollToEditor(key)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {PAGE_DEFS.filter(({ key }) => key !== "faq").map(
          ({ key, label, Icon }) => (
            <div
              key={key}
              ref={(el) => {
                editorRefs.current[key] = el;
              }}
            >
              <Card title={label}>
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                  <Icon className="w-4 h-4" />
                  Rendered on the storefront as Markdown. Leave empty
                  to show a "coming soon" notice.
                </div>
                <textarea
                  aria-label={label}
                  value={pages[key] || ""}
                  onChange={(e) => onPages({ [key]: e.target.value })}
                  className={`${textareaClass} !min-h-44`}
                />
              </Card>
            </div>
          ),
        )}

        <div
          ref={(el) => {
            editorRefs.current.faq = el;
          }}
        >
          <Card
            title="FAQ"
            description="Questions and answers shown on the FAQ page."
          >
            <div className="space-y-4">
              {pages.faq.map((row, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-4 space-y-4"
                >
                  <Field label={`Question ${index + 1}`}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        aria-label={`FAQ question ${index + 1}`}
                        value={row.question || ""}
                        onChange={(e) =>
                          patchFaq(index, "question", e.target.value)
                        }
                        className={inputClass}
                      />
                      <button
                        type="button"
                        aria-label={`Remove FAQ ${index + 1}`}
                        onClick={() =>
                          onPages({
                            faq: pages.faq.filter((_, i) => i !== index),
                          })
                        }
                        className={iconButtonClass}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </Field>
                  <Field label={`Answer ${index + 1}`}>
                    <textarea
                      aria-label={`FAQ answer ${index + 1}`}
                      value={row.answer || ""}
                      onChange={(e) =>
                        patchFaq(index, "answer", e.target.value)
                      }
                      className={`${textareaClass} !min-h-20`}
                    />
                  </Field>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onPages({ faq: [...pages.faq, emptyFaq()] })}
              className={`${smallButtonClass} mt-4`}
            >
              <Plus className="w-4 h-4" /> Add FAQ
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
