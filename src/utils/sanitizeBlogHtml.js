const tags = new Set(
  "p br div span h1 h2 h3 h4 h5 h6 strong b em i u s blockquote ul ol li pre code a img table thead tbody tr th td hr figure figcaption".split(
    " ",
  ),
);
export default function sanitizeBlogHtml(html) {
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
  const output = document.createElement("div");
  const copy = (source, parent) => {
    for (const node of source.childNodes) {
      if (node.nodeType === 3) {
        parent.appendChild(document.createTextNode(node.textContent));
        continue;
      }
      if (
        node.nodeType !== 1 ||
        !tags.has(node.localName) ||
        node.namespaceURI !== "http://www.w3.org/1999/xhtml"
      )
        continue;
      const el = document.createElement(node.localName);
      for (const attr of ["alt", "title"])
        if (node.hasAttribute(attr))
          el.setAttribute(attr, node.getAttribute(attr));
      const attr =
        node.localName === "a"
          ? "href"
          : node.localName === "img"
            ? "src"
            : null;
      if (attr && node.hasAttribute(attr)) {
        try {
          const url = new URL(node.getAttribute(attr), window.location.origin);
          if (["http:", "https:"].includes(url.protocol))
            el.setAttribute(attr, url.href);
        } catch {
          /* Discard unsafe or invalid URL. */
        }
      }
      if (node.localName === "a") el.setAttribute("rel", "noopener noreferrer");
      copy(node, el);
      parent.appendChild(el);
    }
  };
  copy(doc.body, output);
  return output.innerHTML;
}
