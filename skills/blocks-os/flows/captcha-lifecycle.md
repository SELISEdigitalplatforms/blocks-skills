# Configure a captcha and verify a challenge

Run the full captcha lifecycle: configure a provider for the project (admin, once), create a challenge, render it to the user, submit their answer, and verify the resulting code — optionally feeding it into a blocks-iam login as `captcha_code`.

Preconditions: `x-blocks-key` on every call; a bearer token for the configuration endpoints (Save/Gets/UpdateStatus). The challenge endpoints (Create/Submit/Verify) are what an end-user-facing app calls. If you use an external captcha provider you need its key/secret; the built-in generator works from configuration alone (provider values are not enumerated in swagger — check your OS portal captcha settings for the exact strings).

## Steps

1. **(Admin, once) `POST /Captcha/Save`** — create the project's captcha configuration ([endpoints.md#captcha](../endpoints.md#captcha)). Key fields: `provider`, `captchaGenerator`, `captchaKey`/`captchaSecret` (external providers), `isEnable: true`, `projectKey` (projectKey = your Blocks Key — the same value as `x-blocks-key`). Response is `BaseMutationResponse` — keep `itemId` if you plan to toggle it later.
2. **(Admin) `GET /Captcha/Gets?ProjectKey=<key>`** — confirm the configuration exists and `isEnable` is true. Note the configuration's identity; the challenge endpoints reference a configuration by *name* (`configurationName`).
3. **`POST /Captcha/Create`** — start a challenge. Body: `{ "configurationName": "<name>" }`. Response: `{ id, captcha, itemId, isSuccess, errors }`. Keep `id` — it identifies this challenge. Render `captcha` to the user; its encoding is not documented in swagger (commonly an image payload) — inspect the live response once and render accordingly.
4. **User solves it → `POST /Captcha/Submit`** — body `{ "id": "<from step 3>", "value": "<user input>" }`. Response: `{ isSuccess, verificationCode, itemId, errors }`. On success keep `verificationCode`. On failure (`isSuccess: false` or empty `verificationCode`), create a fresh challenge via step 3 — there is no "refresh challenge" endpoint.
5. **`GET /Captcha/Verify?VerificationCode=<code>&ConfigurationName=<name>`** — server-side confirmation that the code is genuine. Response: `{ verified, hostName, isSuccess, errors }`. Call this from your backend when you accept a captcha-gated action yourself.
6. **Hand off to consumers of the code**:
   - **blocks-iam login**: pass the `verificationCode` from step 4 as `captcha_code` in `POST /iam/v4/auth/login` (see the blocks-iam skill). The IAM service validates it — you don't need to call Verify yourself in this path.
   - **Platform signup**: `POST /People/Signup` takes `{ email, captchaCode }` ([endpoints.md#people](../endpoints.md#people)); response shape not documented in swagger — inspect the live response.

Branches / error paths:
- Any step with `isSuccess: false` — read the `errors` dictionary (string→string) for the reason.
- 401 on admin endpoints — refresh the token (blocks-setup).
- To pause captcha without deleting config: `POST /Captcha/UpdateStatus` with `{ itemId, isEnable: false, projectKey }`.
- To *require* captcha on specific platform endpoints: `POST /ApiEndpointConfig/GetList` to find endpoint config `itemId`s, then `POST /ApiEndpointConfig/Update` (single) or `/BulkUpdate` (many) with `isCaptchaRequired: true` ([endpoints.md#apiendpointconfig](../endpoints.md#apiendpointconfig)). All three responses are undocumented in swagger — verify live.

## Verify

- `GET /Captcha/Verify` returns `verified: true` for a code produced by a correct Submit.
- `GET /Captcha/Gets?ProjectKey=<key>` shows the configuration with `isEnable: true`.
- End-to-end: a blocks-iam login that previously failed with a captcha requirement succeeds when `captcha_code` is included.
