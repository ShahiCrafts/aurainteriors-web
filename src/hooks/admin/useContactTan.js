import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import contactApi from "../../api/contactApi";
import { scopedAdminKey } from "../../lib/adminScope";

// FE-08: keys are scoped to the signed-in admin's id (read at call time).
export const CONTACT_KEYS = {
  all: () => scopedAdminKey("contacts"),
  list: (params) => [...CONTACT_KEYS.all(), "list", params],
  detail: (id) => [...CONTACT_KEYS.all(), "detail", id],
  stats: () => [...CONTACT_KEYS.all(), "stats"],
};

// FE-55: mutations invalidate the narrowest keys that changed —
// the list prefix (every list-param variant, nothing else) plus
// the mutated contact's detail — never CONTACT_KEYS.all(), whose
// prefix also matched every other contact's detail and the stats
// query. Contact stats are deliberately NOT invalidated: no page
// consumes useContactStats (grep-verified), so refetching it was
// pure storm. The old code also invalidated detail(id) redundantly
// after all(), a subset of the first call.
const contactListKey = () => [...CONTACT_KEYS.all(), "list"];

// Public: Submit contact form
export const useSubmitContact = () => {
  return useMutation({
    mutationFn: (data) => contactApi.submit(data),
    // FE-47: ContactPage (the sole call site) passes its own per-call
    // onError toast, so opt out of the QueryClient global error toast
    // to avoid double-toasting (see src/lib/queryClient.js).
    meta: { suppressGlobalErrorToast: true },
  });
};

// Admin: Get all contacts
export const useContacts = (params = {}) => {
  return useQuery({
    queryKey: CONTACT_KEYS.list(params),
    queryFn: () => contactApi.getAll(params),
  });
};

// Admin: Get single contact
export const useContact = (id, options = {}) => {
  return useQuery({
    queryKey: CONTACT_KEYS.detail(id),
    queryFn: () => contactApi.getById(id),
    enabled: !!id,
    ...options,
  });
};

// Admin: Get contact stats
export const useContactStats = () => {
  return useQuery({
    queryKey: CONTACT_KEYS.stats(),
    queryFn: () => contactApi.getStats(),
    staleTime: 30000, // 30 seconds
  });
};

// Admin: Update contact
export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => contactApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: contactListKey() });
      queryClient.invalidateQueries({ queryKey: CONTACT_KEYS.detail(id) });
    },
  });
};

// Admin: Mark as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isRead }) => contactApi.markAsRead(id, isRead),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: contactListKey() });
      queryClient.invalidateQueries({ queryKey: CONTACT_KEYS.detail(id) });
    },
  });
};

// Admin: Respond to contact
export const useRespondToContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, message }) => contactApi.respond(id, message),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: contactListKey() });
      queryClient.invalidateQueries({ queryKey: CONTACT_KEYS.detail(id) });
    },
  });
};

// Admin: Delete contact
export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => contactApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactListKey() });
    },
  });
};

// Admin: Bulk update
export const useBulkUpdateContacts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, ...data }) => contactApi.bulkUpdate(ids, data),
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: contactListKey() });
      // FE-55: only the details that were actually bulk-updated.
      for (const id of ids || []) {
        queryClient.invalidateQueries({ queryKey: CONTACT_KEYS.detail(id) });
      }
    },
  });
};
