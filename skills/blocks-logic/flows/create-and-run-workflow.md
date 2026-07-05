# Create a workflow, publish it, run it, inspect executions

Use when building a new automation on Blocks Logic end to end: create the workflow record,
give it a node/edge graph, publish, trigger a run, then read the execution history.

Preconditions: `x-blocks-key` + Bearer token (see `blocks-setup`); `projectKey` = your
Blocks Key (the same value as `$X_BLOCKS_KEY`). Important: there is **no generic
`/Workflow/Execute` endpoint in v4** —
runs start from a trigger node (webhook) or node-by-node via `StepExecute`.

## Steps

1. `POST /Workflow/Create` — create the workflow shell.
   Body requires `projectKey` and `name`; optional `description`, `nodes`, `edges`,
   `settings`, `nodeOutputSchemas` ([endpoints.md#workflow](../endpoints.md#workflow)).
   On Create, `nodes` is untyped (`unknown`) in swagger — the strict node shape is only
   documented on `Update`. Response shape not documented in swagger — inspect the live
   response; if it does not return the new id, get it in step 2.

2. `POST /Workflow/GetAll` — find the workflow and capture its id.
   Body: `{ projectKey, search: "<name>", pageSize, pageNumber }`. Response shape not
   documented in swagger — inspect the live response and keep the workflow's item id
   (referred to as `itemId` on Update, `workflowId` / `Id` elsewhere).

3. `PUT /Workflow/Update` — set the graph.
   Body: `projectKey`, `itemId` (required), plus `nodes[]`
   (`id`, `name`, `category`, `type`, `version`, `position {x, y}`, `parameters`,
   `settings`), `edges[]` (`id`, `source`, `target`, `sourceHandle`, `targetHandle`),
   `settings`, `isPublished`, `nodeOutputSchemas`.
   The catalog of valid node `category`/`type`/`version` values and per-node `parameters`
   is not published in the swagger. Practical approach: build one workflow of each kind in
   the OS portal designer, read it back with
   `GET /Workflow/Get?WorkflowId=...&ProjectKey=...`, and reuse those node shapes.
   Include a webhook-trigger node if you want to run the workflow over HTTP.

4. Publish so it can run — `POST /Workflow/PublishNewVersion`.
   Body: `{ projectKey, workflowId, name, description? }` — snapshots the current draft as
   a new version and publishes it in one call. (Alternative: `CreateVersion` +
   `PublishVersion` — see [version-publish-restore.md](version-publish-restore.md).)

5. Trigger a run — `POST /Workflow/Webhook/{projectKey}/{workflowId}/{webhookId}`.
   `webhookId` comes from the webhook trigger node in your graph (its node configuration /
   id as shown in the designer) — it is not returned by any documented endpoint, so read
   it from the workflow definition (`GET /Workflow/Get`). Send the trigger payload as
   the request body. Response shape not documented in swagger — inspect the live response.
   For dry runs while the workflow is in development, use
   `POST /Workflow/webhook-test/{projectKey}/{workflowId}/{webhookId}` (note the
   lowercase route — casing is exact).

6. Debug a single node — `POST /Workflow/StepExecute`.
   Body: `{ projectKey, workflowId, nodeId, sourceExecutionId? }`. Pass
   `sourceExecutionId` from a previous run to reuse upstream node outputs instead of
   re-running the whole chain. Response shape not documented in swagger.

7. Inspect runs — `GET /Workflow/GetExecutions?ProjectKey=$X_BLOCKS_KEY&WorkflowId=<id>`,
   then drill in with `GET /Workflow/GetExecution?ProjectKey=$X_BLOCKS_KEY&ExecutionId=<id>`.
   Both response shapes are not documented in swagger — expect a run list with ids/status
   and per-node results on the single execution, but verify against the live response.

Error paths:
- `401` → refresh the token (`blocks-setup`) and retry.
- Webhook returns an error / no execution appears → confirm the workflow is published
  (`POST /Workflow/GetAll` with `isPublished: true` should include it) and that
  `{projectKey}/{workflowId}/{webhookId}` exactly match the definition.
- Wrong graph saved → fix with another `PUT /Workflow/Update`, or roll back via
  `POST /Workflow/Restore` (see [version-publish-restore.md](version-publish-restore.md)).
- Dead end? `DELETE /Workflow/Delete?Id=<id>&ProjectKey=$X_BLOCKS_KEY` removes the workflow;
  `POST /Workflow/Duplicate` (`{ projectKey, name, workflowId }`) forks it instead.

## Verify

- `POST /Workflow/GetAll` with `isPublished: true` lists the workflow.
- After the webhook call, `GET /Workflow/GetExecutions?ProjectKey=...&WorkflowId=...`
  shows a new execution; `GET /Workflow/GetExecution` for that id shows the run's
  outcome (shape undocumented — check `isSuccess`-style flags in the live payload).
