# Sequence numbers for document numbering

Use when documents need unique, incrementing numbers — invoice numbers, order numbers, ticket references. A sequence is a named server-side counter identified by a free-form `context` string; separate contexts (e.g. `"invoice"`, `"order"`) count independently. Requires `x-blocks-key` + Bearer token.

Endpoint reference: [endpoints.md#sequence](../endpoints.md#sequence).

**Critical gotcha: `Next`/`NextHex` are GETs that mutate.** Every call consumes a number. Do not put them behind caches, prefetching, automatic retries, or React Query `useQuery` refetching — fetch exactly once per document, at the moment you commit the document. Numbers consumed by abandoned drafts leave gaps; if your domain forbids gaps (some invoice regimes), draw the number inside the same operation that persists the record.

## Steps

1. Pick a `context` string per counter (e.g. `invoice`, `order-2026`). No registration endpoint exists — the context is established by first use (verify initial value behavior against your project; the swagger does not document what the first call returns).

2. Draw a number when you create the document:
   - `GET /Sequence/Next?Context=invoice&ProjectKey=$X_BLOCKS_KEY` → `{ isSuccess, context, currentNumber }` with `currentNumber` as a number. (`ProjectKey` = your Blocks Key, the same value as `X_BLOCKS_KEY`.)
   - `GET /Sequence/NextHex?Context=invoice&ProjectKey=$X_BLOCKS_KEY` → same envelope but `currentNumber` is a **hexadecimal string** (swagger: "63 billion unique sequence of numbers in hexadecimal format") — use when you want short alphanumeric references.

3. Format the display number yourself: the service returns only the raw counter — prefixes/padding (`INV-2026-000123`) are your application's job. Store both the raw number and the formatted string with the document.

4. *(admin, rare)* `POST /Sequence/Reset` with `{ context, value, projectKey }` — restarts the context so it continues from `value` (e.g. yearly rollover with a fresh context or a reset). `context` is the only required field. Response is the bare `{ isSuccess, errors }` envelope. Resetting to a value below already-issued numbers will cause duplicates — guard this behind an admin-only action.

Branches:
- 401 → refresh the token via blocks-setup and retry the *whole* draw (never blind-retry a `Next` you are not sure failed — if the first call actually succeeded, a retry consumes a second number).
- `isSuccess: false` → read `errors`; do not persist the document with an unconfirmed number.

## Verify

- Call `GET /Sequence/Next?Context=<ctx>&ProjectKey=$X_BLOCKS_KEY` twice in a test context: the second `currentNumber` must be exactly the first + 1.
- After `Reset` with `value: N`, the next draw should continue from `N` (verify whether it returns `N` or `N+1` against the live API — swagger doesn't say).
- Distinct contexts don't interfere: drawing from `invoice-test-a` must not advance `invoice-test-b`.
