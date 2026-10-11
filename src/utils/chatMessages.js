export function chronologicalMessages(pages = []) {
  const byId = new Map();
  for (const page of [...pages].reverse()) {
    for (const message of page.data?.messages || []) byId.set(String(message._id), message);
  }
  return [...byId.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
