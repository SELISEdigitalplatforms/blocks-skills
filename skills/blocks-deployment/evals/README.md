# Evaluation Framework

## Overview

This directory contains evaluation criteria and test cases for measuring the quality and accuracy of the blocks-deployment skill.

## Running Evals

Evals are defined in `evals.json`. Each eval represents a scenario that the skill should handle correctly.

## Eval Coverage

| Category | Test Cases |
|----------|------------|
| Build Trigger | 1, 11, 19 |
| Build Monitoring | 2, 15 |
| Repository Operations | 3, 14 |
| Hosting Configuration | 4, 18 |
| GitHub Integration | 5, 6, 7, 12, 13, 17 |
| Error Handling | 10, 16 |
| Update Settings | 8 |
| Build Reports | 9 |
| End-to-End Workflows | 20 |

## Success Metrics

- All 15 action files reference correct endpoints with exact field names
- All 2 flow files follow the Pre-flight Audit + Flow Steps + Error Handling format
- contracts.md contains all documented schemas, endpoints, and types
- SKILL.md contains API Conventions, Field Name Pitfalls, Verification Checklist, Troubleshooting
- 20 comprehensive eval test cases covering all scenarios

## Key Field Name Rules (critical for evals)

| Field | Location | Rule |
|-------|----------|------|
| Build trigger | body | Use `repoId`, NOT `repositoryId` |
| Query params | URL | Use `ProjectKey` (PascalCase), NOT `projectKey` |
| Repo ID param | URL | Use `RepoId` (PascalCase), NOT `repoId` |
| Build ID param | URL | Use `BuildId` (PascalCase), NOT `buildId` |
| Auth header | header | Use `x-blocks-key`, NOT `Authorization: Bearer` |
| GitHub webhook | URL | `x-blocks-key` goes in query param, NOT header |
| `POST /Build/run-build` | endpoint | Auto-deploy build |
| `POST /Build/manual` | endpoint | Build-only, no deploy |
| `errors` field | response | Treat as dictionary: `errors[fieldName]` |
| `buildId` in BuildResponse | response | Top-level field, NOT nested in `data.build.buildId` |

## API Base Path

All endpoints use `/cloudbuild/v1/` prefix:
- Correct: `https://api.example.com/cloudbuild/v1/Build/run-build`
- Wrong: `https://api.example.com/deployment/v1/Build/run-build`
