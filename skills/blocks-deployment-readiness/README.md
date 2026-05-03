# blocks-deployment-readiness

Prepares SELISE Blocks projects for deployment by checking and generating required configuration files.

---

## What This Skill Does

| Category | Coverage |
|----------|---------|
| **Readiness checks** | Verify .env files, build config, Dockerfile, workflows, hosting config |
| **File generation** | Generate Dockerfile, nginx.conf, GitHub workflows, env templates |
| **Guidance** | CLI-based credential setup, project structure reference |

---

## What This Skill Does NOT Do

- Trigger builds via CloudBuild API (use `blocks-deployment` skill)
- Store or handle credentials
- Monitor running deployments

---

## Skill Structure

```
skills/blocks-deployment-readiness/
├── SKILL.md                      <- Intent map, trigger phrases, verification checklist
├── meta.json                    <- Machine-readable skill metadata
├── README.md                    <- This file
├── evals/                       <- Evaluation tests
│   └── evals.json
├── checks/                      <- 5 readiness check actions
│   ├── check-env-files.md
│   ├── check-build-config.md
│   ├── check-dockerfile.md
│   ├── check-github-workflows.md
│   └── check-hosting-config.md
├── flows/
│   └── make-deployment-ready.md <- Full 7-step preparation flow
└── references/                  <- Templates and documentation
    ├── canonical-example.md
    ├── dockerfile-template.md
    ├── env-variables.md
    └── github-workflows.md
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
| `.env.dev`, `.env.stg`, `.env.prod` | Environment-specific configuration |
| `Dockerfile` | Container build definition |
| `nginx.conf` | Web server configuration |
| `.github/workflows/*.yml` | CI/CD pipelines |
| `package.json` | Build scripts (`build:dev`, `build:stg`, `build:prod`) |
| `set-env.cjs` | Environment file switcher (optional but recommended) |

---

## Credential Safety

**Never share API keys or passwords with AI.** This skill guides you to use `@seliseblocks/cli` for credential setup instead.

---

## Quick Start

```
Check if my project is deployment-ready
```

```
Make my React app deployment-ready
```

```
Generate a Dockerfile and GitHub workflows for my project
```

---

## Environment Variables

This skill generates templates. The actual values must be set via CLI:

```bash
npm install -g @seliseblocks/cli
blocks login
blocks init --env
blocks config set --key <your-x-blocks-key>
```

---

## Reference

The canonical example project is `blocks-react-construct` — use its structure as a template for your own projects.

---

## Version

**1.0.0** — Initial release. Covers Vite/React project readiness checks and template generation for Azure ACR + AKS deployment.
