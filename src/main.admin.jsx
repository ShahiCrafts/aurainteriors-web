import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import AdminApp from "./AdminApp.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
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

// FE-08: shared configured client from src/lib/queryClient.js — the
// config is identical to the customer entry's, and sharing the instance
// lets the auth store clear the cache on sign-out / identity change.

document.body.classList.add("admin-theme");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ErrorBoundary>
            <AdminApp />
          </ErrorBoundary>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
