import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../src/api/handoverApi.js", () => ({ default: { getAuditLogs: vi.fn() } }));
import handoverApi from "../../../src/api/handoverApi.js";
import AuditLog from "../../../src/pages/admin/AuditLog.jsx";

const LOG = {
  _id: "l1",
  actor: { _id: "u1", firstName: "Ada", lastName: "Admin", email: "ada@example.com", role: "admin" },
  action: "settings.update", targetType: "settings", targetId: "identity",
  before: { storeName: "Old" }, after: { storeName: "New", apiToken: "super-secret-value", note: "hi" },
  ip: "127.0.0.1", at: "2026-11-22T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  handoverApi.getAuditLogs.mockResolvedValue({ data: { logs: [LOG], pagination: { page: 1, limit: 20, total: 40, pages: 2 } } });
});

describe("AuditLog", () => {
  it("renders rows and never renders secret-ish keys", async () => {
    render(<MemoryRouter><AuditLog /></MemoryRouter>);
    expect(await screen.findByText("Ada Admin")).toBeTruthy();
    expect(screen.getAllByText("settings.update").length).toBeGreaterThan(0);
    expect(screen.getByText(/storeName: New/)).toBeTruthy();
    expect(screen.queryByText(/super-secret-value/)).toBeNull();
    expect(screen.queryByText(/apiToken/)).toBeNull();
  });

  it("changing filter refetches with action param", async () => {
    render(<MemoryRouter><AuditLog /></MemoryRouter>);
    await screen.findByText("Ada Admin");
    fireEvent.change(screen.getByLabelText("Filter by action"), { target: { value: "settings.update" } });
    await waitFor(() => expect(handoverApi.getAuditLogs).toHaveBeenCalledWith(expect.objectContaining({ action: "settings.update", page: 1 })));
  });

  it("Next page refetches page 2", async () => {
    render(<MemoryRouter><AuditLog /></MemoryRouter>);
    await screen.findByText("Ada Admin");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(handoverApi.getAuditLogs).toHaveBeenCalledWith(expect.objectContaining({ page: 2 })));
  });
});
