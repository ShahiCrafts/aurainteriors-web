import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// FE-31 (uploads): files uploaded strictly one-by-one (60s timeout
// each) while the textarea was disabled — a 3-attachment send could
// lock the composer for ~3 minutes with no progress and no cancel.
// Pin: uploads start in parallel, per-file progress is shown, the
// composer stays editable, and a cancel aborts the in-flight uploads
// without sending or clearing the draft.

const h = vi.hoisted(() => ({ uploads: [], sendMutate: vi.fn() }));

vi.mock("../../src/hooks/chat/useChatTan.js", () => ({
  useSendMessage: () => ({ mutateAsync: h.sendMutate }),
}));
vi.mock("../../src/api/chatApi.js", () => ({
  uploadChatAttachment: vi.fn((chatId, file, opts = {}) => {
    const entry = { file, opts, resolve: null, reject: null, promise: null };
    entry.promise = new Promise((resolve, reject) => {
      entry.resolve = resolve;
      entry.reject = reject;
      if (opts.signal) {
        if (opts.signal.aborted) reject(Object.assign(new Error("canceled"), { name: "AbortError", code: "ERR_CANCELED" }));
        opts.signal.addEventListener("abort", () =>
          reject(Object.assign(new Error("canceled"), { name: "AbortError", code: "ERR_CANCELED" })));
      }
    });
    h.uploads.push(entry);
    return entry.promise;
  }),
}));
vi.mock("../../src/store/authStore.js", () => {
  const state = { openAuthModal: vi.fn(), user: null };
  const store = (selector) => (typeof selector === "function" ? selector(state) : state);
  store.getState = () => state;
  return { default: store };
});

import ChatInput from "../../src/components/chat/ChatInput.jsx";
import { uploadChatAttachment } from "../../src/api/chatApi.js";

// FE-11: the send path now sniffs content, so fixtures carry a real
// PNG signature (the previous "xxx…" bytes are precisely the kind of
// declared-type/content mismatch FE-11 rejects).
const makeFile = (name) =>
  new File(
    [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(92).fill(0x61)])],
    name,
    { type: "image/png" }
  );

async function selectAndSend(container, names) {
  const input = container.querySelector('input[type="file"]');
  fireEvent.change(input, { target: { files: names.map(makeFile) } });
  const textarea = screen.getByPlaceholderText(/type your message/i);
  fireEvent.change(textarea, { target: { value: "with files" } });
  const buttons = container.querySelectorAll("button");
  fireEvent.click(buttons[buttons.length - 1]); // send
}

beforeEach(() => {
  vi.clearAllMocks();
  h.uploads = [];
  h.sendMutate.mockResolvedValue({});
});

describe("ChatInput parallel uploads (FE-31)", () => {
  it("starts all uploads in parallel instead of one-by-one (pen-test: sequential lock)", async () => {
    const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    await selectAndSend(container, ["a.png", "b.png", "c.png"]);
    // All three upload calls have STARTED before any of them resolves.
    // FE-11: handleSend first awaits the content sniff, so the calls
    // land a tick after the click rather than synchronously.
    await waitFor(() => expect(uploadChatAttachment).toHaveBeenCalledTimes(3));
    await act(async () => {
      h.uploads.forEach((u, i) => u.resolve({ attachment: { fileUrl: `https://res.cloudinary.com/demo/${i}.png`, fileName: `${i}.png` } }));
    });
    await waitFor(() => expect(h.sendMutate).toHaveBeenCalledTimes(1));
    const sent = h.sendMutate.mock.calls[0][0];
    expect(sent.attachments).toHaveLength(3);
  });

  it("keeps the composer editable while uploads are in flight (pen-test: lock)", async () => {
    const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    await selectAndSend(container, ["a.png"]);
    await waitFor(() => expect(uploadChatAttachment).toHaveBeenCalledTimes(1));
    const textarea = screen.getByPlaceholderText(/type your message/i);
    expect(textarea.disabled).toBe(false);
    fireEvent.change(textarea, { target: { value: "edited while uploading" } });
    expect(textarea.value).toBe("edited while uploading");
    await act(async () => { h.uploads[0].resolve({ attachment: { fileUrl: "https://res.cloudinary.com/demo/a.png", fileName: "a.png" } }); });
  });

  it("shows per-file progress reported by the upload", async () => {
    const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    await selectAndSend(container, ["a.png", "b.png"]);
    await waitFor(() => expect(h.uploads).toHaveLength(2));
    await act(async () => {
      h.uploads[0].opts.onProgress?.(40);
      h.uploads[1].opts.onProgress?.(80);
    });
    expect(await screen.findByText(/40%/)).toBeInTheDocument();
    expect(await screen.findByText(/80%/)).toBeInTheDocument();
    await act(async () => {
      h.uploads.forEach((u, i) => u.resolve({ attachment: { fileUrl: `https://res.cloudinary.com/demo/${i}.png`, fileName: `${i}.png` } }));
    });
  });

  it("cancel aborts in-flight uploads: nothing is sent and the draft survives", async () => {
    const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    await selectAndSend(container, ["a.png", "b.png"]);
    await waitFor(() => expect(uploadChatAttachment).toHaveBeenCalledTimes(2));
    fireEvent.click(await screen.findByRole("button", { name: /cancel/i }));
    await waitFor(() => expect(h.sendMutate).not.toHaveBeenCalled());
    const textarea = screen.getByPlaceholderText(/type your message/i);
    expect(textarea.value).toBe("with files");
    expect(screen.getByText("a.png")).toBeInTheDocument();
  });
});
