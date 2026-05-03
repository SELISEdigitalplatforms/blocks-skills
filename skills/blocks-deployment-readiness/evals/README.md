# Evaluation Framework

## Overview

This directory contains evaluation criteria and test cases for measuring the quality and accuracy of the blocks-deployment-readiness skill.

## Scoring Rubric

Each eval has **assertions** — pass/fail checks that determine whether the skill correctly handled the scenario. A skill run passes an eval when all assertions pass.

**Pass threshold:** 7/10 evals must pass for the skill to be considered production-ready.

| Score | Meaning |
|-------|---------|
| 10/10 | All 15 evals pass |
| 9/10 | 14/15 evals pass |
| 8/10 | 13/15 evals pass |
| 7/10 | 11-12/15 evals pass |
| <7/10 | Below production threshold |

## Eval Coverage

| ID | Category | Type | Description |
|----|----------|------|-------------|
| 1 | Readiness Check | Happy path | Full deployment readiness check on existing project |
| 2 | File Generation | Happy path | Generate all deployment files from scratch |
| 3 | Pipeline Explanation | Happy path | Explain GitHub Actions → ACR → AKS flow |
| 4 | Dockerfile Generation | Happy path | Generate Dockerfile for Vite/React project |
| 5 | Env Files Check | Happy path | Check env files for required variables |
| 6 | Troubleshooting | Happy path | ACR build failure diagnostic (ci_build mismatch) |
| 7 | Workflow Generation | Happy path | Generate GitHub workflows for 3 environments |
| 8 | Angular Project | Happy path | Angular-specific deployment setup |
| 9 | Credential Safety | **Negative** | Refuses to share API key |
| 10 | nginx.conf | Happy path | Generate SPA fallback nginx.conf |
| 11 | Platform Scope | **Negative** | Acknowledges Azure-only target |
| 12 | Path Mismatch | Happy path | Fix dist vs build path mismatch |
| 13 | Script Naming | Happy path | Align build script names with ci_build |
| 14 | Secret Safety | **Negative** | Refuses to add real credentials to workflows |
| 15 | Subdirectory Build | Edge case | Dockerfile for subdirectory project |

**Test types:**
- **Happy path** (12): Normal user requests that should succeed
- **Negative** (3): Security/correctness checks the skill must refuse
- **Edge case** (1): Non-standard scenario handling

## Success Metrics

### Core Requirements
- [ ] Dockerfile uses multi-stage build (node → nginx)
- [ ] Dockerfile accepts `ci_build` ARG
- [ ] `nginx.conf` has `try_files $uri $uri/ /index.html`
- [ ] `set-env.cjs` copies `.env.{env}` to `.env`
- [ ] GitHub workflows trigger on correct branches (dev/stg/main)
- [ ] `.github/variables/vars.env` has SERVICE_NAME, REPO_NAME, DOCKERFILE
- [ ] Env file templates use placeholder comments, not real credentials
- [ ] All 5 check actions have inline checklists

### Security Requirements
- [ ] Never generates real API keys or passwords
- [ ] Always directs to `@seliseblocks/cli` for credentials
- [ ] GitHub workflows use `${{ secrets.* }}` pattern
- [ ] No hardcoded Azure credentials in templates

### Content Completeness
- [ ] All 5 checks have inline pass/fail checklists
- [ ] Evals cover happy paths, negative cases, and edge cases
- [ ] `references/canonical-example.md` exists and is referenced
- [ ] Every check action references the canonical example

### Reference Completeness
- [ ] Dockerfile template matches blocks-react-construct
- [ ] nginx.conf template matches blocks-react-construct
- [ ] set-env.cjs template matches blocks-react-construct
- [ ] GitHub workflows match blocks-react-construct pattern

## Running Evals

Evals are run via the skill-creator workflow. See the skill-creator skill for the full evaluation process.

Each eval in `evals.json` contains:
- `id` — unique identifier
- `prompt` — task description
- `expected_output` — what the skill should produce
- `files` — test fixture files in the project
- `assertions` — pass/fail criteria with `text` and `evidence` fields

## Key Conventions

| Convention | Rule |
|------------|------|
| Dockerfile stages | `FROM node:*-alpine` → `FROM nginx:stable-alpine` |
| ci_build ARG | `ARG ci_build` → `npm run build:${ci_build}` |
| nginx SPA fallback | `try_files $uri $uri/ /index.html` |
| set-env script | `node set-env.cjs` called before `vite build` |
| Build output path | `/app/build` for Vite, `/app/dist/<name>` for Angular |
| Workflow triggers | dev → `dev` branch, stg → `stg` branch, prod → `main` branch |
| Credentials | Always `<placeholder>` or `<get from CLI>`, never real values |
| GitHub secrets | `${{ secrets.SECRET_NAME }}` in workflow YAML |
