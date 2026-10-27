import { describe, expect, it } from "vitest";

// Characterization tests for src/utils/chatMessages.js.
// The module exports exactly one function, chronologicalMessages(pages):
// it flattens react-query style pages of messages, de-duplicates by _id
// and sorts ascending by createdAt. There is NO normalization or grouping
// in the current implementation — these tests pin what actually exists.

import { chronologicalMessages } from "../../src/utils/chatMessages.js";

const msg = (id, createdAt, content = `m-${id}`) => ({ _id: id, createdAt, content });
const page = (...messages) => ({ data: { messages } });

const t = (h) => `2026-01-01T${String(h).padStart(2, "0")}:00:00.000Z`;

describe("chronologicalMessages", () => {
  it("returns [] with no argument and for empty pages", () => {
    expect(chronologicalMessages()).toEqual([]);
    expect(chronologicalMessages([])).toEqual([]);
    expect(chronologicalMessages([page()])).toEqual([]);
  });

  it("flattens pages and sorts ascending by createdAt", () => {
    const pages = [
      page(msg("c", t(3)), msg("b", t(2))),
      page(msg("a", t(1))),
    ];

    expect(chronologicalMessages(pages).map((m) => m._id)).toEqual(["a", "b", "c"]);
  });

  it("sorts within a single page too", () => {
    const pages = [page(msg("b", t(2)), msg("a", t(1)))];
    expect(chronologicalMessages(pages).map((m) => m._id)).toEqual(["a", "b"]);
  });

  it("de-duplicates by _id, keeping the copy from the earlier page in the input array", () => {
    // Pages are consumed in reverse order and later writes win, so the
    // FIRST page of the input array supplies the surviving copy of a
    // duplicated message (e.g. the newest page's refreshed version).
    const freshCopy = { _id: "x", createdAt: t(1), content: "fresh" };
    const staleCopy = { _id: "x", createdAt: t(1), content: "stale" };
    const pages = [page(freshCopy), page(staleCopy, msg("y", t(2)))];

    const result = chronologicalMessages(pages);

    expect(result).toHaveLength(2);
    expect(result.find((m) => m._id === "x").content).toBe("fresh");
  });

  it("de-duplicates within one page, keeping the later entry", () => {
    const pages = [
      page(
        { _id: "x", createdAt: t(1), content: "first" },
        { _id: "x", createdAt: t(1), content: "second" },
      ),
    ];

    const result = chronologicalMessages(pages);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("second");
  });

  it("treats numeric and string ids as the same key (String(_id))", () => {
    const pages = [
      page({ _id: 7, createdAt: t(1), content: "numeric" }),
      page({ _id: "7", createdAt: t(1), content: "string" }),
    ];

    const result = chronologicalMessages(pages);
    expect(result).toHaveLength(1);
    // The earlier input page wins, per the reverse-iteration order.
    expect(result[0].content).toBe("numeric");
  });

  it("skips pages with missing data or messages", () => {
    const pages = [{}, { data: {} }, { data: { messages: null } }, page(msg("a", t(1)))];

    expect(chronologicalMessages(pages).map((m) => m._id)).toEqual(["a"]);
  });

  it("throws on a null page entry (page.data is dereferenced unguarded)", () => {
    expect(() => chronologicalMessages([null])).toThrow(TypeError);
  });

  it("does not mutate the input pages array order", () => {
    const p1 = page(msg("b", t(2)));
    const p2 = page(msg("a", t(1)));
    const pages = [p1, p2];

    chronologicalMessages(pages);

    expect(pages).toEqual([p1, p2]);
  });

  it("returns the original message objects (no normalization or copying)", () => {
    const original = msg("a", t(1));
    const [result] = chronologicalMessages([page(original)]);
    expect(result).toBe(original);
  });
});
