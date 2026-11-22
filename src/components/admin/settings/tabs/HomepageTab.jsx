import { ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import {
  Card,
  Field,
  Toggle,
  inputClass,
  textareaClass,
  smallButtonClass,
  iconButtonClass,
} from "../ui";
import { ImageField } from "../fields";

// Homepage tab (Batch 3d): the Batch 3a editor restyled into the
// reference card design. Same data shapes — heroSlides[],
// promoBanner, sections flags, sectionsOrder.

export const HOMEPAGE_SECTION_LABELS = {
  hero: "Hero",
  trustBanner: "Trust banner",
  shopByCategory: "Shop by category",
  featuredPieces: "Featured pieces",
  testimonials: "Testimonials",
};

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

function SlideThumb({ src, alt }) {
  return src ? (
    <img
      src={src}
      alt={alt}
      className="w-32 h-24 object-cover rounded-lg border border-gray-200 shrink-0 bg-gray-50"
    />
  ) : (
    <span className="w-32 h-24 rounded-lg border border-dashed border-gray-200 bg-gray-50 shrink-0 flex items-center justify-center text-xs text-gray-400">
      No image
    </span>
  );
}

export default function HomepageTab({ homepage, onHomepage }) {
  const patchSlide = (index, field, value) =>
    onHomepage({
      heroSlides: homepage.heroSlides.map((slide, i) =>
        i === index ? { ...slide, [field]: value } : slide,
      ),
    });

  const move = (list, index, delta) => {
    const next = [...list];
    const target = index + delta;
    if (target < 0 || target >= next.length) return list;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  };

  return (
    <div className="space-y-6">
      <Card
        title="Hero Slides"
        description="The rotating slides at the top of your homepage."
      >
        <div className="space-y-4">
          {homepage.heroSlides.map((slide, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-4"
            >
              <SlideThumb src={slide.imageUrl} alt={`Slide ${index + 1}`} />
              <div className="flex-1 space-y-4 min-w-0">
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
                    className={`${textareaClass} !min-h-16`}
                  />
                </Field>
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
              </div>
              <div className="flex md:flex-col items-center gap-1 shrink-0">
                <MoveButtons
                  label={`slide ${index + 1}`}
                  index={index}
                  count={homepage.heroSlides.length}
                  onMove={(i, d) =>
                    onHomepage({
                      heroSlides: move(homepage.heroSlides, i, d),
                    })
                  }
                />
                <Toggle
                  ariaLabel={`Slide ${index + 1} enabled`}
                  checked={slide.enabled !== false}
                  onChange={(v) => patchSlide(index, "enabled", v)}
                />
                <button
                  type="button"
                  aria-label={`Remove slide ${index + 1}`}
                  onClick={() =>
                    onHomepage({
                      heroSlides: homepage.heroSlides.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                  className={iconButtonClass}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            onHomepage({
              heroSlides: [...homepage.heroSlides, emptySlide()],
            })
          }
          className={`${smallButtonClass} mt-4`}
        >
          <Plus className="w-4 h-4" /> Add slide
        </button>
      </Card>

      <Card
        title="Promo Banner"
        description="The promotional card shown with the hero."
      >
        <div className="flex flex-col md:flex-row gap-4">
          <SlideThumb
            src={homepage.promoBanner.imageUrl}
            alt="Promo banner"
          />
          <div className="flex-1 space-y-4 min-w-0">
            <ImageField
              label="Promo image URL"
              value={homepage.promoBanner.imageUrl}
              onChange={(v) =>
                onHomepage({
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
                    onHomepage({
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
                    onHomepage({
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
                  onHomepage({
                    promoBanner: {
                      ...homepage.promoBanner,
                      subtext: e.target.value,
                    },
                  })
                }
                className={`${textareaClass} !min-h-16`}
              />
            </Field>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-52">
                <Field label="Promo button link">
                  <input
                    type="text"
                    aria-label="Promo button link"
                    value={homepage.promoBanner.buttonLink || ""}
                    onChange={(e) =>
                      onHomepage({
                        promoBanner: {
                          ...homepage.promoBanner,
                          buttonLink: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
              <Toggle
                label="Enabled"
                ariaLabel="Promo enabled"
                checked={homepage.promoBanner.enabled !== false}
                onChange={(v) =>
                  onHomepage({
                    promoBanner: { ...homepage.promoBanner, enabled: v },
                  })
                }
              />
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="Featured Sections"
        description="Choose which homepage sections show, and in what order."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3.5">
            {Object.keys(HOMEPAGE_SECTION_LABELS).map((key) => (
              <Toggle
                key={key}
                label={HOMEPAGE_SECTION_LABELS[key]}
                ariaLabel={`Show ${HOMEPAGE_SECTION_LABELS[key]}`}
                checked={homepage.sections[key] !== false}
                onChange={(v) =>
                  onHomepage({
                    sections: { ...homepage.sections, [key]: v },
                  })
                }
              />
            ))}
            <Toggle
              label="Announcements bar"
              ariaLabel="Show announcements"
              checked={homepage.announcementsEnabled !== false}
              onChange={(v) => onHomepage({ announcementsEnabled: v })}
            />
            <Toggle
              label="Newsletter signup"
              ariaLabel="Show newsletter"
              checked={homepage.newsletterEnabled !== false}
              onChange={(v) => onHomepage({ newsletterEnabled: v })}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Reorder Sections
            </p>
            <ul className="space-y-2">
              {homepage.sectionsOrder.map((key, index) => (
                <li
                  key={key}
                  className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-2.5 bg-white"
                >
                  <span className="text-sm text-gray-800">
                    {index + 1}. {HOMEPAGE_SECTION_LABELS[key] || key}
                  </span>
                  <MoveButtons
                    label={`section ${key}`}
                    index={index}
                    count={homepage.sectionsOrder.length}
                    onMove={(i, d) =>
                      onHomepage({
                        sectionsOrder: move(homepage.sectionsOrder, i, d),
                      })
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
