import { describe, expect, it } from "vitest";

// FE-35 — chat message merge defects in src/utils/chatMessages.js:
//  (1) Map key String(message._id) collapses every id-less message into
//      one 'undefined' entry — all but one id-less message are lost.
//  (2) On an _id collision the surviving copy must be the one from the
//      NEWEST page. Pages arrive in react-query order: pages[0] is the
//      first (newest-messages) page, later entries are older pages.
//  (3) A missing/invalid createdAt produces NaN sort keys and arbitrary
//      order; it must sort deterministically as 0.
// Pen-test: a message whose _id is the literal string '__proto__' must
// merge without polluting Object.prototype (the audit cleared this
// file for pollution — keep it that way).

import { chronologicalMessages } from "../../src/utils/chatMessages.js";

const page = (...messages) => ({ data: { messages } });
const t = (h) => `2026-01-01T${String(h).padStart(2, "0")}:00:00.000Z`;

describe("chronologicalMessages — FE-35", () => {
  it("keeps every message exactly once: edited copy from the newest page wins, distinct id-less locals survive", () => {
    const pages = [
      // pages[0] — newest page: carries the EDITED copy of m1 and two
      // distinct id-less local messages (keyed by clientMessageId).
      page(
        { _id: "m1", createdAt: t(2), content: "edited text" },
        { clientMessageId: "c-1", createdAt: t(3), content: "local one" },
        { clientMessageId: "c-2", createdAt: t(4), content: "local two" },
      ),
      // pages[1] — older page: carries the STALE pre-edit copy of m1.
      page(
        { _id: "m1", createdAt: t(2), content: "stale original" },
        { _id: "m0", createdAt: t(1), content: "older" },
      ),
    ];

    const result = chronologicalMessages(pages);

    expect(result).toHaveLength(4);
    expect(result.find((m) => m._id === "m1").content).toBe("edited text");
    expect(result.map((m) => m.content)).toEqual([
      "older",
      "edited text",
      "local one",
      "local two",
    ]);
  });

  it("keeps id-less messages without a clientMessageId as distinct messages (synthetic key cannot collapse them)", () => {
    const pages = [
      page(
        { createdAt: t(1), content: "no id, no client id — A" },
        { createdAt: t(2), content: "no id, no client id — B" },
      ),
    ];

    const result = chronologicalMessages(pages);
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.content)).toEqual([
      "no id, no client id — A",
      "no id, no client id — B",
    ]);
  });

  it("de-duplicates an id-less message repeated across pages by clientMessageId, newest page wins", () => {
    const pages = [
      page({ clientMessageId: "c-9", createdAt: t(2), content: "fresh copy" }),
      page({ clientMessageId: "c-9", createdAt: t(2), content: "stale copy" }),
    ];

    const result = chronologicalMessages(pages);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("fresh copy");
  });

  it("sorts a missing/invalid createdAt deterministically as 0 (lands first, stable across runs)", () => {
    const pages = [
      page(
        { _id: "b", createdAt: t(2), content: "second" },
        { _id: "bad", createdAt: "not-a-date", content: "invalid date" },
        { _id: "a", createdAt: t(1), content: "first valid" },
        { _id: "missing", content: "no date at all" },
      ),
    ];

    const first = chronologicalMessages(pages);
    const second = chronologicalMessages(pages);

    // Both dateless messages sort as 0, ahead of every real timestamp,
    // and the ordering is identical on every run.
    expect(first.map((m) => m._id)).toEqual(second.map((m) => m._id));
    expect(
      first
        .slice(0, 2)
        .map((m) => m._id)
        .sort(),
    ).toEqual(["bad", "missing"]);
    expect(first.slice(2).map((m) => m._id)).toEqual(["a", "b"]);
  });

  it("pen-test: a message with _id '__proto__' merges without polluting Object.prototype", () => {
    const pages = [
      page(
        { _id: "__proto__", createdAt: t(1), content: "pollution attempt" },
        { _id: "normal", createdAt: t(2), content: "normal" },
      ),
    ];

    const result = chronologicalMessages(pages);

    expect(result).toHaveLength(2);
    expect(result.find((m) => m._id === "__proto__").content).toBe(
      "pollution attempt",
    );
    expect({}.polluted).toBeUndefined();
    expect(Object.prototype.polluted).toBeUndefined();
    expect({}.content).toBeUndefined();
  });
});
