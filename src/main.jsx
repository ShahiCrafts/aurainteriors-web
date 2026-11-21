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
// any prerendered SEO content) until the app has actually mounted.
// App dismisses it from its mount effect via lib/splash — removing it
// here, before React commits, would flash the unstyled snapshot.
// These are only safety nets: the splash also has a CSS failsafe
// fade, and this timeout force-removes it if the app never mounts.
setTimeout(() => document.getElementById("app-splash")?.remove(), 6000);
