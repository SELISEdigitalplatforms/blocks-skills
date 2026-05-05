# blocks-deployment-readiness

Prepares SELISE Blocks projects for deployment by checking and generating required configuration files.

---

## What This Skill Does

| Category | Coverage |
|----------|---------|
| **Readiness checks** | Verify .env files, build config, Dockerfile, hosting config |
| **File generation** | Generate Dockerfile, nginx.conf, start.sh, env templates |
| **Guidance** | Project structure reference, env variable documentation |

---

## What This Skill Does NOT Do

- Trigger builds via CloudBuild API (use `blocks-deployment` skill)
- Store or handle credentials
- Monitor running deployments
- Generate GitHub workflows (managed by infrastructure team)

---

## Skill Structure

```
skills/blocks-deployment-readiness/
├── SKILL.md                      <- Intent map, trigger phrases, verification checklist
├── meta.json                     <- Machine-readable skill metadata
├── README.md                     <- This file
├── evals/                        <- Evaluation tests
│   └── evals.json
├── checks/                       <- 5 readiness check actions
│   ├── check-env-files.md
│   ├── check-build-config.md
│   ├── check-dockerfile.md
│   ├── check-hosting-config.md
│   └── check-build-passes.md
├── flows/
│   └── make-deployment-ready.md  <- Full preparation flow
└── references/                   <- Templates and documentation
    ├── canonical-example.md
    ├── dockerfile-template.md
    └── env-variables.md
```

---

## When to Use

Use this skill when:
- Setting up deployment for a new project
- Checking if an existing project is deployment-ready
- Troubleshooting deployment failures
- Adding missing deployment configuration

---

## Key Files Checked

| File | Purpose |
|------|---------|
| `.env.dev`, `.env.prod` | Environment-specific configuration |
| `Dockerfile` | Container build definition (Next.js standalone or Vite static) |
| `nginx.conf` | Reverse proxy (Next.js) or static file server (Vite/Angular) |
| `start.sh` | Startup orchestrator for Next.js standalone |
| `next.config.ts` / `vite.config.ts` | Build tool configuration |
| `package.json` | Build scripts (`build:dev`, `build:prod`) |

---

## Credential Safety

**Never share API keys or passwords with AI.** This skill generates templates with placeholder values. Fill in actual credentials via the Blocks Cloud Portal or your organization's secret management.

---

## Quick Start

```
Check if my project is ready to deploy
```

```
Make my React app deployment-ready
```

```
Generate a Dockerfile for my blocks project
```

---

## Reference

The canonical example project is `sample/blocks-website-next/` — use its structure as a reference for Next.js standalone deployments.

---

## Version

**1.1.0** — Revamped for Next.js standalone pattern with nginx reverse proxy. Removed `@seliseblocks/cli` references. Supports Next.js (primary) and Vite/Angular (fallback) patterns.
