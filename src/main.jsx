import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import LoadingOverlay from "./components/ui/LoadingOverlay.jsx";
import ToastProvider from "./components/ui/ToastProvider.jsx";
import "./styles/index.css";

/**
 * Global React Query defaults.
 *
 * Previous config: new QueryClient()  — zero config.
 * That caused:
 *  - Every window-focus event triggered a full refetch storm (cart, wishlist,
 *    categories, address, products all refetching simultaneously on tab switch).
 *  - Failed requests were retried 3 times (default) before surfacing an error.
 *  - Cached data was thrown away after 5 min even with active subscribers.
 *
 * New defaults:
 *  staleTime: 5 min  — data is considered fresh for 5 minutes after fetch.
 *                       No network request is fired for the same query within
 *                       this window, even across component remounts.
 *  gcTime: 10 min    — unused cache entries are kept for 10 min, so navigating
 *                       back to a page feels instant (data is still cached).
 *  retry: 1          — retry a failed query once instead of 3x (default).
 *                       Reduces time-to-error-state for genuinely failed calls.
 *  refetchOnWindowFocus: false — do not automatically refetch when the user
 *                       switches browser tabs. The data is fresh enough within
 *                       the staleTime window without hammering the API.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes
      gcTime: 10 * 60 * 1000,          // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
          <App />
          <LoadingOverlay />
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
