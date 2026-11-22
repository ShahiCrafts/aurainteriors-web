import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const h = vi.hoisted(() => ({ user: { _id: "a1", role: "admin" } }));
vi.mock("../../../src/store/authStore.js", () => {
  const store = (sel) => (typeof sel === "function" ? sel({ user: h.user }) : { user: h.user });
  store.getState = () => ({ user: h.user });
  return { default: store };
});
vi.mock("../../../src/api/handoverApi.js", () => ({ default: { getMedia: vi.fn(), deleteMedia: vi.fn() } }));
vi.mock("../../../src/lib/toast", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }) }));

import handoverApi from "../../../src/api/handoverApi.js";
import MediaLibrary from "../../../src/pages/admin/MediaLibrary.jsx";

const R1 = { publicId: "aura/chair", url: "https://res.cloudinary.com/demo/chair.jpg", format: "jpg", width: 800, height: 600, bytes: 2048, createdAt: "2026-11-01T00:00:00.000Z", folder: "aura" };
const R2 = { publicId: "aura/sofa", url: "https://res.cloudinary.com/demo/sofa.jpg", format: "jpg", width: 1024, height: 768, bytes: 1048576, createdAt: "2026-11-02T00:00:00.000Z", folder: "aura" };

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
  handoverApi.deleteMedia.mockResolvedValue({ data: {} });
});

describe("MediaLibrary", () => {
  it("renders grid, Copy URL uses clipboard, delete is two-step", async () => {
    handoverApi.getMedia.mockResolvedValue({ data: { resources: [R1], nextCursor: null } });
    render(<MemoryRouter><MediaLibrary /></MemoryRouter>);
    expect(await screen.findByText("chair")).toBeTruthy();
    expect(screen.getByText(/800×600 · JPG · 2\.0 KB/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Copy URL" }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://res.cloudinary.com/demo/chair.jpg"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    await waitFor(() => expect(handoverApi.deleteMedia).toHaveBeenCalledWith("aura/chair"));
  });

  it("Load more appends with cursor", async () => {
    handoverApi.getMedia
      .mockResolvedValueOnce({ data: { resources: [R1], nextCursor: "c2" } })
      .mockResolvedValueOnce({ data: { resources: [R2], nextCursor: null } });
    render(<MemoryRouter><MediaLibrary /></MemoryRouter>);
    expect(await screen.findByText("chair")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByText("sofa")).toBeTruthy();
    expect(handoverApi.getMedia).toHaveBeenCalledWith(expect.objectContaining({ cursor: "c2" }));
    expect(screen.getByText("chair")).toBeTruthy();
  });

  it("503 error state shows the server message", async () => {
    handoverApi.getMedia.mockRejectedValue({ response: { status: 503, data: { message: "Media library is not configured" } } });
    render(<MemoryRouter><MediaLibrary /></MemoryRouter>);
    expect(await screen.findByText(/Media library is not configured/)).toBeTruthy();
  });
});
