# Generate PDFs from HTML or a template

Use when you need PDFs rendered server-side: invoices, reports, certificates — from raw HTML, or from an HTML template filled with entity data (template engine), including bulk batches. Requires `x-blocks-key` + Bearer token, and input files already uploaded to Storage (**blocks-os** skill) — PdfGenerator works entirely with file IDs, never inline HTML.

Endpoint reference: [endpoints.md#pdfgenerator](../endpoints.md#pdfgenerator).

**Generation is asynchronous.** All three Create endpoints return only `{ isSuccess, messageCoRelationId, message }` — never PDF bytes. You choose the `outputPdfFileId` up front and later fetch the finished file from Storage under that ID.

## Choose an engine

| `engine` | Name (per swagger docs) | HTML→PDF |
|---|---|---|
| 1 | PuppeteerSharp | **Default — best for modern CSS/JS** |
| 2 | PdfSharpCore | Returns null (not supported) |
| 3 | Aspose | Supported |
| 4 | WkHtmlToPdf | Deprecated |

Omit `engine` or send `1` unless you have a reason not to.

## Steps

1. Upload inputs to Storage (**blocks-os** skill): the body HTML file, plus optional header/footer HTML files and first-page variants. Keep every returned file ID.

2. Generate a new GUID for `outputPdfFileId` — the finished PDF will be stored under it. (Exact Storage semantics of pre-supplied output IDs are not documented in swagger — verify retrieval against your project.)

3. Pick the endpoint:

   **A. Raw HTML → PDF:** `POST /api/PdfGenerator/CreatePdfsFromHtml`
   - `createFromHtmlCommands[]`, one entry per PDF: `htmlFileId`, `outputPdfFileId`, `outputPdfFileName`, optional `directoryId` (target Storage directory).
   - Header/footer: set `hasHeader`/`hasFooter` with `headerHtmlFileId`/`footerHtmlFileId` and `headerHeight`/`footerHeight`; first-page variants via `hasFirstPageHeader`/`hasFirstPageFooter` + `firstPageHeaderFileId`/`firstPageFooterFileId`.
   - Page numbers: `isPageNumberEnabled`, `isTotalPageCountEnabled`, `pageNumberText`.
   - `openInBrowser: true` makes the eventual download URL render inline instead of downloading.
   - Top-level: `projectKey`, `messageCoRelationId` (supply your own GUID to correlate), optional `eventReferenceData` key/values echoed on completion events, `engine`.

   **B. Template + data → PDF:** `POST /api/PdfGenerator/CreatePdfsFromHtmlUsingTemplateEngine`
   - Same command shape plus: `templateFileId` (the HTML template in Storage), `filteredSqlQueryDatas[]` (`entityName`, `filterQuery`, `filterParameters` — pulls entity data into the template context), and `metaDataList[]` (`key`/`value` pairs available to the template).
   - Template placeholder syntax is not documented in swagger — check an existing project template or SELISE docs for the expected syntax.

   **C. Bulk:** `POST /api/PdfGenerator/CreatePdfsFromHtmlUsingTemplateEngineBulk`
   - Template-engine command shape plus per-command `fileNameExtension`, and top-level `raiseEventOnProcessEnding` / `notifyOnProcessEnding` booleans. Set `notifyOnProcessEnding: true` to get a completion notification you can pick up via Notifier (`GET /api/Notifier/GetNotifications`, [endpoints.md#notifier](../endpoints.md#notifier)).
   - Use one command per output PDF; each carries its own `outputPdfFileId`.

4. Read the response: `isSuccess` confirms the job was **accepted**, not finished. Keep `messageCoRelationId` for correlation; `message` is human-readable status. `errors` populated on rejection.

5. Wait for completion, then download the PDF from Storage (blocks-os) by `outputPdfFileId`. There is no polling endpoint in this service's swagger — for single requests poll Storage until the file exists; for bulk use `notifyOnProcessEnding` + Notifier.

## Verify

- Response has `isSuccess: true` and your `messageCoRelationId` echoed back.
- The file appears in Storage under `outputPdfFileId` (blocks-os) and downloads as a valid PDF.
- Bulk with `notifyOnProcessEnding: true`: `GET /api/Notifier/GetNotifications` shows a completion notification.
- If a downloaded PDF is corrupted, run it through `POST /api/PdfGenerator/FixPdfs` — see [merge-stamp-pdfs.md](merge-stamp-pdfs.md).
