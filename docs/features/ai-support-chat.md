# AI Support Chat

## What customers see

A chat launcher (bottom-right on the storefront; on mobile it sits above the
bottom navigation) opens the Aura Assistant. Customers can chat as guests or
signed in, attach images, and see read state and typing indicators in real
time. If chat is disabled in Settings → Chat, the launcher is replaced by a
static offline card with the store's offline message and business hours.

## How a message is answered

```
Customer message ──► Socket.IO / REST ──► chat service (chatV2)
   1. Knowledge lookup: the question is embedded and matched against the
      store's knowledge base in Qdrant (product/help documents).
   2. AI reply: providers are tried in order — Groq → Mistral → OpenRouter —
      with the retrieved context; the first healthy provider answers.
   3. Human handoff: if the AI can't help (or the customer asks), the
      conversation is queued for the support team and an agent continues
      the same thread from Admin → Support. The customer gets the
      "you're in the queue" notice in-thread.
```

Configuration (models, timeouts, RAG parameters) lives in
`services/chatV2/config/chatConfig.js`; provider keys come from env
(`GROQ_API_KEY`, `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, plus
`GEMINI_API_KEY` / `NVIDIA_API_KEY` used for embeddings/fallback) or from
the Integrations vault. Embeddings use `EMBEDDING_API_URL` /
`EMBEDDING_MODEL_NAME` / `EMBEDDING_VECTOR_SIZE`; vectors live in Qdrant
(`QDRANT_URL`, `QDRANT_API_KEY`).

## Knowledge base

Admin → Knowledge manages the documents the AI answers from (the `document`
collection): upload files (PDFs are parsed), toggle visibility, and reindex
(`POST /api/v1/admin/knowledge/reindex`). Ingestion runs as background jobs:
documents are chunked, embedded and upserted into Qdrant
(`services/ingestionJobs.service.js`); job progress is visible via
`/api/v1/jobs/:id`.

## Data & real-time plumbing

- `chat` (conversation), `chatMessage`, `chatUpload` (attachments, via
  Cloudinary) collections.
- REST: `/api/v1/chats` for conversation/message operations (e.g.
  `PATCH /:id/read`); live delivery over Socket.IO with the Mongo adapter.
- The admin inbox (`src/components/admin/chat/`) shows the queue, customer
  context and an AI-assist panel for agents.
- Retention: chat messages are subject to the retention sweeps configured
  in env (`RETENTION_CHAT_MESSAGE_DAYS` etc.).

## Quality tooling

The server ships a chat benchmark/gate (`npm run chat:benchmark`,
`npm run chat:gate`, suites in `tests/chatV2/`) used to check answer quality
before changing models or prompts. Change one variable at a time — provider
order, model, or knowledge content — and re-run the gate.
