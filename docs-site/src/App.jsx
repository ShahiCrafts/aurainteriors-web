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

/* 16px line icons, Cloudflare-dashboard style */
function Icon({ paths }) {
  return (
    <svg
      className="ic"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

const GROUP_ICONS = {
  "Getting Started": ["M7 4.5 19 12 7 19.5z"],
  Development: ["M8 6l-5.5 6L8 18", "M16 6l5.5 6L16 18"],
  Features: ["M4 4h7v7H4z", "M13 4h7v7h-7z", "M4 13h7v7H4z", "M13 13h7v7h-7z"],
  "API Reference": ["M4 17l6-5-6-5", "M12 19h8"],
  Deployment: ["M12 16V4.5", "M6 10l6-6 6 6", "M4 20h16"],
  Handover: ["M4 8h12.5", "M13 4l4 4-4 4", "M20 16H7.5", "M11 12l-4 4 4 4"],
  "Owner & Support": ["M12 11a3.8 3.8 0 1 0 0-7.6A3.8 3.8 0 0 0 12 11z", "M4.5 20.5c1.4-3.8 4.4-5.4 7.5-5.4s6.1 1.6 7.5 5.4"],
};
const HOME_ICON = ["M7 3.5h7L18.5 8v12.5h-11.5z", "M13.5 3.5v5h5"];
const CHEVRON = ["M9 5.5 15.5 12 9 18.5"];
const CHEV_DOWN = ["M5.5 9 12 15.5 18.5 9"];

/* Split the markdown into { lead, body }: the H1 is dropped (it becomes the
   page-head title) and the first plain paragraph becomes the gray subtitle,
   mirroring the dashboard's title + description header. */
function splitLead(content) {
  const lines = content.split("\n");
  let i = 0;
  while (i < lines.length && !/^#\s+/.test(lines[i])) i++;
  if (i < lines.length) i++; // drop the H1 line
  let j = i;
  while (j < lines.length && lines[j].trim() === "") j++;
  const block = [];
  let k = j;
  while (k < lines.length && lines[k].trim() !== "") {
    block.push(lines[k]);
    k++;
  }
  const first = (block[0] || "").trim();
  const looksPlain =
    first &&
    !/^(#|-|\*|\||`|>|!|\d+\.)/.test(first) &&
    !first.startsWith("<");
  if (!looksPlain) return { lead: null, body: lines.slice(i).join("\n") };
  const lead = block
    .join(" ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
  return { lead, body: lines.slice(k).join("\n") };
}

function groupOf(slug) {
  if (slug === "") return "Overview";
  const g = NAV.find((g) => g.items.includes(slug));
  return g ? g.group : "Documentation";
}

function sourceUrl(slug) {
  const path = slug === "" ? "docs/README.md" : `docs/${slug}.md`;
  return `https://github.com/ShahiCrafts/aurainteriors-web/blob/main/${path}`;
}

export default function App() {
  const [slug, setSlug] = useState(currentSlug());
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [toc, setToc] = useState([]);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [closedGroups, setClosedGroups] = useState({});
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
  const { lead, body } = useMemo(
    () => (content ? splitLead(content) : { lead: null, body: "" }),
    [content]
  );

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

  const go = (s) => (e) => {
    e.preventDefault();
    navigate(s);
  };

  return (
    <div className="shell">
      <header className="topbar">
        <button className="nav-toggle" onClick={() => setNavOpen((v) => !v)} aria-label="Toggle navigation">
          ☰
        </button>
        <a className="account" href="/" onClick={go("")}>
          <img className="brand-logo" src="/logo-aura-interiors.webp" alt="Aura Interiors" />
          <span className="account-name">Aura Interiors</span>
          <Icon paths={CHEV_DOWN} />
        </a>
        <div className="crumb">
          <span className="crumb-name">docs.aurainteriors.live</span>
          <span className="pill">Docs</span>
        </div>
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
          <kbd className="search-kbd">⌘K</kbd>
        </div>
        <a className="back-pill" href="https://www.aurainteriors.live" target="_blank" rel="noreferrer">
          <span className="back-arrow">←</span> Back to Storefront
        </a>
        {matches ? (
          <nav>
            <div className="nav-group">
              <p className="nav-group-title">Search results</p>
              {matches.length === 0 && <p className="nav-empty">No pages match.</p>}
              {matches.map((s) => (
                <a key={s} className={`nav-item nav-child ${s === slug ? "active" : ""}`} href={"/" + s} onClick={go(s)}>
                  {titleOf(s, pages[s])}
                </a>
              ))}
            </div>
          </nav>
        ) : (
          <nav>
            <a className={`nav-item nav-parent ${slug === "" ? "active" : ""}`} href="/" onClick={go("")}>
              <Icon paths={HOME_ICON} />
              <span>Documentation Home</span>
            </a>
            {NAV.map((g) => {
              const open = !closedGroups[g.group];
              return (
                <div className="nav-group" key={g.group}>
                  <button
                    className="nav-parent nav-group-btn"
                    onClick={() => setClosedGroups((c) => ({ ...c, [g.group]: open }))}
                    aria-expanded={open}
                  >
                    <Icon paths={GROUP_ICONS[g.group] || HOME_ICON} />
                    <span>{g.group}</span>
                    <span className={`chev ${open ? "open" : ""}`}>
                      <Icon paths={CHEVRON} />
                    </span>
                  </button>
                  {open &&
                    g.items.map((s) => (
                      <a key={s} className={`nav-item nav-child ${s === slug ? "active" : ""}`} href={"/" + s} onClick={go(s)}>
                        {pages[s] ? titleOf(s, pages[s]) : s}
                      </a>
                    ))}
                </div>
              );
            })}
          </nav>
        )}
      </aside>

      {bannerOpen && (
        <div className="banner">
          <p>
            This documentation ships with the Aura Interiors platform — the same guides included in the buyer handover.{" "}
            <a href="https://www.aurainteriors.live" target="_blank" rel="noreferrer">
              Visit the live store ↗
            </a>
          </p>
          <button className="banner-x" onClick={() => setBannerOpen(false)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <main className="content">
        {content ? (
          <>
            <div className="page-head">
              <p className="eyebrow">{groupOf(slug)}</p>
              <div className="title-row">
                <h1 className="page-title">{title}</h1>
                <a className="pill-btn" href={sourceUrl(slug)} target="_blank" rel="noreferrer">
                  View source
                </a>
              </div>
              {lead && <p className="page-sub">{lead}</p>}
            </div>

            <div className="card">
              <article ref={articleRef} className="prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                  {body}
                </ReactMarkdown>
              </article>
            </div>

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
          <div className="card">
            <article className="prose">
              <h1>Page not found</h1>
              <p>
                This documentation page doesn't exist. Head back to the{" "}
                <a href="/" onClick={go("")}>
                  documentation home
                </a>
                .
              </p>
            </article>
          </div>
        )}
      </main>

      <aside className="toc">
        {toc.length > 0 && (
          <>
            <p className="rail-title">On this page</p>
            <div className="rail-card toc-card">
              {toc.map((h) => (
                <a key={h.id} href={`#${h.id}`} className={h.level === 3 ? "toc-sub" : ""}>
                  {h.text}
                </a>
              ))}
            </div>
          </>
        )}
        <p className="rail-title">Platform</p>
        <div className="rail-card">
          <div className="kv">
            <span>Storefront</span>
            <a href="https://www.aurainteriors.live" target="_blank" rel="noreferrer">
              aurainteriors.live
            </a>
          </div>
          <div className="kv">
            <span>Admin</span>
            <a href="https://admin.aurainteriors.live" target="_blank" rel="noreferrer">
              admin.aurainteriors.live
            </a>
          </div>
          <div className="kv">
            <span>API</span>
            <a href="https://api.aurainteriors.live/api/v1/settings/public" target="_blank" rel="noreferrer">
              api.aurainteriors.live
            </a>
          </div>
          <div className="kv">
            <span>Source</span>
            <a href="https://github.com/ShahiCrafts/aurainteriors-web" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
        <a className="btn-primary" href="https://www.aurainteriors.live" target="_blank" rel="noreferrer">
          Visit live demo
        </a>
      </aside>
    </div>
  );
}
