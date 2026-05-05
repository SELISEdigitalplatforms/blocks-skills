# Angular CI/CD Deployment

## Overview

Angular projects can integrate with SELISE Blocks CloudBuild for automated builds. This guide covers Angular-specific deployment patterns.

## Deployment Flow

1. **Connect repo** — Use `setup-repository-flow` with `get-github-repos` to find the repo
2. **Configure settings** — Use `update-repo-settings` for hosting config
3. **Create webhook** — Use `create-github-webhook` for push-triggered builds
4. **Monitor** — Use `get-build` with polling

## Angular Service

```ts
// src/app/services/cloudbuild.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RepoBuildRequest {
  repoId: string;
  projectKey: string;
  hostingProviderId?: string;
  regionId?: string;
  machineConfigId?: string;
}

export interface BuildResponse {
  buildId: string;
  isSuccess: boolean;
  errors: Record<string, string>;
  data: unknown;
}

@Injectable({ providedIn: 'root' })
export class CloudbuildService {
  private readonly base = environment.blocksApiUrl + '/cloudbuild/v1';
  private readonly headers = { 'Content-Type': 'application/json' };

  constructor(private http: HttpClient) {}

  private projectKey(): string {
    return environment.projectKey;
  }

  triggerBuild(payload: RepoBuildRequest): Observable<BuildResponse> {
    return this.http.post<BuildResponse>(
      `${this.base}/Build/run-build`,
      { ...payload, projectKey: this.projectKey() },
      { headers: new HttpHeaders({ 'x-blocks-key': this.projectKey() }) }
    );
  }

  getBuild(buildId: string): Observable<BuildResponse> {
    return this.http.get<BuildResponse>(
      `${this.base}/Build?buildId=${buildId}&ProjectKey=${this.projectKey()}`,
      { headers: new HttpHeaders({ 'x-blocks-key': this.projectKey() }) }
    );
  }

  getRepos(): Observable<BuildResponse> {
    return this.http.get<BuildResponse>(
      `${this.base}/Build/repos?ProjectKey=${this.projectKey()}`,
      { headers: new HttpHeaders({ 'x-blocks-key': this.projectKey() }) }
    );
  }

  updateRepoSettings(payload: Partial<RepoBuildRequest>): Observable<BuildResponse> {
    return this.http.post<BuildResponse>(
      `${this.base}/Build/repo-settings-update`,
      { ...payload, projectKey: this.projectKey() },
      { headers: new HttpHeaders({ 'x-blocks-key': this.projectKey() }) }
    );
  }
}
```

## Angular Component (Build Trigger)

```ts
// src/app/components/deploy-button/deploy-button.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CloudbuildService } from '../../services/cloudbuild.service';

@Component({
  selector: 'app-deploy-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button (click)="trigger()" [disabled]="loading" class="btn btn-primary">
      @if (loading) {
        <span>Building...</span>
      } @else {
        <span>Deploy to Cloud</span>
      }
    </button>
    @if (buildId) {
      <p>Build ID: {{ buildId }}</p>
    }
    @if (error) {
      <p class="text-red-500">{{ error }}</p>
    }
  `,
})
export class DeployButtonComponent {
  loading = false;
  buildId = '';
  error = '';

  constructor(private cloudbuild: CloudbuildService) {}

  trigger(): void {
    this.loading = true;
    this.cloudbuild.triggerBuild({ repoId: 'my-repo-id' }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.isSuccess) {
          this.buildId = res.buildId ?? '';
          this.pollBuild(this.buildId);
        } else {
          this.error = Object.values(res.errors).join(', ');
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message;
      },
    });
  }

  pollBuild(buildId: string): void {
    const interval = setInterval(() => {
      this.cloudbuild.getBuild(buildId).subscribe((res) => {
        const status = (res.data as any)?.build?.status;
        if (status === 'Succeeded' || status === 'Failed' || status === 'Cancelled') {
          clearInterval(interval);
        }
      });
    }, 10000);
  }
}
```

## Angular Build Configuration

```json
// angular.json build options
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "options": {
            "outputPath": "dist/my-app",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "outputHashing": "all"
          }
        }
      }
    }
  }
}
```

## Environment Configuration

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  blocksApiUrl: 'https://api.seliseblocks.com',
  projectKey: 'YOUR_PROJECT_KEY',
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  blocksApiUrl: 'https://api.seliseblocks.com',
  projectKey: 'YOUR_PROJECT_KEY',
};
```

## GitHub Actions (Angular)

```yaml
# .github/workflows/deploy.yml
name: Deploy Angular App
on: [push]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - name: Trigger Blocks Build
        run: |
          curl -X POST "${{ vars.BLOCKS_API_URL }}/cloudbuild/v1/Build/run-build" \
            -H "x-blocks-key: ${{ vars.BLOCKS_PROJECT_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"repoId": "${{ vars.BLOCKS_REPO_ID }}", "projectKey": "${{ vars.BLOCKS_PROJECT_KEY }}"}'
```
