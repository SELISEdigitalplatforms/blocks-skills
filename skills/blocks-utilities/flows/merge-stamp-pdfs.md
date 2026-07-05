# Merge, stamp, and fix PDFs

Use for post-processing existing PDFs: combining several into one, stamping signatures/watermarks/labels (image or text), or repairing corrupted files. Requires `x-blocks-key` + Bearer token; all source PDFs and stamp images must already exist in Storage (**blocks-os** skill) — everything is referenced by file ID.

Endpoint reference: [endpoints.md#pdfgenerator](../endpoints.md#pdfgenerator).

**Engine matters here and differs from HTML→PDF:** merge and stamp require `engine: 2` (PdfSharpCore, free) or `3` (Aspose). Engine `1` (PuppeteerSharp) returns null for merge and stamping; `4` returns null for stamping. Default to `2`.

## Merge PDFs

`POST /api/PdfGenerator/MergePdfs`

1. Build `pdfFilesToBeMerged[]`: `{ order, pdfFileId }` per source — `order` controls page sequence in the output.
2. Set `outputPdfFileId` (new GUID) + `outputPdfFileName`, `projectKey` (projectKey = your Blocks Key, the same value as `X_BLOCKS_KEY`), `engine: 2`, optional `messageCoRelationId`.
3. `handleCorruptedPdf: true` resaves corrupted sources before merging instead of failing; `openInBrowser: true` makes the download URL open inline.
4. Response: `{ isSuccess, outputPdfFileId, message }` — the merged file lands in Storage under `outputPdfFileId`.

## Stamp text and/or images

Three variants, same coordinate model — each stamp carries `coordinates[]` of `{ x, y, width, height, pageNumber }`, so one stamp can be applied to several pages/positions:

- `POST /api/PdfGenerator/StampImageToPdf` — image stamps only: `stamps[].imageFileId` (an image already in Storage) + `coordinates`.
- `POST /api/PdfGenerator/StampTextToPdf` — text stamps only: `stamps[].text`, `stamps[].fontName` + `coordinates`.
- `POST /api/PdfGenerator/StampIntoPdf` — mixed batch: each stamp has `type` (`0` = Image, `1` = Text, documented in the endpoint description) plus `imageFileId` or `text`/`fontName`.

Common fields: `pdfFileId` (source), `outputPdfFileId` (new GUID for the stamped copy), `outputPdfFileName`, `projectKey`, `engine: 2` (or `3`), optional `messageCoRelationId`, `eventReferenceData`, `openInBrowser`.

Response for all three: `{ isSuccess, outputPdfFileId, message }`.

Coordinate origin and units are not documented in swagger — stamp a test page and inspect placement before batch runs.

## Fix corrupted PDFs

`POST /api/PdfGenerator/FixPdfs`

- `pdfInfos[]`: `{ originalPdfId, outputPdfId }` pairs — repaired copies are written to the `outputPdfId`s (new GUIDs), originals untouched.
- Note this request uses `messageCorrelationId` (no "Co" capitalization split) — spelled differently from the other PdfGenerator endpoints; copy it verbatim from [endpoints.md](../endpoints.md#post-apipdfgeneratorfixpdfs).
- Response: `{ isSuccess, messageCorrelationId, message }`.

## Verify

- Response `isSuccess: true` and (merge/stamp) `outputPdfFileId` echoed back.
- Download the output file from Storage (blocks-os) by `outputPdfFileId`:
  - Merge: page count equals the sum of the sources, in `order` sequence.
  - Stamp: open the pages listed in `coordinates[].pageNumber` and confirm placement/size.
  - Fix: the repaired file opens cleanly in a PDF viewer.
- On `isSuccess: false`, read `message` and `errors`; for merges of dubious sources retry with `handleCorruptedPdf: true` or pre-run `FixPdfs`.
