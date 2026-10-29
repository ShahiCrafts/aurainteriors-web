import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import AdminApp from "./AdminApp.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import ToastProvider from "./components/ui/ToastProvider.jsx";
import "./styles/index.css";

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
