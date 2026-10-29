import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import notificationApi from "../../api/notificationApi";

export const NOTIFICATION_KEYS = {
  all: ["notifications"],
  lists: () => [...NOTIFICATION_KEYS.all, "list"],
  list: (page, limit, filters) => [
    ...NOTIFICATION_KEYS.lists(),
    page,
    limit,
    filters,
  ],
  unread: () => [...NOTIFICATION_KEYS.all, "unreadCount"],
};

const notifId = (n) => n?._id ?? n?.id;

export const mergeNotificationsById = (fetchedList, existingList) => {
  const fetchedIds = new Set(
    (fetchedList || []).map(notifId).filter((id) => id != null),
  );
  const socketOnly = (existingList || []).filter((n) => {
    const id = notifId(n);
    return id == null || !fetchedIds.has(id);
  });
  return [...socketOnly, ...(fetchedList || [])];
};

export const useNotifications = ({
  page = 1,
  limit = 20,
  filters = {},
  enabled = true,
  keyExtra,
} = {}) =>
  useQuery({
    queryKey:
      keyExtra === undefined
        ? NOTIFICATION_KEYS.list(page, limit, filters)
        : [...NOTIFICATION_KEYS.list(page, limit, filters), keyExtra],
    queryFn: () => notificationApi.getNotifications(page, limit, filters),
    enabled,
  });

/** Unread badge count; resolves to a plain number (0 while loading). */
export const useUnreadNotificationCount = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: NOTIFICATION_KEYS.unread(),
    queryFn: () => notificationApi.getUnreadCount(),
    enabled,
    select: (response) => {
      const count = response?.data?.unreadCount;
      return Number.isFinite(count) ? count : 0;
    },
  });

const markIdsReadInCache = (queryClient, ids) => {
  const idSet = new Set(ids);
  queryClient.setQueriesData({ queryKey: NOTIFICATION_KEYS.lists() }, (old) => {
    if (!old?.data?.notifications) return old;
    return {
      ...old,
      data: {
        ...old.data,
        notifications: old.data.notifications.map((n) =>
          idSet.has(notifId(n)) ? { ...n, isRead: true } : n,
        ),
      },
    };
  });
};

const decrementUnreadInCache = (queryClient, by) => {
  if (!by) return;
  queryClient.setQueryData(NOTIFICATION_KEYS.unread(), (old) => {
    const count = old?.data?.unreadCount;
    if (!Number.isFinite(count)) return old;
    return {
      ...old,
      data: { ...old.data, unreadCount: Math.max(0, count - by) },
    };
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });
      markIdsReadInCache(queryClient, [id]);
      decrementUnreadInCache(queryClient, 1);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unread() });
    },
    meta: { suppressGlobalErrorToast: true },
  });
};

export const useMarkMultipleNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => notificationApi.markMultipleAsRead(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });
      markIdsReadInCache(queryClient, ids);
      queryClient.setQueryData(NOTIFICATION_KEYS.unread(), (old) => {
        if (!old?.data) return old;
        return { ...old, data: { ...old.data, unreadCount: 0 } };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
    meta: { suppressGlobalErrorToast: true },
  });
};

export const useArchiveNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationApi.archiveNotification(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
    meta: { suppressGlobalErrorToast: true },
  });
};

export const collectUnreadNotificationIds = async () => {
  const ids = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await notificationApi.getNotifications(page, 50, {
      isRead: false,
    });
    const list = response?.data?.notifications || response?.notifications || [];
    for (const n of list) {
      const id = notifId(n);
      if (id != null) ids.push(id);
    }
    totalPages = response?.data?.totalPages || 1;
    page += 1;
  } while (page <= totalPages && page <= 20);
  return ids;
};
