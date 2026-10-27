// FE-35: merge semantics, made explicit.
//
// Pages arrive in react-query infinite-query order: pages[0] is the
// first (newest-messages) page and later entries are progressively
// older pages. On a key collision the copy from the NEWEST page must
// win — a stale copy from an older page must never resurrect pre-edit
// content. Iterating the pages in reverse and letting later Map.set
// calls win achieves exactly that (the newest page is written last);
// within a single page a later entry likewise wins over an earlier
// duplicate, matching the previous behaviour.
//
// Keys: a message with an _id keys by that id. An id-less message
// (optimistic/local) keys by its clientMessageId when present — the
// send path always sets one — so repeated copies of the same local
// message still de-duplicate. An id-less message with no
// clientMessageId keys by a synthetic per-merge counter key, which
// by construction cannot collapse two distinct messages into one
// (the old String(message._id) key collapsed ALL of them into the
// single key 'undefined').
//
// Keys are only ever Map keys, never object keys, so an _id of
// '__proto__' cannot pollute Object.prototype.
//
// Sort: a missing/invalid createdAt parses to NaN; guard it to 0 so
// ordering is deterministic instead of implementation-defined.
const messageTime = (message) => {
  const time = new Date(message.createdAt).getTime();
  return Number.isFinite(time) ? time : 0;
};

export function chronologicalMessages(pages = []) {
  const byId = new Map();
  let syntheticSeq = 0;
  for (const page of [...pages].reverse()) {
    for (const message of page.data?.messages || []) {
      const key =
        message._id !== null && message._id !== undefined && message._id !== ""
          ? `id:${String(message._id)}`
          : message.clientMessageId
            ? `client:${String(message.clientMessageId)}`
            : `local:${syntheticSeq++}`;
      byId.set(key, message);
    }
  }
  return [...byId.values()].sort((a, b) => messageTime(a) - messageTime(b));
}
