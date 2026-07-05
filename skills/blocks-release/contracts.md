# blocks-release — TypeScript Contracts

> Generated from `https://api.seliseblocks.com/release/v4/swagger/v1/swagger.json` — do not edit by hand.
> Regenerate with `python3 tools/generate-api-docs.py release`.

Types for every schema referenced by this service's endpoints (see `endpoints.md`).
Integer enums are emitted as numeric unions — the C# member names are not published
in the swagger, so treat the meanings as unverified until observed from the live API.

```ts
export interface BaseApiResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  data?: unknown | null;
  message?: string | null;
  statusCode?: HttpStatusCode;
}

export interface BroadcastRequest {
  payload?: unknown | null;
  userIds?: string[];
}

export interface BuildResponse {
  errors?: Record<string, string>;
  isSuccess?: boolean;
  data?: unknown | null;
  message?: string | null;
  statusCode?: HttpStatusCode;
  buildId?: string | null;
}

export interface DeploySettings {
  hostingProvider?: HostingProvider;
  region?: Region;
  machineConfig?: MachineConfig;
}

export interface HostingProvider {
  id?: string | null;
  name?: string | null;
  status?: string | null;
  region?: Region[];
}

export type HttpStatusCode = 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 421 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;  // int enum — member names not published in swagger

export interface MachineConfig {
  id?: string | null;
  ram?: string | null;
  cpu?: string | null;
  bandwidth?: string | null;
  status?: string | null;
}

export interface Region {
  id?: string | null;
  name?: string | null;
  status?: string | null;
  machineSpecs?: MachineConfig[];
}

export interface RepoBuildRequest {
  repoId?: string | null;
  projectKey?: string | null;
  hostingProviderId?: string | null;
  regionId?: string | null;
  machineConfigId?: string | null;
}

export interface RepoDomainUpdateRequest {
  projectKey?: string | null;
  projectEnv?: string | null;
  repoWithDomains?: RepoWithDomain[];
}

export interface RepoUpdateRequest {
  projectKey?: string | null;
  repoId?: string | null;
  hostingProviderId?: string | null;
  regionId?: string | null;
  machineConfigId?: string | null;
  deploymentType?: string | null;
  customDomain?: string | null;
  lastDeploymentDate?: string | null;
  lastDeploymentStatus?: string | null;
  deploySettings?: DeploySettings;
}

export interface RepoWithDomain {
  repoId?: string | null;
  repoUrl?: string | null;
  customDeploymentDomain?: string | null;
}

```
