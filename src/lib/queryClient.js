import { QueryClient } from "@tanstack/react-query";
import { toast } from "./toast.js";
import { formatError } from "../utils/errorHandler.js";

/**
 * The single shared React Query client (FE-08).
 *
 * Both entry points (src/main.jsx and src/main.admin.jsx) previously
 * constructed their own QueryClient with identical defaults, which
 * meant the auth store had no client it could clear: the admin
 * sign-out never emptied the cache, and identity-less admin keys could
 * serve one admin's data to the next on a shared machine.
 *
 * This module imports ONLY leaf modules (@tanstack/react-query,
 * ./toast.js and ../utils/errorHandler.js — neither of which imports
 * anything) so the auth store can statically import it without
 * recreating the FE-59 import cycle (broken in FE-59 itself: the api
 * layer now reads the token through the src/lib/tokenSource.js leaf,
 * so the store imports the api statically).
 *
 * Query defaults (unchanged from the two entry-point configs):
 *  staleTime: 5 min — data is fresh for 5 minutes after fetch.
 *  gcTime: 10 min   — unused entries are kept for 10 minutes.
 *  retry: 1         — retry a failed query once instead of 3x.
 *  refetchOnWindowFocus: false — no refetch storm on tab switch.
 *
 * FE-47 — mutation error policy:
 *  A default mutation onError toasts formatError(error): the server's
 *  own message when it sends one, a status-mapped/generic message
 *  otherwise. Before this, almost no mutation defined onError, so
 *  failures presented as "nothing happened".
 *
 *  Double-toast avoidance, two mechanisms:
 *   1. A mutation that defines its OWN onError in its useMutation
 *      options overrides this default entirely (React Query merges
 *      defaultOptions under the mutation's own options), so it is
 *      never toasted twice by this handler.
 *   2. OPT-OUT CONVENTION: a mutation whose error is handled
 *      somewhere this default cannot see — e.g. every call site
 *      passes its own onError to mutate(), or the hook reports the
 *      error through a richer channel — sets
 *          meta: { suppressGlobalErrorToast: true }
 *      in its useMutation options, and this handler stays silent.
 *      (useSubmitContact is the worked example: ContactPage passes a
 *      per-call onError, so the hook carries the meta flag.)
 */
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
