// Sanitizer battery — Vitest port of the audit PoC
// (audit/fe/poc/sanitizer-battery.html, PAYLOADS array; all 24 cases HELD
// per audit/fe/poc/sanitizer-battery-results.txt).
//
// Runs against the REAL src/utils/sanitizeBlogHtml.js (imported, not
// copied). For each payload: sanitize, assign the result to a div via
// innerHTML (exactly how BlogDetailsPage consumes it), then assert
// structural safety of the live DOM:
//   - no script/iframe/object/embed/form/math/svg elements
//   - no attribute whose name starts with "on"
//   - no href/src attribute whose value (trimmed, lowercased) starts
//     with javascript:, vbscript:, or data:text
// ALL 24 must PASS. A failure here is a potential new finding — it must
// be reported, not fixed in the sanitizer (Phase 0 is test-only).

import { describe, it, expect } from "vitest";
import sanitizeBlogHtml from "../../src/utils/sanitizeBlogHtml.js";

// PAYLOADS transcribed from audit/fe/poc/sanitizer-battery.html. The only
// normalization: the PoC's HTML-mandated "<\/script>" escapes are written
// as "</script>" here — in a JS string literal the two are byte-identical
// at runtime, and the escape tripped no-useless-escape.
const PAYLOADS = [
  ["script-tag",        '<script>window.__pwned=1</script><p>ok</p>'],
  ["img-onerror",       '<img src="x" onerror="window.__pwned=1">'],
  ["a-javascript",      '<a href="javascript:window.__pwned=1">x</a>'],
  ["a-javascript-ent",  '<a href="jav&#x61;script:window.__pwned=1">x</a>'],
  ["a-javascript-tab",  '<a href="java\tscript:window.__pwned=1">x</a>'],
  ["a-https-ok",        '<a href="https://example.com/page">ok</a>'],
  ["a-protocol-rel",    '<a href="//evil.example/phish">x</a>'],
  ["svg-xlink",         '<svg><a xlink:href="javascript:window.__pwned=1"><text>x</text></a></svg>'],
  ["math-script",       '<math><mtext><script>window.__pwned=1</script></mtext></math>'],
  ["mxss-mglyph-style", '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=1 onerror=window.__pwned=1>"></mtext></table></math>'],
  ["mxss-form-mglyph",  '<form><math><mtext></form><form><mglyph><style></math><img src="x" onerror="window.__pwned=1">'],
  ["style-img-breakout",'<div><style><a id="</style><img src=x onerror=window.__pwned=1>"></div>'],
  ["title-attr-break",  '<p title="</p><script>window.__pwned=1</script>">x</p>'],
  ["a-title-onclick",   "<a href='https://example.com' title='x\" onclick=\"window.__pwned=1'>x</a>"],
  ["img-data-svg",      '<img src="data:image/svg+xml,<svg onload=window.__pwned=1>">'],
  ["img-srcset",        '<img src="https://example.com/a.png" srcset="javascript:window.__pwned=1">'],
  ["noscript-diff",     '<noscript><p title="</noscript><img src=x onerror=window.__pwned=1>">'],
  ["template-content",  '<template><img src=x onerror=window.__pwned=1></template>'],
  ["iframe-srcdoc",     '<iframe srcdoc="<script>window.__pwned=1</script>"></iframe>'],
  ["details-ontoggle", '<details open ontoggle="window.__pwned=1"><summary>x</summary></details>'],
  ["body-onload-table", '<table background="javascript:window.__pwned=1"><tr><td>x</td></tr></table>'],
  ["h2-id-pre-sanitize",'<h2 onclick="window.__pwned=1">Heading</h2>'],
  ["nested-a-img",      '<a href="https://example.com"><img src="https://example.com/i.png" alt="x"></a>'],
  ["plain-text-ok",     '<p>Hello <strong>world</strong></p>']
];

const FORBIDDEN_ELEMENTS = ["script", "iframe", "object", "embed", "form", "math", "svg"];
const FORBIDDEN_URL_PREFIXES = ["javascript:", "vbscript:", "data:text"];

function renderSanitized(payload) {
  const host = document.createElement("div");
  host.innerHTML = sanitizeBlogHtml(payload);
  document.body.appendChild(host);
  return host;
}

function collectViolations(host) {
  const violations = [];
  for (const el of host.querySelectorAll("*")) {
    const tag = el.localName;
    if (FORBIDDEN_ELEMENTS.includes(tag)) {
      violations.push(`forbidden element <${tag}>`);
    }
    for (const attr of el.attributes || []) {
      const name = attr.name.toLowerCase();
      const value = (attr.value || "").trim().toLowerCase();
      if (name.startsWith("on")) {
        violations.push(`event-handler attribute ${tag}@${name}`);
      }
      if (
        (name === "href" || name === "src") &&
        FORBIDDEN_URL_PREFIXES.some((prefix) => value.startsWith(prefix))
      ) {
        violations.push(`dangerous URL ${tag}@${name}="${attr.value.slice(0, 60)}"`);
      }
    }
  }
  return violations;
}

describe("sanitizeBlogHtml battery (audit PoC port, 24 payloads)", () => {
  for (const [name, payload] of PAYLOADS) {
    it(`${name}: no executable residue in the live DOM`, () => {
      const host = renderSanitized(payload);
      const violations = collectViolations(host);
      host.remove();
      expect(violations).toEqual([]);
    });
  }

  it("benign: the https link keeps its href and gains rel=\"noopener noreferrer\"", () => {
    const host = renderSanitized('<a href="https://example.com/page">ok</a>');
    const anchor = host.querySelector("a");
    expect(anchor).not.toBeNull();
    expect(anchor.getAttribute("href")).toBe("https://example.com/page");
    expect(anchor.getAttribute("rel")).toBe("noopener noreferrer");
    expect(anchor.textContent).toBe("ok");
    host.remove();
  });

  it("benign: the plain-text markup payload keeps its <strong>", () => {
    const host = renderSanitized("<p>Hello <strong>world</strong></p>");
    const strong = host.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong.textContent).toBe("world");
    host.remove();
  });
});
