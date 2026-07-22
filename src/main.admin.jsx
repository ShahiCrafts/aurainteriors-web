import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminApp from "./AdminApp.jsx";
import ToastProvider from "./components/ui/ToastProvider.jsx";
import "./styles/index.css";

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ENTRY POINT — main.admin.jsx
//
// This file is used exclusively by the admin build target.
// It mounts AdminApp instead of App, so the admin bundle contains
// ZERO customer pages, routes, or logic.
//
// Customer entry: src/main.jsx  → App.jsx
// Admin entry:    src/main.admin.jsx → AdminApp.jsx
// ─────────────────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

document.body.classList.add("admin-theme");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AdminApp />
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
