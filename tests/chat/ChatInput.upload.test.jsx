import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Uploads, two generations of contract:
// FE-31 (original): files uploaded strictly one-by-one (60s timeout
// each) while the textarea was disabled — a 3-attachment send could
// lock the composer for ~3 minutes with no progress and no cancel.
// Pinned then: parallel uploads, per-file progress, editable
// composer, cancel aborts without sending.
// Round-2 redesign (Messenger pattern): uploads now start at
// SELECTION time in parallel; pressing send no longer waits for
// them — the message goes out instantly with local blob previews
// for the photos still in flight, and each finished upload syncs
// its real URL onto the message in the background
// (useSyncMessageAttachments). The tests below pin the new
// contract: parallel start at select, progress on the chips,
// instant send, background sync convergence, and cancel-at-select
// aborting the transfers with the draft intact.

const h = vi.hoisted(() => ({
  uploads: [],
  sendMutate: vi.fn(),
  syncMutate: vi.fn(),
}));

vi.mock("../../src/hooks/chat/useChatTan.js", () => ({
  useSyncMessageAttachments: () => ({ mutateAsync: h.syncMutate }),
  useSendMessage: () => ({ mutateAsync: h.sendMutate }),
}));
vi.mock("../../src/api/chatApi.js", () => ({
  uploadChatAttachment: vi.fn((chatId, file, opts = {}) => {
    const entry = { file, opts, resolve: null, reject: null, promise: null };
    entry.promise = new Promise((resolve, reject) => {
      entry.resolve = resolve;
      entry.reject = reject;
      if (opts.signal) {
        if (opts.signal.aborted)
          reject(
            Object.assign(new Error("canceled"), {
              name: "AbortError",
              code: "ERR_CANCELED",
            }),
          );
        opts.signal.addEventListener("abort", () =>
          reject(
            Object.assign(new Error("canceled"), {
              name: "AbortError",
              code: "ERR_CANCELED",
            }),
          ),
        );
      }
    });
    h.uploads.push(entry);
    return entry.promise;
  }),
}));
vi.mock("../../src/store/authStore.js", () => {
  const state = { openAuthModal: vi.fn(), user: null };
  const store = (selector) =>
    typeof selector === "function" ? selector(state) : state;
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
    [
      new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        ...new Array(92).fill(0x61),
      ]),
    ],
    name,
    { type: "image/png" },
  );

const uploadedValue = (i) => ({
  attachment: {
    fileUrl: `https://res.cloudinary.com/demo/${i}.png`,
    fileName: `${i}.png`,
    fileType: "image",
    fileSize: 100,
  },
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
});

async function selectFiles(container, names) {
  const input = container.querySelector('input[type="file"]');
  fireEvent.change(input, { target: { files: names.map(makeFile) } });
  // Uploads start once the selection-time content sniff resolves.
  await waitFor(() =>
    expect(uploadChatAttachment).toHaveBeenCalledTimes(names.length),
  );
}

function typeAndSend(container, text = "with files") {
  const textarea = screen.getByPlaceholderText(/type your message/i);
  fireEvent.change(textarea, { target: { value: text } });
  const buttons = container.querySelectorAll("button");
  fireEvent.click(buttons[buttons.length - 1]); // send
}

beforeEach(() => {
  vi.clearAllMocks();
  h.uploads = [];
  h.sendMutate.mockResolvedValue({ data: { message: { _id: "m1" } } });
  h.syncMutate.mockResolvedValue({});
});

describe("ChatInput uploads (FE-31 + instant-send redesign)", () => {
  it("starts all uploads in parallel at selection time, before send is pressed", async () => {
    const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    await selectFiles(container, ["a.png", "b.png", "c.png"]);
    // All three upload calls have STARTED before any of them resolves
    // and before any send happened.
    expect(h.sendMutate).not.toHaveBeenCalled();
    await act(async () => {
      h.uploads.forEach((u, i) => u.resolve(uploadedValue(i)));
    });
  });

  it("send is instant: the message leaves with local previews while uploads are in flight, then syncs the real URLs", async () => {
    const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    await selectFiles(container, ["a.png", "b.png"]);
    typeAndSend(container);
    // The send did NOT wait for the uploads.
    await waitFor(() => expect(h.sendMutate).toHaveBeenCalledTimes(1));
    const sent = h.sendMutate.mock.calls[0][0];
    expect(sent.attachments).toHaveLength(0);
    expect(sent.localAttachments).toHaveLength(2);
    expect(sent.localAttachments[0].fileUrl).toMatch(/^blob:/);
    // Uploads land -> background sync PATCHes the message with the
    // real attachment list.
    await act(async () => {
      h.uploads.forEach((u, i) => u.resolve(uploadedValue(i)));
    });
    await waitFor(() => expect(h.syncMutate).toHaveBeenCalled());
    const lastSync = h.syncMutate.mock.calls.at(-1)[0];
    expect(lastSync.messageId).toBe("m1");
    expect(lastSync.attachments).toHaveLength(2);
    expect(lastSync.attachments[0].fileUrl).toMatch(/^https:/);
  });

  it("when uploads already finished during selection, they ride in the send payload (no locals, no sync)", async () => {
    const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    await selectFiles(container, ["a.png"]);
    await act(async () => {
      h.uploads[0].resolve(uploadedValue(0));
    });
    typeAndSend(container);
    await waitFor(() => expect(h.sendMutate).toHaveBeenCalledTimes(1));
    const sent = h.sendMutate.mock.calls[0][0];
    expect(sent.attachments).toHaveLength(1);
    expect(sent.localAttachments).toHaveLength(0);
    expect(h.syncMutate).not.toHaveBeenCalled();
  });

  it("keeps the composer editable while uploads are in flight (pen-test: lock)", async () => {
    const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    await selectFiles(container, ["a.png"]);
    const textarea = screen.getByPlaceholderText(/type your message/i);
    expect(textarea.disabled).toBe(false);
    fireEvent.change(textarea, { target: { value: "edited while uploading" } });
    expect(textarea.value).toBe("edited while uploading");
    await act(async () => {
      h.uploads[0].resolve(uploadedValue(0));
    });
  });

  it("chips preview the photo: a thumbnail image sits in front of the file name", async () => {
    const createSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockImplementation(() => "blob:chip-preview");
    try {
      const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
      await selectFiles(container, ["a.png"]);
      const chip = (await screen.findByText("a.png")).closest("div");
      const thumb = chip.querySelector("img");
      expect(thumb).not.toBeNull();
      expect(thumb.getAttribute("src")).toBe("blob:chip-preview");
      expect(thumb.className).toMatch(/rounded/);
      await act(async () => {
        h.uploads.forEach((u, i) => u.resolve(uploadedValue(i)));
      });
    } finally {
      createSpy.mockRestore();
    }
  });

  it("shows per-file progress as a ring over the thumbnail, not as text", async () => {
    const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    await selectFiles(container, ["a.png", "b.png"]);
    await act(async () => {
      h.uploads[0].opts.onProgress?.(40);
      h.uploads[1].opts.onProgress?.(80);
    });
    // The progress lives on the thumbnail overlay (its accessible
    // name carries the percentage); no bare "40%" text is rendered.
    const at40 = await screen.findByRole("button", {
      name: /cancel upload, 40% uploaded/i,
    });
    const at80 = screen.getByRole("button", {
      name: /cancel upload, 80% uploaded/i,
    });
    expect(screen.queryByText(/40%/)).not.toBeInTheDocument();
    // The ring arc grows with progress: 80% leaves a smaller
    // remaining dash offset than 40%.
    const offset = (btn) =>
      parseFloat(
        btn.querySelectorAll("circle")[1].getAttribute("stroke-dashoffset"),
      );
    expect(offset(at80)).toBeLessThan(offset(at40));
    await act(async () => {
      h.uploads.forEach((u, i) => u.resolve(uploadedValue(i)));
    });
    // Once an upload completes, the ring is replaced by a remove
    // (✕) button on the thumbnail.
    expect(
      await screen.findByRole("button", { name: /remove a\.png/i }),
    ).toBeInTheDocument();
  });

  it("cancel aborts in-flight uploads: nothing is sent and the draft survives", async () => {
    const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    await selectFiles(container, ["a.png", "b.png"]);
    const textarea = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(textarea, { target: { value: "with files" } });
    // Each uploading chip carries its own cancel control on the
    // thumbnail — there is no global "Cancel upload" button.
    const cancelButtons = await screen.findAllByRole("button", {
      name: /cancel upload/i,
    });
    expect(cancelButtons).toHaveLength(2);
    for (const btn of cancelButtons) fireEvent.click(btn);
    // Both transfers were aborted via their signals; the files stay
    // selected (they would upload at send time instead).
    expect(h.uploads.every((u) => u.opts.signal.aborted)).toBe(true);
    expect(h.sendMutate).not.toHaveBeenCalled();
    expect(textarea.value).toBe("with files");
    expect(screen.getByText("a.png")).toBeInTheDocument();
  });
});
