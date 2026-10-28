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

/**
 * Global React Query defaults live in src/lib/queryClient.js (FE-08):
 * one shared configured client for both entry points, so the auth
 * store can clear the cache on sign-out / identity change.
 * (staleTime 5 min, gcTime 10 min, retry 1, no refetch on window focus
 * — see that module for the rationale.)
 */

// No-op unless the build sets VITE_WEB_VITALS=1 (see lib/reportWebVitals.js).
reportWebVitals();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/*
          ToastProvider wraps the whole tree and registers the global toast
          dispatcher. It replaces the old <ToastContainer> from react-toastify.
          All existing toast.success() / toast.error() calls throughout the
          codebase continue to work unchanged — they resolve to our custom
          toast singleton via the Vite alias in vite.config.js.
        */}
        <ToastProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
