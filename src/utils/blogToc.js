import sanitizeBlogHtml from "./sanitizeBlogHtml";

/**
 * FE-67 — build the blog article body + table of contents from the
 * SANITIZED output.
 *
 * The previous flow injected id="section-N" into <h2>s BEFORE
 * sanitizing, and the sanitizer (correctly, by its allowlist) strips
 * author-supplied id attributes — so every TOC anchor was dead.
 *
 * This helper must never run the other way round, and the sanitizer
 * must NOT start whitelisting id: author ids are untrusted (they can
 * collide with page ids, or be "section-1" themselves and hijack a
 * TOC target). Instead:
 *   1. sanitize the raw HTML (all author ids/attrs are stripped);
 *   2. parse THAT output and enumerate its <h2> headings;
 *   3. assign page-generated ids — section-1, section-2, … — to the
 *      heading elements in the parsed (post-sanitization) DOM;
 *   4. collect the TOC entries from the headings' textContent only
 *      (inert text — React renders the titles as text children, and
 *      the hrefs are built here as same-page fragments, never from
 *      author data).
 *
 * @param {*} rawHtml - Untrusted blog content HTML.
 * @returns {{ html: string, sections: Array<{id: string, title: string}> }}
 *   `html` is the sanitized markup with the generated heading ids
 *   (safe for dangerouslySetInnerHTML — it is sanitizer output whose
 *   only added attributes are the ids assigned in step 3);
 *   `sections[i].id` is exactly the id on the i-th rendered heading.
 */
export function buildBlogContent(rawHtml) {
  const sanitized = sanitizeBlogHtml(rawHtml || "");
  const doc = new DOMParser().parseFromString(sanitized, "text/html");
  const headings = [...doc.body.querySelectorAll("h2")];
  const sections = headings.map((heading, index) => {
    const id = `section-${index + 1}`;
    heading.setAttribute("id", id);
    return { id, title: (heading.textContent || "").trim() };
  });
  return { html: doc.body.innerHTML, sections };
}

export default buildBlogContent;
