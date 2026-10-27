import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// FE-11 — ChatInput's send path validated only the declared
// file.type string, so a spoofed file was handed to the upload.
// Fix pinned here: handleSend runs the sniffing validator over the
// selected files before any upload — a spoofed file is rejected with
// the policy toast, the upload function is never called, and nothing
// is sent. (Selection still uses the synchronous declared-type check
// for instant feedback; the sniff gate is at send/upload time, before
// any network call.)

const h = vi.hoisted(() => ({ uploads: 0, sendMutate: vi.fn() }));
const toastMock = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }));

vi.mock("../../src/hooks/chat/useChatTan.js", () => ({
  useSendMessage: () => ({ mutateAsync: h.sendMutate }),
}));
vi.mock("../../src/api/chatApi.js", () => ({
  uploadChatAttachment: vi.fn(async () => {
    h.uploads += 1;
    return { attachment: { fileUrl: "https://example.com/x.png", fileName: "x.png" } };
  }),
}));
vi.mock("../../src/lib/toast.js", () => ({ toast: toastMock }));
vi.mock("../../src/store/authStore.js", () => {
  const state = { openAuthModal: vi.fn(), user: null };
  const store = (selector) => (typeof selector === "function" ? selector(state) : state);
  store.getState = () => state;
  return { default: store };
});

import ChatInput from "../../src/components/chat/ChatInput.jsx";
import { uploadChatAttachment } from "../../src/api/chatApi.js";

const bytes = (header, total = 128) => {
  const out = new Uint8Array(total);
  out.set(header, 0);
  for (let i = header.length; i < total; i += 1) out[i] = 0x61;
  return out;
};
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MZ = [0x4d, 0x5a];

async function selectTypeAndSend(container, file) {
  const input = container.querySelector('input[type="file"]');
  fireEvent.change(input, { target: { files: [file] } });
  const textarea = screen.getByPlaceholderText(/type your message/i);
  fireEvent.change(textarea, { target: { value: "see attached" } });
  const buttons = container.querySelectorAll("button");
  fireEvent.click(buttons[buttons.length - 1]); // send
}

beforeEach(() => {
  vi.clearAllMocks();
  h.uploads = 0;
  h.sendMutate.mockResolvedValue({});
});

describe("FE-11: ChatInput send path sniffs attachment content", () => {
  it("pen-test: an MZ executable declared as image/png is rejected at send — no upload, no send, policy toast", async () => {
    const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    const evil = new File([bytes(MZ)], "evil.png", { type: "image/png" });
    await selectTypeAndSend(container, evil);
    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith(
        expect.stringMatching(/JPEG, PNG, WebP, GIF or PDF/)
      )
    );
    expect(uploadChatAttachment).not.toHaveBeenCalled();
    expect(h.sendMutate).not.toHaveBeenCalled();
  });

  it("a genuine PNG still sends (sniff gate does not break the happy path)", async () => {
    const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    const good = new File([bytes(PNG)], "photo.png", { type: "image/png" });
    await selectTypeAndSend(container, good);
    await waitFor(() => expect(h.sendMutate).toHaveBeenCalledTimes(1));
    expect(uploadChatAttachment).toHaveBeenCalledTimes(1);
  });
});
