import { QueryClient } from "@tanstack/react-query";
import { toast } from "./toast.js";
import { formatError } from "../utils/errorHandler.js";

export function handleGlobalMutationError(
  error,
  _variables,
  _context,
  mutation,
) {
  if (mutation?.meta?.suppressGlobalErrorToast) return;
  toast.error(formatError(error));
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: handleGlobalMutationError,
    },
  },
});

export default queryClient;
