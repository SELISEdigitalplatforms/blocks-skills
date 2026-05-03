# React Native CI/CD Deployment

## Overview

React Native projects can integrate with SELISE Blocks CloudBuild for automated builds and deployments. This guide covers React Native-specific patterns.

## Deployment Flow

1. **Connect repo** — Use `setup-repository-flow` with `get-github-repos` to find the repo
2. **Configure settings** — Use `update-repo-settings` for hosting config
3. **Create webhook** — Use `create-github-webhook` for push-triggered builds
4. **Monitor** — Use `get-build` with polling

## React Native Service

```ts
// src/services/cloudbuild.ts
const BASE = 'https://api.seliseblocks.com/cloudbuild/v1';

interface RepoBuildRequest {
  repoId: string;
  projectKey: string;
  hostingProviderId?: string;
  regionId?: string;
  machineConfigId?: string;
}

interface BuildResponse {
  buildId: string;
  isSuccess: boolean;
  errors: Record<string, string>;
  data: unknown;
}

export const cloudbuildService = {
  triggerBuild: async (payload: RepoBuildRequest): Promise<BuildResponse> => {
    const res = await fetch(`${BASE}/Build/run-build`, {
      method: 'POST',
      headers: {
        'x-blocks-key': payload.projectKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  getBuild: async (buildId: string, projectKey: string): Promise<BuildResponse> => {
    const res = await fetch(
      `${BASE}/Build?buildId=${buildId}&ProjectKey=${projectKey}`,
      {
        headers: { 'x-blocks-key': projectKey },
      }
    );
    return res.json();
  },

  getRepos: async (projectKey: string): Promise<BuildResponse> => {
    const res = await fetch(`${BASE}/Build/repos?ProjectKey=${projectKey}`, {
      headers: { 'x-blocks-key': projectKey },
    });
    return res.json();
  },

  getGithubRepos: async (
    projectKey: string,
    search?: string,
    page = 1,
    pageSize = 30
  ): Promise<BuildResponse> => {
    const params = new URLSearchParams({
      ProjectKey: projectKey,
      PageNumber: String(page),
      PageSize: String(pageSize),
      ...(search && { Search: search }),
    });
    const res = await fetch(`${BASE}/Github/repos?${params}`, {
      headers: { 'x-blocks-key': projectKey },
    });
    return res.json();
  },

  createWebhook: async (projectKey: string): Promise<BuildResponse> => {
    const res = await fetch(`${BASE}/Github/webhook?x-blocks-key=${projectKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },
};
```

## React Native Hook

```tsx
// src/hooks/useDeployment.ts
import { useState, useEffect, useCallback } from 'react';
import { cloudbuildService } from '../services/cloudbuild';
import type { BuildResponse, RepoBuildRequest } from '../services/cloudbuild';

export const useBuildPolling = (buildId: string, projectKey: string) => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!buildId) return;

    const poll = async () => {
      const res: BuildResponse = await cloudbuildService.getBuild(buildId, projectKey);
      if (!res.isSuccess) {
        setError(Object.values(res.errors).join(', '));
        return;
      }
      const buildStatus = (res.data as any)?.build?.status;
      setStatus(buildStatus);
      if (buildStatus === 'Succeeded' || buildStatus === 'Failed' || buildStatus === 'Cancelled') {
        return; // Stop polling
      }
    };

    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [buildId, projectKey]);

  return { status, loading, error };
};

export const useTriggerBuild = () => {
  const [loading, setLoading] = useState(false);
  const [buildId, setBuildId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trigger = useCallback(async (payload: RepoBuildRequest) => {
    setLoading(true);
    setError(null);
    const res: BuildResponse = await cloudbuildService.triggerBuild(payload);
    setLoading(false);

    if (res.isSuccess && res.buildId) {
      setBuildId(res.buildId);
      return res.buildId;
    } else {
      setError(Object.values(res.errors).join(', '));
      return null;
    }
  }, []);

  return { trigger, loading, buildId, error };
};
```

## React Native Component

```tsx
// src/screens/BuildTriggerScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useTriggerBuild, useBuildPolling } from '../hooks/useDeployment';

const PROJECT_KEY = 'YOUR_PROJECT_KEY';

export const BuildTriggerScreen: React.FC = () => {
  const { trigger, loading: triggering, buildId: triggeredBuildId, error: triggerError } = useTriggerBuild();
  const { status, error: pollError } = useBuildPolling(triggeredBuildId ?? '', PROJECT_KEY);
  const [selectedRepo, setSelectedRepo] = useState('');

  const handleTrigger = async () => {
    if (!selectedRepo) return;
    await trigger({
      repoId: selectedRepo,
      projectKey: PROJECT_KEY,
    });
  };

  const statusColors: Record<string, string> = {
    Queued: '#FFA500',
    InProgress: '#1E90FF',
    Succeeded: '#32CD32',
    Failed: '#FF4444',
    Cancelled: '#888888',
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, marginBottom: 12 }}>Deploy App</Text>

      {triggerError && <Text style={{ color: 'red' }}>{triggerError}</Text>}
      {pollError && <Text style={{ color: 'red' }}>{pollError}</Text>}

      {triggeredBuildId ? (
        <View style={{ marginTop: 16 }}>
          <Text>Build ID: {triggeredBuildId}</Text>
          <Text style={{ color: statusColors[status] ?? '#000', fontWeight: 'bold', marginTop: 8 }}>
            Status: {status}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={{ backgroundColor: '#1E90FF', padding: 16, borderRadius: 8, marginTop: 16 }}
          onPress={handleTrigger}
          disabled={triggering || !selectedRepo}
        >
          {triggering ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', textAlign: 'center' }}>Trigger Build</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};
```

## Environment Configuration

```env
# .env
BLOCKS_API_URL=https://api.seliseblocks.com
BLOCKS_PROJECT_KEY=YOUR_PROJECT_KEY
```

```ts
// src/config/env.ts
export const config = {
  apiUrl: process.env.BLOCKS_API_URL ?? 'https://api.seliseblocks.com',
  projectKey: process.env.BLOCKS_PROJECT_KEY ?? '',
};
```

## GitHub Actions (React Native)

```yaml
# .github/workflows/deploy.yml
name: Deploy React Native App
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          CI: true
      - name: Trigger Blocks Build
        run: |
          curl -X POST "${{ vars.BLOCKS_API_URL }}/cloudbuild/v1/Build/run-build" \
            -H "x-blocks-key: ${{ vars.BLOCKS_PROJECT_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"repoId": "${{ vars.BLOCKS_REPO_ID }}", "projectKey": "${{ vars.BLOCKS_PROJECT_KEY }}"}'
```

## Framework Notes

- React Native uses standard `fetch` — no axios needed
- For iOS builds, CloudBuild typically handles the native build in a container; the React Native bundle is included in the artifact
- Environment variables for project key should use a config file, not hardcoded strings
- For `expo run:ios`, the `ios` directory is built separately; CloudBuild handles the CI pipeline end-to-end
