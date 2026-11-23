import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NAV, FLAT, pages, titleOf, resolveMdLink } from "./docs.js";

function currentSlug() {
  return window.location.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
}

function navigate(slug) {
  window.history.pushState({}, "", "/" + slug);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function App() {
  const [slug, setSlug] = useState(currentSlug());
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [toc, setToc] = useState([]);
  const articleRef = useRef(null);

  useEffect(() => {
    const onPop = () => {
      setSlug(currentSlug());
      setNavOpen(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const content = pages[slug];
  const title = content ? titleOf(slug, content) : "Not found";

  useEffect(() => {
    document.title = slug === "" ? "Aura Interiors — Documentation" : `${title} — Aura Interiors Docs`;
    window.scrollTo(0, 0);
    const t = setTimeout(() => {
      if (!articleRef.current) return;
      const heads = [...articleRef.current.querySelectorAll("h2, h3")].map((h, i) => {
        h.id = `h-${i}`;
        return { id: h.id, text: h.textContent, level: h.tagName === "H2" ? 2 : 3 };
      });
      setToc(heads);
    }, 60);
    return () => clearTimeout(t);
  }, [slug, title]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return null;
    return FLAT.filter((s) => pages[s] && titleOf(s, pages[s]).toLowerCase().includes(q));
  }, [q]);

  const idx = FLAT.indexOf(slug);
  const prev = idx > 0 ? FLAT[idx - 1] : null;
  const next = idx >= 0 && idx < FLAT.length - 1 ? FLAT[idx + 1] : null;

  const components = {
    a({ href, children, ...props }) {
      const target = resolveMdLink(slug, href || "");
      if (target !== null) {
        return (
          <a
            href={target}
            onClick={(e) => {
              e.preventDefault();
              navigate(target.replace(/^\//, ""));
            }}
          >
            {children}
          </a>
        );
      }
      return (
        <a href={href} target={href && href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" {...props}>
          {children}
        </a>
      );
    },
    img({ src, alt }) {
      let s = src || "";
      if (s.includes("assets/")) s = "/assets/" + s.split("assets/").pop();
      return <img src={s} alt={alt || ""} loading="lazy" />;
    },
  };

  return (
    <div className="shell">
      <header className="topbar">
        <button className="nav-toggle" onClick={() => setNavOpen((v) => !v)} aria-label="Toggle navigation">
          ☰
        </button>
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("");
          }}
        >
          <img className="brand-logo" src="/logo-aura-interiors.webp" alt="Aura Interiors" />
          <span className="brand-doc">Documentation</span>
        </a>
        <div className="topbar-links">
          <a href="https://www.aurainteriors.live" target="_blank" rel="noreferrer">
            Storefront
          </a>
          <a href="https://admin.aurainteriors.live" target="_blank" rel="noreferrer">
            Admin
          </a>
          <a href="https://github.com/ShahiCrafts/aurainteriors-web/tree/main/docs" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </header>

      <aside className={`sidebar ${navOpen ? "open" : ""}`}>
        <div className="search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Quick search…"
            aria-label="Search documentation"
          />
        </div>
        {matches ? (
          <nav>
            <div className="nav-group">
              <p className="nav-group-title">Search results</p>
              {matches.length === 0 && <p className="nav-empty">No pages match.</p>}
              {matches.map((s) => (
                <a
                  key={s}
                  className={`nav-item ${s === slug ? "active" : ""}`}
                  href={"/" + s}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(s);
                  }}
                >
                  {titleOf(s, pages[s])}
                </a>
              ))}
            </div>
          </nav>
        ) : (
          <nav>
            <a
              className={`nav-item nav-home ${slug === "" ? "active" : ""}`}
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate("");
              }}
            >
              Documentation Home
            </a>
            {NAV.map((g) => (
              <div className="nav-group" key={g.group}>
                <p className="nav-group-title">{g.group}</p>
                {g.items.map((s) => (
                  <a
                    key={s}
                    className={`nav-item ${s === slug ? "active" : ""}`}
                    href={"/" + s}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(s);
                    }}
                  >
                    {pages[s] ? titleOf(s, pages[s]) : s}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        )}
      </aside>

      <main className="content">
        {content ? (
          <>
            <article ref={articleRef} className="prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {content}
              </ReactMarkdown>
            </article>
            <div className="prevnext">
              {prev !== null ? (
                <button className="pn" onClick={() => navigate(prev)}>
                  ← {titleOf(prev, pages[prev])}
                </button>
              ) : (
                <span />
              )}
              {next !== null && (
                <button className="pn pn-next" onClick={() => navigate(next)}>
                  {titleOf(next, pages[next])} →
                </button>
              )}
            </div>
          </>
        ) : (
          <article className="prose">
            <h1>Page not found</h1>
            <p>
              This documentation page doesn't exist. Head back to the{" "}
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("");
                }}
              >
                documentation home
              </a>
              .
            </p>
          </article>
        )}
      </main>

      <aside className="toc">
        {toc.length > 0 && (
          <>
            <p className="toc-title">On this page</p>
            {toc.map((h) => (
              <a key={h.id} href={`#${h.id}`} className={h.level === 3 ? "toc-sub" : ""}>
                {h.text}
              </a>
            ))}
          </>
        )}
      </aside>
    </div>
  );
}
