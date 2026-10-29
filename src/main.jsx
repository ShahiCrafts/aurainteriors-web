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
