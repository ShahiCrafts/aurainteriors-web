// FE-04 PEN-TEST — Announcements write side (submit path).
// A hostile actionUrl / imageUrl must block the save with an inline
// error and the create mutation must NOT be called; empty URL fields
// stay allowed (both are optional today) and a legit value saves.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const hoisted = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../../../src/hooks/admin/useAnnouncementTan", () => {
  const mutation = (fn) => () => ({ mutateAsync: fn, isPending: false });
  return {
    useAnnouncements: () => ({
      data: { data: { announcements: [], pagination: {} } },
      isLoading: false,
    }),
    useAnnouncementStats: () => ({ data: { data: { stats: {} } } }),
    useCreateAnnouncement: mutation(hoisted.create),
    useUpdateAnnouncement: mutation(hoisted.update),
    useDeleteAnnouncement: mutation(vi.fn()),
    usePublishAnnouncement: mutation(vi.fn()),
    useScheduleAnnouncement: mutation(vi.fn()),
    useArchiveAnnouncement: mutation(vi.fn()),
  };
});

import Announcements from "../../../src/pages/admin/Announcements";

async function openFormAndFill({ actionUrl, imageUrl }) {
  render(<Announcements />);
  const [newBtn] = await screen.findAllByText("New Announcement");
  fireEvent.click(newBtn);
  fireEvent.change(
    await screen.findByPlaceholderText("Enter announcement title"),
    {
      target: { value: "Sale" },
    },
  );
  fireEvent.change(screen.getByPlaceholderText("Enter announcement content"), {
    target: { value: "Big sale this week" },
  });
  if (actionUrl !== undefined) {
    fireEvent.change(
      screen.getByPlaceholderText("/dashboard/orders or https://…"),
      {
        target: { value: actionUrl },
      },
    );
  }
  if (imageUrl !== undefined) {
    fireEvent.change(
      screen.getByPlaceholderText("https://example.com/image.jpg"),
      {
        target: { value: imageUrl },
      },
    );
  }
  // "Create Announcement" exists twice (empty-state button + modal
  // submit) — the modal's is the last in DOM order.
  const submitButtons = await screen.findAllByText("Create Announcement");
  fireEvent.click(submitButtons[submitButtons.length - 1]);
}

describe("FE-04 Announcements save validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.create.mockResolvedValue({});
  });

  it("hostile actionUrl (javascript:) blocks the save with an inline error", async () => {
    await openFormAndFill({ actionUrl: "javascript:alert(1)" });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /site-relative path/,
    );
    expect(hoisted.create).not.toHaveBeenCalled();
  });

  it("hostile actionUrl (foreign https) blocks the save", async () => {
    await openFormAndFill({ actionUrl: "https://evil.com/promo" });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(hoisted.create).not.toHaveBeenCalled();
  });

  it("hostile imageUrl (evil host) blocks the save with an inline error", async () => {
    await openFormAndFill({ imageUrl: "https://evil.com/banner.jpg" });
    expect(await screen.findByRole("alert")).toHaveTextContent(/allowed host/);
    expect(hoisted.create).not.toHaveBeenCalled();
  });

  it("empty URL fields stay allowed and the save goes through", async () => {
    await openFormAndFill({});
    await waitFor(() => expect(hoisted.create).toHaveBeenCalledTimes(1));
    const payload = hoisted.create.mock.calls[0][0];
    expect(payload.actionUrl).toBeUndefined();
    expect(payload.imageUrl).toBeUndefined();
  });

  it("a legit site-relative actionUrl + Cloudinary image saves", async () => {
    await openFormAndFill({
      actionUrl: "/admin/orders",
      imageUrl: "https://res.cloudinary.com/demo/banner.jpg",
    });
    await waitFor(() => expect(hoisted.create).toHaveBeenCalledTimes(1));
    const payload = hoisted.create.mock.calls[0][0];
    expect(payload.actionUrl).toBe("/admin/orders");
    expect(payload.imageUrl).toBe("https://res.cloudinary.com/demo/banner.jpg");
  });
});
