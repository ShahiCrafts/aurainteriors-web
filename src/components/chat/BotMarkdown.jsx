import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// FE-49: bot-markdown renderer, split out of ChatMessage.jsx so the
// react-markdown + remark-gfm pipeline (~half of the former ChatWidget
// chunk) is only downloaded when a bot message actually renders.
// ChatMessage loads this module with React.lazy; the configuration
// below is the exact config that previously lived inline in
// ChatMessage.jsx (FIX 6) — no behaviour change.

// FIX 6: Markdown link renderer — opens in new tab, uses brand colour
const MarkdownLink = ({ href, children }) => {
  let cleanHref = href;
  if (cleanHref && cleanHref.includes("/product/")) {
    cleanHref = "/product/" + cleanHref.split("/product/")[1];
  }
  return (
    <a
      href={cleanHref}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 underline underline-offset-2 hover:text-indigo-800 transition-colors"
    >
      {children}
    </a>
  );
};

// FIX 6: ReactMarkdown component config
// FE-52: memoised on the content string — the micromark parse below
// runs once per distinct message content, not on every ancestor
// re-render (typing events previously re-parsed every bot message).
const BotMarkdown = memo(function BotMarkdown({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      disallowedElements={["script", "style", "iframe", "object", "embed"]}
      unwrapDisallowed
      components={{
        a: MarkdownLink,
        p: ({ children }) => (
          <p className="m-0 p-0 leading-snug text-[14px]">{children}</p>
        ),
        li: ({ children }) => (
          <li className="m-0 p-0 leading-snug text-[14px]">{children}</li>
        ),
        ul: ({ children }) => (
          <ul className="list-none m-0 p-0 space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside m-0 p-0 space-y-0.5">
            {children}
          </ol>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900">{children}</strong>
        ),
        hr: () => <hr className="border-t border-gray-200 my-2 w-full" />,
        h1: ({ children }) => (
          <h1 className="text-base font-extrabold mt-1 mb-0.5">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-bold mt-1 mb-0.5">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mt-1 mb-0.5">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-xs font-bold mt-0.5 mb-0.5">{children}</h4>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

export default BotMarkdown;
