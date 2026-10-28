// Markdown URL battery — Vitest port of the audit PoC
// (audit/fe/poc/markdown-url-test.mjs, 12 cases).
//
// Rendering path: a message with senderRole "bot" renders its content
// through the REAL bot-markdown renderer, which since FE-49 lives in
// src/components/chat/BotMarkdown.jsx and is loaded by ChatMessage via
// React.lazy. BotMarkdown carries the exact ReactMarkdown
// configuration under test (unchanged from the pre-split inline one):
//   remarkPlugins={[remarkGfm]}
//   disallowedElements={["script","style","iframe","object","embed"]}
//   unwrapDisallowed
//   components={{ a: MarkdownLink, ... }}
//   MarkdownLink rewrites any href containing "/product/" to the
//   relative "/product/<rest>" and renders target="_blank"
//   rel="noopener noreferrer"
// So these tests exercise the real component end-to-end rather than a
// reproduced configuration. Because the renderer is lazy, each case
// awaits the rendered markdown (the <p> the markdown config emits)
// before asserting — the Suspense fallback's plain text alone would
// trivially pass the hostile cases without exercising the sanitiser.
//
// For every case, rendered into jsdom, assert:
//   - no anchor href starting with javascript:/vbscript:/data:text
//   - no onerror attribute anywhere
//   - no <script> element
// ALL must PASS; a failure is a potential new finding to report, not to
// fix here (Phase 0 is test-only).

import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import ChatMessage from "../../src/components/chat/ChatMessage.jsx";

// Cases transcribed verbatim from audit/fe/poc/markdown-url-test.mjs.
const CASES = {
  "js-link": "[click](javascript:alert(1))",
  "js-link-case": "[click](JaVaScRiPt:alert(1))",
  "js-link-entity": "[click](&#106;avascript:alert(1))",
  "data-html-link":
    "[click](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)",
  "vbscript-link": "[click](vbscript:msgbox(1))",
  "https-link": "[ok](https://example.com/page)",
  "product-link": "[p](https://aurainteriors.live/product/abc-123)",
  "raw-html-img": "hello <img src=x onerror=alert(1)> world",
  "raw-html-a": 'x <a href="javascript:alert(1)">raw</a> y',
  "img-data-svg":
    "![i](data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+)",
  "img-js": "![i](javascript:alert(1))",
  "autolink-js": "<javascript:alert(1)>",
};

const DANGEROUS_HREF_PREFIXES = ["javascript:", "vbscript:", "data:text"];

async function renderBotMessage(markdown) {
  const utils = render(
    <ChatMessage
      message={{
        senderRole: "bot",
        content: markdown,
        createdAt: new Date().toISOString(),
      }}
      isOwnMessage={false}
    />,
  );
  // FE-49: await the lazy BotMarkdown chunk — rendered markdown wraps
  // content in the config's <p>, the plain-text fallback does not.
  await waitFor(() =>
    expect(utils.container.querySelector("p")).not.toBeNull(),
  );
  return utils;
}

function collectViolations(container) {
  const violations = [];
  if (container.querySelector("script")) {
    violations.push("found <script> element");
  }
  for (const el of container.querySelectorAll("*")) {
    for (const attr of el.attributes || []) {
      if (attr.name.toLowerCase() === "onerror") {
        violations.push(`onerror attribute on <${el.localName}>`);
      }
    }
  }
  for (const anchor of container.querySelectorAll("a")) {
    const href = (anchor.getAttribute("href") || "").trim().toLowerCase();
    if (DANGEROUS_HREF_PREFIXES.some((prefix) => href.startsWith(prefix))) {
      violations.push(`dangerous anchor href "${anchor.getAttribute("href")}"`);
    }
  }
  return violations;
}

describe("chat markdown URL battery (audit PoC port, 12 cases)", () => {
  for (const [name, markdown] of Object.entries(CASES)) {
    it(`${name}: no dangerous href, no onerror, no <script>`, async () => {
      const { container } = await renderBotMessage(markdown);
      expect(collectViolations(container)).toEqual([]);
    });
  }

  it("benign: https link renders with its href (and target _blank)", async () => {
    const { container } = await renderBotMessage(CASES["https-link"]);
    const anchor = container.querySelector("a");
    expect(anchor).not.toBeNull();
    expect(anchor.getAttribute("href")).toBe("https://example.com/page");
    expect(anchor.getAttribute("target")).toBe("_blank");
    expect(anchor.textContent).toBe("ok");
  });

  it("benign: /product/ link is rewritten to a relative /product/... href with target _blank", async () => {
    const { container } = await renderBotMessage(CASES["product-link"]);
    const anchor = container.querySelector("a");
    expect(anchor).not.toBeNull();
    expect(anchor.getAttribute("href")).toBe("/product/abc-123");
    expect(anchor.getAttribute("target")).toBe("_blank");
    expect(anchor.textContent).toBe("p");
  });
});
