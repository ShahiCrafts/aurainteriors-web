// FE-04 PEN-TEST — NotificationBell consume side.
// A hostile stored actionUrl must produce NO navigation (mark-as-read
// still happens); a legit '/admin/orders' + orderId must navigate to
// '/dashboard/orders?highlight=<id>' with the query merged safely.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const hoisted = vi.hoisted(() => ({
  navigate: vi.fn(),
  notifications: [],
  markAsRead: vi.fn(),
  setAdminNotifications: vi.fn(),
  setUnreadAdminCount: vi.fn(),
}));

vi.mock("react-router-dom", async (orig) => {
  const actual = await orig();
  return { ...actual, useNavigate: () => hoisted.navigate };
});

vi.mock("../../../src/hooks/admin/useAdminNotificationSocket", () => ({
  default: () => ({
    adminNotifications: hoisted.notifications,
    unreadAdminCount: hoisted.notifications.filter((n) => !n.isRead).length,
    setAdminNotifications: hoisted.setAdminNotifications,
    setUnreadAdminCount: hoisted.setUnreadAdminCount,
  }),
}));

vi.mock("../../../src/api/notificationApi", () => ({
  default: {
    getNotifications: vi.fn(async () => ({ data: { notifications: hoisted.notifications } })),
    // FE-24: the bell now also fetches the unread count on mount and
    // can mark multiple as read; the mock surface covers both.
    getUnreadCount: vi.fn(async () => ({
      data: { unreadCount: hoisted.notifications.filter((n) => !n.isRead).length },
    })),
    markMultipleAsRead: vi.fn(async () => ({})),
    markAsRead: hoisted.markAsRead,
  },
}));

import NotificationBell from "../../../src/components/common/NotificationBell";

const USER = { _id: "admin-1", role: "admin" };

async function openAndClick(notification) {
  hoisted.notifications = [notification];
  const { container } = render(<NotificationBell user={USER} token="t" />);
  fireEvent.click(container.querySelector("button"));
  const item = await screen.findByText(notification.title);
  fireEvent.click(item);
}

describe("FE-04 NotificationBell actionUrl consumption", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.markAsRead.mockResolvedValue({});
  });

  it("hostile actionUrl (foreign https): NO navigation, mark-as-read still happens", async () => {
    await openAndClick({
      _id: "n1",
      title: "Hostile notice",
      isRead: false,
      actionUrl: "https://evil.com/phish",
      data: { orderId: "ord1" },
    });
    await waitFor(() => expect(hoisted.markAsRead).toHaveBeenCalled());
    expect(hoisted.navigate).not.toHaveBeenCalled();
  });

  it("hostile actionUrl (protocol-relative): NO navigation", async () => {
    await openAndClick({
      _id: "n2",
      title: "Sneaky notice",
      isRead: true,
      actionUrl: "//evil.com/phish",
      data: {},
    });
    expect(hoisted.navigate).not.toHaveBeenCalled();
  });

  it("hostile actionUrl (javascript:): NO navigation", async () => {
    await openAndClick({
      _id: "n3",
      title: "Scripty notice",
      isRead: true,
      actionUrl: "javascript:alert(1)",
      data: {},
    });
    expect(hoisted.navigate).not.toHaveBeenCalled();
  });

  it("legit '/admin/orders' + orderId navigates to '/dashboard/orders?highlight=<id>'", async () => {
    await openAndClick({
      _id: "n4",
      title: "New order received",
      isRead: false,
      actionUrl: "/admin/orders",
      data: { orderId: "ord42" },
    });
    await waitFor(() =>
      expect(hoisted.navigate).toHaveBeenCalledWith("/dashboard/orders?highlight=ord42")
    );
  });

  it("legit actionUrl with an existing query keeps it and appends highlight with &", async () => {
    await openAndClick({
      _id: "n5",
      title: "Order update",
      isRead: true,
      actionUrl: "/admin/orders?status=open",
      data: { orderId: "a&highlight=pwn" },
    });
    await waitFor(() =>
      expect(hoisted.navigate).toHaveBeenCalledWith(
        "/dashboard/orders?status=open&highlight=a%26highlight%3Dpwn"
      )
    );
  });
});
