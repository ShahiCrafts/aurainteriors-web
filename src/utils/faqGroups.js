import { faqData } from "../data/faqData.js";

// FAQ grouping (Batch 3b): the FAQ content can come from site
// settings (pages.faq, a flat {question, answer} list). The settings
// DEFAULTS are exactly faqData flattened (Batch 3a extracted them
// from it), so:
// - settings not loaded yet, or loaded-but-equal to the fallback →
//   faqData with its category grouping, exactly as before;
// - settings loaded AND edited → the admin's flat list as one group
//   in the same shape the page renders ({category, icon, questions}).
const flatFallback = faqData.flatMap((category) =>
  category.questions.map((item) => ({ question: item.q, answer: item.a })),
);

export function faqGroupsFromSettings(settingsFaq, loaded) {
  if (!loaded || !Array.isArray(settingsFaq) || settingsFaq.length === 0) {
    return faqData;
  }
  const isDefault =
    settingsFaq.length === flatFallback.length &&
    settingsFaq.every(
      (item, i) =>
        item?.question === flatFallback[i].question &&
        item?.answer === flatFallback[i].answer,
    );
  if (isDefault) return faqData;
  return [
    {
      category: "General",
      icon: "HelpCircle",
      questions: settingsFaq.map((item, i) => ({
        id: `settings-${i}`,
        q: item.question,
        a: item.answer,
      })),
    },
  ];
}
