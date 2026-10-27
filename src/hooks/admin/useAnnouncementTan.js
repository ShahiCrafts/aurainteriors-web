import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import announcementApi from "../../api/announcementApi";
import { scopedAdminKey } from "../../lib/adminScope";

// FE-08: admin keys are scoped to the signed-in admin's id (read at
// call time). The public variants serve public data and deliberately
// keep their identity-free keys so both bundles share one cache entry.
export const ANNOUNCEMENT_KEYS = {
  all: () => scopedAdminKey("announcements"),
  list: (params) => [...ANNOUNCEMENT_KEYS.all(), "list", params],
  detail: (id) => [...ANNOUNCEMENT_KEYS.all(), "detail", id],
  stats: () => [...ANNOUNCEMENT_KEYS.all(), "stats"],
  public: (params) => ["announcements", "public", params],
  publicDetail: (id) => ["announcements", "public", "detail", id],
};

// FE-55: mutations invalidate the narrowest keys that changed —
// the list prefix (every list-param variant, nothing else) plus the
// specific detail/stats keys below — never ANNOUNCEMENT_KEYS.all(),
// whose prefix also matched every other announcement's detail and
// the public variants' admin siblings. The old code invalidated
// all() and then detail(id) again, a redundant subset call.
const announcementListKey = () => [...ANNOUNCEMENT_KEYS.all(), "list"];

// ==================== ADMIN HOOKS ====================

// Get all announcements (Admin)
export const useAnnouncements = (params = {}) => {
  return useQuery({
    queryKey: ANNOUNCEMENT_KEYS.list(params),
    queryFn: () => announcementApi.getAll(params),
  });
};

// Get single announcement (Admin)
export const useAnnouncement = (id, options = {}) => {
  return useQuery({
    queryKey: ANNOUNCEMENT_KEYS.detail(id),
    queryFn: () => announcementApi.getById(id),
    enabled: !!id,
    ...options,
  });
};

// Get announcement statistics (Admin)
export const useAnnouncementStats = (options = {}) => {
  return useQuery({
    queryKey: ANNOUNCEMENT_KEYS.stats(),
    queryFn: () => announcementApi.getStats(),
    ...options,
  });
};

// Create announcement (Admin)
export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => announcementApi.create(data),
    onSuccess: () => {
      // FE-55: a new announcement appears in lists and changes the
      // status counts on the same admin screen — nothing else.
      queryClient.invalidateQueries({ queryKey: announcementListKey() });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_KEYS.stats() });
    },
  });
};

// Update announcement (Admin)
export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => announcementApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: announcementListKey() });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_KEYS.stats() });
    },
  });
};

// Delete announcement (Admin)
export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => announcementApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementListKey() });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_KEYS.stats() });
    },
  });
};

// Publish announcement (Admin)
export const usePublishAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => announcementApi.publish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: announcementListKey() });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_KEYS.stats() });
    },
  });
};

// Schedule announcement (Admin)
export const useScheduleAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, scheduledAt }) => announcementApi.schedule(id, scheduledAt),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: announcementListKey() });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_KEYS.stats() });
    },
  });
};

// Archive announcement (Admin)
export const useArchiveAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => announcementApi.archive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: announcementListKey() });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_KEYS.stats() });
    },
  });
};

// ==================== PUBLIC HOOKS ====================

// Get public announcements (User)
export const usePublicAnnouncements = (params = {}) => {
  return useQuery({
    queryKey: ANNOUNCEMENT_KEYS.public(params),
    queryFn: () => announcementApi.getPublic(params),
  });
};

// Get single public announcement (User)
export const usePublicAnnouncement = (id, options = {}) => {
  return useQuery({
    queryKey: ANNOUNCEMENT_KEYS.publicDetail(id),
    queryFn: () => announcementApi.getPublicById(id),
    enabled: !!id,
    ...options,
  });
};
