# Version, publish, restore, and unpublish a workflow

Use when managing a workflow's lifecycle: snapshotting known-good states, promoting a
version to the published (runnable) state, rolling the draft back, or taking a workflow
offline.

Preconditions: token + `x-blocks-key` (`blocks-setup`); an existing workflow
(`workflowId`) in your project — see
[create-and-run-workflow.md](create-and-run-workflow.md). All endpoints in this flow are
under [endpoints.md#workflow](../endpoints.md#workflow); none of them document a response
schema in swagger, so inspect live responses before relying on shapes.

## Steps

1. `POST /Workflow/GetVersions` — list existing versions.
   Body: `{ projectKey, workflowId }`. Keep each version's id for the steps below
   (response shape not documented in swagger — inspect the live response for the id
   field name).

2. `POST /Workflow/CreateVersion` — snapshot the current draft as a new version.
   Body: `{ projectKey, workflowId, name, description? }`. Do this before risky edits so
   you always have a restore point.

3. `POST /Workflow/UpdateVersion` — rename or re-describe a version.
   Body: `{ projectKey, versionId, name, description? }`. Note this takes `versionId`,
   not `workflowId`.

4. `POST /Workflow/GetWorkflowByVersion` — read the full definition at a version.
   Body: `{ projectKey, workflowId, versionId }`. Use it to diff a snapshot against the
   current draft (`GET /Workflow/Get?WorkflowId=...&ProjectKey=...`).

5. Publish, one of two ways:
   - `POST /Workflow/PublishVersion` — publish an **existing** version.
     Body: `{ projectKey, workflowId, versionId? }`. `versionId` is optional in the
     schema; which version is published when it's omitted is not documented — pass it
     explicitly.
   - `POST /Workflow/PublishNewVersion` — snapshot the current draft **and** publish
     it in one call. Body: `{ projectKey, workflowId, name, description? }`.

6. `POST /Workflow/Restore` — roll the draft back to a snapshot.
   Body: `{ projectKey, workflowId, versionId }`. Follow with `PublishVersion` /
   `PublishNewVersion` if the restored state should also be the live one.

7. `POST /Workflow/Unpublish` — take the workflow offline.
   Body: `{ projectKey, workflowId }`. Webhook triggers for an unpublished workflow are
   expected to stop starting runs — verify against your live project, as the behavior is
   not documented in swagger.

Error paths:
- `401` → refresh the token per `blocks-setup`.
- Publish appears to succeed but runs use the old graph → confirm which version is live
  by fetching `GetWorkflowByVersion` for the version you published and comparing with a
  fresh execution's behavior; re-publish with an explicit `versionId`.

## Verify

- `POST /Workflow/GetVersions` shows the new/renamed version.
- `POST /Workflow/GetAll` with `isPublished: true` includes the workflow after
  publishing and excludes it after `Unpublish`.
- After `Restore`, `GET /Workflow/Get?WorkflowId=...&ProjectKey=...` returns the
  snapshot's nodes/edges.
