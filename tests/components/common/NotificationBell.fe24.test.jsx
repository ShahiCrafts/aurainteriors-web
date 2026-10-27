// FE-24 — NotificationBell:
//  1. The unread badge must come from the dedicated unread-count
//     endpoint on mount (25 unread -> badge "25" BEFORE opening),
//     not from unread∩first-page after the first open.
//  2. 'Mark all read' must actually call the API (pre-fix the bell
//     rendered NotificationDropdown WITHOUT onMarkAllAsRead, so the
//     button's onClick was undefined).
//  3. REST fetches and socket pushes must not clobber each other:
//     socket items survive a slow fetch resolving later, and a stale
//     fetch response never overwrites a newer one.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const hoisted = vi.hoisted(() => ({
  navigate: vi.fn(),
  api: null, // filled per-test
  pushSocket: null, // registered by the mock socket hook
  socketState: null,
}));

vi.mock("react-router-dom", async (orig) => {
  const actual = await orig();
  return { ...actual, useNavigate: () => hoisted.navigate };
});

// Stateful stand-in for useAdminNotificationSocket: real useState, and
// a pushSocket() helper that mimics the socket handler's behaviour
// (prepend + increment unread for unread items).
vi.mock("../../../src/hooks/admin/useAdminNotificationSocket", async () => {
  const React = await import("react");
  return {
    // Named as a hook so react-hooks/rules-of-hooks accepts the
    // useState calls inside this mock.
    default: function useMockAdminNotificationSocket() {
      const [adminNotifications, setAdminNotifications] = React.useState([]);
      const [unreadAdminCount, setUnreadAdminCount] = React.useState(0);
      hoisted.pushSocket = (item) => {
        setAdminNotifications((prev) => [item, ...prev]);
        if (!item.isRead) setUnreadAdminCount((prev) => prev + 1);
      };
      hoisted.socketState = { adminNotifications, unreadAdminCount };
      return {
        adminNotifications,
        unreadAdminCount,
        setAdminNotifications,
        setUnreadAdminCount,
      };
    },
  };
});

vi.mock("../../../src/api/notificationApi", () => ({
  default: {
    getNotifications: (...args) => hoisted.api.getNotifications(...args),
    getUnreadCount: (...args) => hoisted.api.getUnreadCount(...args),
    markAsRead: (...args) => hoisted.api.markAsRead(...args),
    markMultipleAsRead: (...args) => hoisted.api.markMultipleAsRead(...args),
  },
}));

import NotificationBell from "../../../src/components/common/NotificationBell";

const USER = { _id: "admin-1", role: "admin" };

const notif = (id, extra = {}) => ({
  _id: id,
  title: `Notice ${id}`,
  message: "m",
  isRead: false,
  createdAt: "2026-10-24T00:00:00.000Z",
  ...extra,
});

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.api = {
    getNotifications: vi.fn(async () => ({ data: { notifications: [], total: 0, totalPages: 1 } })),
    getUnreadCount: vi.fn(async () => ({ data: { unreadCount: 0 } })),
    markAsRead: vi.fn(async () => ({})),
    markMultipleAsRead: vi.fn(async () => ({})),
  };
});

describe("FE-24 NotificationBell", () => {
  it("badge shows the server unread count (25) on mount, before the dropdown is ever opened", async () => {
    hoisted.api.getUnreadCount.mockResolvedValue({ data: { unreadCount: 25 } });
    const page = Array.from({ length: 10 }, (_, i) => notif(`n${i}`));
    hoisted.api.getNotifications.mockResolvedValue({
      data: { notifications: page, total: 25, totalPages: 3 },
    });

    const { container } = render(<NotificationBell user={USER} token="t" />);

    const badge = await screen.findByText("25");
    expect(badge).toBeInTheDocument();
    expect(hoisted.api.getUnreadCount).toHaveBeenCalled();
    // The capped-page bug would have shown 10 (or nothing pre-open).
    expect(container.textContent).not.toContain("Mark all read");
  });

  it("'Mark all read' calls the API for ALL unread (not just the visible page) and zeroes the badge", async () => {
    hoisted.api.getUnreadCount.mockResolvedValue({ data: { unreadCount: 3 } });
    const visible = [notif("a"), notif("b"), notif("c", { isRead: true })];
    hoisted.api.getNotifications.mockImplementation(async (page, limit, filters) => {
      if (filters?.isRead === false) {
        return {
          data: {
            notifications: [notif("a"), notif("b"), notif("d")],
            total: 3,
            totalPages: 1,
          },
        };
      }
      return { data: { notifications: visible, total: 4, totalPages: 1 } };
    });

    const { container } = render(<NotificationBell user={USER} token="t" />);
    await screen.findByText("3");
    fireEvent.click(container.querySelector("button"));
    const markAll = await screen.findByText("Mark all read");
    fireEvent.click(markAll);

    await waitFor(() =>
      expect(hoisted.api.markMultipleAsRead).toHaveBeenCalledTimes(1)
    );
    // Includes "d", which was never on the visible first page.
    expect(hoisted.api.markMultipleAsRead).toHaveBeenCalledWith(
      expect.arrayContaining(["a", "b", "d"])
    );
    await waitFor(() => expect(screen.queryByText("3")).not.toBeInTheDocument());
  });

  it("a socket notification arriving during a slow fetch survives the fetch resolving", async () => {
    const slow = deferred();
    hoisted.api.getNotifications.mockReturnValue(slow.promise);

    const { container } = render(<NotificationBell user={USER} token="t" />);
    fireEvent.click(container.querySelector("button")); // open -> fetch starts

    act(() => {
      hoisted.pushSocket(notif("socket-1", { title: "Realtime arrival" }));
    });
    await screen.findByText("Realtime arrival");

    await act(async () => {
      slow.resolve({ data: { notifications: [notif("rest-1")], total: 1, totalPages: 1 } });
    });

    // Both the realtime item and the REST item are present.
    expect(await screen.findByText("Notice rest-1")).toBeInTheDocument();
    expect(screen.getByText("Realtime arrival")).toBeInTheDocument();
  });

  it("PEN: a stale fetch response resolving after a newer one is ignored", async () => {
    const first = deferred();
    const second = deferred();
    hoisted.api.getNotifications
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { container } = render(<NotificationBell user={USER} token="t" />);
    const bell = container.querySelector("button");
    fireEvent.click(bell); // open -> fetch #1 (slow)
    fireEvent.click(bell); // close
    fireEvent.click(bell); // reopen -> fetch #2

    await act(async () => {
      second.resolve({ data: { notifications: [notif("newer")], total: 1, totalPages: 1 } });
    });
    expect(await screen.findByText("Notice newer")).toBeInTheDocument();

    await act(async () => {
      first.resolve({ data: { notifications: [notif("stale")], total: 1, totalPages: 1 } });
    });
    expect(screen.queryByText("Notice stale")).not.toBeInTheDocument();
    expect(screen.getByText("Notice newer")).toBeInTheDocument();
  });

  it("PEN: a socket item already present in the REST page is not duplicated by the merge", async () => {
    const slow = deferred();
    hoisted.api.getNotifications.mockReturnValue(slow.promise);

    const { container } = render(<NotificationBell user={USER} token="t" />);
    fireEvent.click(container.querySelector("button"));

    act(() => {
      hoisted.pushSocket(notif("dup-1", { title: "Duplicated arrival" }));
    });
    await act(async () => {
      slow.resolve({
        data: {
          notifications: [notif("dup-1", { title: "Duplicated arrival" }), notif("other")],
          total: 2,
          totalPages: 1,
        },
      });
    });

    await screen.findByText("Notice other");
    expect(screen.getAllByText("Duplicated arrival")).toHaveLength(1);
  });

  it("a failed fetch shows an error state, not 'No notifications found'", async () => {
    hoisted.api.getNotifications.mockRejectedValue(new Error("500"));

    const { container } = render(<NotificationBell user={USER} token="t" />);
    fireEvent.click(container.querySelector("button"));

    expect(
      await screen.findByText(/couldn't load notifications/i)
    ).toBeInTheDocument();
    expect(screen.queryByText("No notifications found.")).not.toBeInTheDocument();
  });
});
