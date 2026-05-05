# Evaluation Framework

## Overview

This directory contains evaluation criteria and test cases for measuring the quality and accuracy of the blocks-deployment-readiness skill.

## Scoring Rubric

Each eval has **assertions** — pass/fail checks that determine whether the skill correctly handled the scenario. A skill run passes an eval when all assertions pass.

**Pass threshold:** 9/10 evals must pass for the skill to be considered production-ready.

| Score | Meaning |
|-------|---------|
| 10/10 | All 20 evals pass |
| 9/10 | 18/20 evals pass |
| 8/10 | 16/20 evals pass |
| 7/10 | 14/20 evals pass |
| <7/10 | Below production threshold |

## Eval Coverage

| ID | Category | Type | Description |
|----|----------|------|-------------|
| 1 | Readiness Check | Happy path | Full deployment readiness check on Next.js project |
| 2 | File Generation | Happy path | Generate Next.js standalone deployment files |
| 3 | Pipeline Explanation | Happy path | Explain GitHub Actions → ACR → AKS flow |
| 4 | Dockerfile Generation | Happy path | Generate Next.js standalone Dockerfile |
| 5 | Env Files Check | Happy path | Check env files for required variables |
| 6 | Troubleshooting | Happy path | ACR build failure diagnostic (ci_build mismatch) |
| 7 | Vite Project | Happy path | Vite-specific deployment setup |
| 8 | Angular Project | Happy path | Angular-specific deployment setup |
| 9 | Credential Safety | **Negative** | Refuses to share API key |
| 10 | nginx.conf | Happy path | Generate reverse proxy nginx.conf for Next.js |
| 11 | Platform Scope | **Negative** | Acknowledges Azure-only target |
| 12 | Path Mismatch | Happy path | Fix dist vs build path mismatch |
| 13 | start.sh | Happy path | Generate start.sh for Next.js standalone |
| 14 | Secret Safety | **Negative** | Refuses to add real credentials |
| 15 | Subdirectory Build | Edge case | Dockerfile for subdirectory project |
| 16 | Flutter Web | Happy path | Generate Dockerfile for Flutter web |
| 17 | Blazor WASM | Happy path | Generate Dockerfile for Blazor WebAssembly |
| 18 | Angular Project Name | Happy path | Extract project name from angular.json |
| 19 | Next.js Image Config | Happy path | Check next.config.ts remotePatterns for image CDNs |
| 20 | Flutter Extension Support | Happy path | Configure localStorage for UILM browser extension |

**Test types:**
- **Happy path** (16): Normal user requests that should succeed
- **Negative** (3): Security/correctness checks the skill must refuse
- **Edge case** (1): Non-standard scenario handling

## Success Metrics

### Core Requirements
- [ ] Detects framework correctly: Next.js standalone, Vite, Angular, Flutter, Blazor WASM, Blazor Server
- [ ] Dockerfile uses correct pattern per framework
- [ ] Dockerfile accepts `ci_build` ARG
- [ ] Next.js: `COPY .env.${ci_build} .env.local` and `ENV NEXT_ENV=${ci_build}`
- [ ] Next.js: `nginx.conf` proxies to `http://localhost:3000`
- [ ] Vite/Angular/Flutter/Blazor WASM: `nginx.conf` has `try_files $uri $uri/ /index.html`
- [ ] Env file templates use placeholder comments, not real credentials
- [ ] All 5 check actions have inline checklists

### Framework-Specific
- [ ] Angular: Dockerfile output path extracted from `angular.json`
- [ ] Flutter: `flutter config --enable-web` and `flutter pub get` before build
- [ ] Blazor WASM: `dotnet publish` → `nginx:stable-alpine` serving `publish/wwwroot/`
- [ ] Blazor Server: `dotnet aspnet` image with `CMD ["dotnet", "MyApp.dll"]`
- [ ] Flutter/Blazor: localStorage `projectKey` for UILM browser extension
- [ ] Next.js: `images.remotePatterns` in `next.config.ts` for external CDNs

### Security Requirements
- [ ] Never generates real API keys or passwords
- [ ] Always uses placeholder values (`<your-project-key>`) in templates
- [ ] No hardcoded Azure credentials in templates

### Content Completeness
- [ ] All 5 checks have inline pass/fail checklists
- [ ] Evals cover happy paths, negative cases, and edge cases
- [ ] `references/canonical-example.md` exists and is referenced
- [ ] Every check action references the canonical example

### Reference Completeness
- [ ] Dockerfile template matches `sample/blocks-website-next/` (Next.js)
- [ ] nginx.conf template matches Next.js reverse proxy pattern
- [ ] start.sh template matches Next.js standalone pattern
- [ ] Supports Vite/Angular/Flutter/Blazor fallback patterns

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
| Pattern detection | Check `next.config.ts` for `output: 'standalone'` first |
| Next.js Dockerfile | `FROM node:21-alpine AS builder` → `FROM node:21-alpine AS runner` (nginx installed) |
| Vite/Angular Dockerfile | `FROM node:21-alpine AS builder` → `FROM nginx:stable-alpine` |
| Flutter Dockerfile | `FROM node:21-alpine AS builder` → `FROM nginx:stable-alpine` (builds to `build/web/`) |
| Blazor WASM Dockerfile | `FROM mcr.microsoft.com/dotnet/sdk:8.0` → `FROM nginx:stable-alpine` (builds to `publish/wwwroot/`) |
| Blazor Server Dockerfile | `FROM mcr.microsoft.com/dotnet/aspnet:8.0` (no nginx) |
| ci_build ARG | `ARG ci_build` → `npm run build:${ci_build}` |
| Next.js env switching | `COPY .env.${ci_build} .env.local` + `ENV NEXT_ENV=${ci_build}` |
| Next.js nginx proxy | `proxy_pass http://localhost:3000` |
| Static nginx | `try_files $uri $uri/ /index.html` |
| Next.js startup | `start.sh` launches `node server.js &` + `nginx -g 'daemon off;'` |
| Angular dist path | Extract from `angular.json` via `jq` or manual lookup |
| Build output path | `.next/standalone/` (Next.js), `/app/build` (Vite), `/app/dist/<name>` (Angular), `/app/build/web` (Flutter), `/app/publish/wwwroot` (Blazor WASM) |
| Credentials | Always `<your-project-key>` or `<placeholder>`, never real values |
