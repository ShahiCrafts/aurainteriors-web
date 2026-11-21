import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { reportWebVitals } from "./lib/reportWebVitals";
import App from "./App.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import ToastProvider from "./components/ui/ToastProvider.jsx";
import "./styles/index.css";

reportWebVitals();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);

// The branded splash in index.html covers the first paint (including
// any prerendered SEO content) until the app has actually mounted;
// remove it once the first frames are on screen so it never lingers
// over the UI. The splash also has a CSS failsafe fade if this
// bundle fails, and the timeout below is a second safety net.
const removeSplash = () => document.getElementById("app-splash")?.remove();
requestAnimationFrame(() => requestAnimationFrame(removeSplash));
setTimeout(removeSplash, 4000);
