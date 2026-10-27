// FE-42 — document delete must honour the server's honest-status shape.
//
// Server contract (verified read-only in ~/workspace/aura-audit/work,
// controllers/document.controller.js:146-156): with
// DOCUMENT_DELETE_HONEST_STATUS=on and any cleanup failure → HTTP 200
//   { status:'partial',
//     message:'Document deleted from the database, but cleanup failed for: …',
//     data:{ outcomes:{ qdrant:'ok'|'failed',
//                        cloudinary:'ok'|'failed'|'skipped',
//                        database:'ok' } } }
// At default → { status:'success', message }. The DB record is ALWAYS
// deleted (step 3 is unconditional) and there is NO cleanup-retry endpoint;
// the server's message says support is notified via the error log.
//
// Pre-fix behaviour: KnowledgeBase.handleDelete discarded the resolved
// value and unconditionally showed "Document and vectors deleted
// successfully" — these partial-shape tests fail on that code.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

vi.mock("../../../src/api/documentApi.js", () => ({
  listDocuments: vi.fn(),
  uploadDocument: vi.fn(),
  deleteDocument: vi.fn(),
  retryDocument: vi.fn(),
}));

import {
  listDocuments,
  deleteDocument,
} from "../../../src/api/documentApi.js";
import KnowledgeBase from "../../../src/pages/admin/KnowledgeBase.jsx";

const DOC = {
  _id: "doc-1",
  fileName: "returns-policy.pdf",
  fileUrl: "https://example.invalid/returns-policy.pdf",
  fileType: "pdf",
  status: "indexed",
  createdAt: "2026-10-01T00:00:00.000Z",
};

const PARTIAL_BODY = {
  status: "partial",
  message:
    "Document deleted from the database, but cleanup failed for: qdrant. Support has been notified via the error log.",
  data: { outcomes: { qdrant: "failed", cloudinary: "skipped", database: "ok" } },
};

const SUCCESS_BODY = {
  status: "success",
  message: "Document deleted successfully from both database and vector store",
};

async function renderPage() {
  listDocuments.mockResolvedValue({
    data: { documents: [DOC], pagination: { totalPages: 1 } },
  });
  render(<KnowledgeBase />);
  await screen.findByText("returns-policy.pdf");
}

async function clickDelete() {
  fireEvent.click(screen.getByTitle("Delete Document"));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("KnowledgeBase document delete (FE-42)", () => {
  it("(1) default success shape → existing full-success message", async () => {
    deleteDocument.mockResolvedValue(SUCCESS_BODY);
    await renderPage();
    await clickDelete();
    expect(
      await screen.findByText("Document and vectors deleted successfully")
    ).toBeInTheDocument();
    // The list still refetches (the row is gone).
    expect(listDocuments.mock.calls.length).toBeGreaterThan(1);
  });

  it("(2) partial shape → warning names the failed system, no full-success claim, 'skipped' is not a failure", async () => {
    deleteDocument.mockResolvedValue(PARTIAL_BODY);
    await renderPage();
    await clickDelete();

    const warning = await screen.findByTestId("partial-delete-warning");
    // The server's own message is shown.
    expect(warning.textContent).toContain("cleanup failed for: qdrant");
    // qdrant is named by its human label.
    expect(warning.textContent).toMatch(/vector index/i);
    // cloudinary was 'skipped', database 'ok' — neither may be reported
    // as a failed cleanup.
    expect(warning.textContent).not.toMatch(/file storage/i);
    expect(warning.textContent).not.toMatch(/database cleanup failed/i);
    // The unconditional success message must NOT appear.
    expect(
      screen.queryByText("Document and vectors deleted successfully")
    ).not.toBeInTheDocument();
    // The list still refetches — the DB row really is gone.
    expect(listDocuments.mock.calls.length).toBeGreaterThan(1);
  });

  it("(3) partial → Retry cleanup → success shape upgrades to full success", async () => {
    deleteDocument
      .mockResolvedValueOnce(PARTIAL_BODY)
      .mockResolvedValueOnce(SUCCESS_BODY);
    await renderPage();
    await clickDelete();

    const warning = await screen.findByTestId("partial-delete-warning");
    fireEvent.click(within(warning).getByRole("button", { name: /retry cleanup/i }));

    expect(
      await screen.findByText("Document and vectors deleted successfully")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("partial-delete-warning")).not.toBeInTheDocument();
    expect(deleteDocument).toHaveBeenCalledTimes(2);
    expect(deleteDocument).toHaveBeenLastCalledWith("doc-1");
  });

  it("(4) partial → Retry cleanup → 404 explains the record is deleted and cleanup is logged for support", async () => {
    const notFound = new Error("Request failed with status code 404");
    notFound.response = { status: 404, data: { message: "Document not found" } };
    notFound.displayMessage = "Document not found";
    deleteDocument
      .mockResolvedValueOnce(PARTIAL_BODY)
      .mockRejectedValueOnce(notFound);
    await renderPage();
    await clickDelete();

    const warning = await screen.findByTestId("partial-delete-warning");
    fireEvent.click(within(warning).getByRole("button", { name: /retry cleanup/i }));

    await waitFor(() => {
      expect(screen.getByTestId("partial-delete-warning").textContent).toMatch(
        /already deleted/i
      );
    });
    const updated = screen.getByTestId("partial-delete-warning");
    expect(updated.textContent).toMatch(/support/i);
    expect(updated.textContent).toMatch(/vector index/i);
    // No success claim, and no further retry is offered for a gone record.
    expect(
      screen.queryByText("Document and vectors deleted successfully")
    ).not.toBeInTheDocument();
    expect(
      within(updated).queryByRole("button", { name: /retry cleanup/i })
    ).not.toBeInTheDocument();
  });

  it("partial → retry → partial again refreshes the failed-system list honestly", async () => {
    const partial2 = {
      status: "partial",
      message:
        "Document deleted from the database, but cleanup failed for: cloudinary. Support has been notified via the error log.",
      data: { outcomes: { qdrant: "ok", cloudinary: "failed", database: "ok" } },
    };
    deleteDocument
      .mockResolvedValueOnce(PARTIAL_BODY)
      .mockResolvedValueOnce(partial2);
    await renderPage();
    await clickDelete();

    const warning = await screen.findByTestId("partial-delete-warning");
    expect(warning.textContent).toMatch(/vector index/i);
    fireEvent.click(within(warning).getByRole("button", { name: /retry cleanup/i }));

    await waitFor(() => {
      expect(screen.getByTestId("partial-delete-warning").textContent).toMatch(
        /file storage/i
      );
    });
    expect(
      screen.queryByText("Document and vectors deleted successfully")
    ).not.toBeInTheDocument();
  });

  it("warning stays visible until dismissed", async () => {
    deleteDocument.mockResolvedValue(PARTIAL_BODY);
    await renderPage();
    await clickDelete();
    const warning = await screen.findByTestId("partial-delete-warning");
    fireEvent.click(within(warning).getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByTestId("partial-delete-warning")).not.toBeInTheDocument();
  });
});
