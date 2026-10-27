// REUSE-016 / PERF-F-007 — useNotificationsTan: notifications server
// state in React Query. Pins: list query shape, unread select,
// merge-by-id (FE-24 semantics moved from NotificationBell), and the
// optimistic mark-read (list cache updated + unread decremented
// before the API resolves).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const hoisted = vi.hoisted(() => ({ api: null }));

vi.mock("../../src/api/notificationApi", () => ({
  default: {
    getNotifications: (...a) => hoisted.api.getNotifications(...a),
    getUnreadCount: (...a) => hoisted.api.getUnreadCount(...a),
    markAsRead: (...a) => hoisted.api.markAsRead(...a),
    markMultipleAsRead: (...a) => hoisted.api.markMultipleAsRead(...a),
    archiveNotification: (...a) => hoisted.api.archiveNotification(...a),
  },
}));

import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  mergeNotificationsById,
  collectUnreadNotificationIds,
  NOTIFICATION_KEYS,
} from "../../src/hooks/notification/useNotificationsTan";

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }) =>
    React.createElement(QueryClientProvider, { client }, children);
  return { client, wrapper };
};

const page = (notifications, extra = {}) => ({
  data: { notifications, total: notifications.length, totalPages: 1, page: 1, ...extra },
});

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.api = {
    getNotifications: vi.fn(async () => page([])),
    getUnreadCount: vi.fn(async () => ({ data: { unreadCount: 0 } })),
    markAsRead: vi.fn(async () => ({})),
    markMultipleAsRead: vi.fn(async () => ({})),
    archiveNotification: vi.fn(async () => ({})),
  };
});

describe("useNotificationsTan (REUSE-016)", () => {
  it("fetches the list through notificationApi with page/limit/filters", async () => {
    hoisted.api.getNotifications.mockResolvedValue(page([{ _id: "a", isRead: false }]));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useNotifications({ page: 2, limit: 20, filters: { isRead: false } }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(hoisted.api.getNotifications).toHaveBeenCalledWith(2, 20, { isRead: false });
    expect(result.current.data.data.notifications).toHaveLength(1);
  });

  it("unread count resolves to a plain number", async () => {
    hoisted.api.getUnreadCount.mockResolvedValue({ data: { unreadCount: 7 } });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUnreadNotificationCount(), { wrapper });
    await waitFor(() => expect(result.current.data).toBe(7));
  });

  it("mark-read optimistically updates the cached list and decrements unread", async () => {
    hoisted.api.getNotifications.mockResolvedValue(
      page([{ _id: "a", isRead: false }, { _id: "b", isRead: false }])
    );
    hoisted.api.getUnreadCount.mockResolvedValue({ data: { unreadCount: 2 } });
    let resolveMark;
    hoisted.api.markAsRead.mockReturnValue(new Promise((res) => { resolveMark = res; }));
    const { wrapper, client } = makeWrapper();
    const list = renderHook(() => useNotifications({ page: 1, limit: 20 }), { wrapper });
    const unread = renderHook(() => useUnreadNotificationCount(), { wrapper });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(unread.result.current.data).toBe(2));

    const mutation = renderHook(() => useMarkNotificationRead(), { wrapper });
    act(() => { mutation.result.current.mutate("a"); });

    await waitFor(() => {
      const cached = client.getQueryData(NOTIFICATION_KEYS.list(1, 20, {}));
      expect(cached.data.notifications.find((n) => n._id === "a").isRead).toBe(true);
      expect(cached.data.notifications.find((n) => n._id === "b").isRead).toBe(false);
    });
    await waitFor(() => expect(unread.result.current.data).toBe(1));
    await act(async () => { resolveMark({}); });
    expect(hoisted.api.markAsRead).toHaveBeenCalledWith("a");
  });

  it("mergeNotificationsById keeps socket-only items at the front and dedupes (FE-24)", () => {
    const fetched = [{ _id: "1", title: "rest-1" }, { _id: "2", title: "rest-2" }];
    const existing = [{ _id: "2", title: "socket-2" }, { _id: "3", title: "socket-3" }];
    const merged = mergeNotificationsById(fetched, existing);
    expect(merged.map((n) => n._id)).toEqual(["3", "1", "2"]);
    expect(merged.find((n) => n._id === "2").title).toBe("rest-2");
  });

  it("collectUnreadNotificationIds pages the isRead=false filter", async () => {
    hoisted.api.getNotifications.mockImplementation(async (p) =>
      p === 1
        ? page([{ _id: "a" }, { _id: "b" }], { totalPages: 2 })
        : page([{ _id: "c" }], { totalPages: 2 })
    );
    await expect(collectUnreadNotificationIds()).resolves.toEqual(["a", "b", "c"]);
    expect(hoisted.api.getNotifications).toHaveBeenCalledWith(1, 50, { isRead: false });
  });
});
