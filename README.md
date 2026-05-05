# Blocks AI Skills

Blocks AI Skills is a modular system that enables **Claude Code** to build full-stack applications on **SELISE Blocks** — automatically calling the right APIs, generating production-ready frontend code, and following consistent architecture across every project.

Instead of writing boilerplate integration code, you describe what you want to build. Claude reads the skills, selects the correct flow or action, executes the backend requests, and generates the frontend — all grounded in real API contracts.

---

## About SELISE Blocks

SELISE Blocks is a cloud platform providing backend services as a unified environment:

| Service | What it does |
|---------|-------------|
| **IDP** | Authentication, MFA, users, roles, permissions, organizations |
| **UILM** | Localization, translation keys, import/export |
| **UDS** | Data schemas, GraphQL access, files, access policies |
| **Communication** | Email, in-app notifications, templates |
| **Blocks AI** | AI agents, knowledge bases, models, streaming chat |
| **Logging/Monitoring** | Logs, distributed traces, performance analytics |

- Cloud Portal: https://cloud.seliseblocks.com
- Documentation: https://docs.seliseblocks.com/cloud/

---

## Implemented Skills

| Skill | Domain | Coverage |
|-------|--------|----------|
| `blocks-idp` | Identity & Access | Auth, MFA, users, roles, permissions, orgs, SSO/OIDC, sessions |
| `blocks-uilm` | Localization | Languages, translation keys, AI auto-translate, import/export |
| `blocks-uds` | Data Management | Schemas, GraphQL CRUD, files (S3/DMS), access policies, validations |
| `blocks-deployment` | CI/CD | Build triggers, repository config, GitHub webhooks via CloudBuild API |
| `blocks-deployment-readiness` | Deployment Prep | Dockerfile, GitHub workflows, env files, build config generation |

### Coming Soon

| Skill | Coverage |
|-------|---------|
| `blocks-communication` | Email, notifications, templates |
| `blocks-ai-services` | AI agents, knowledge bases, streaming chat |
| `blocks-logging` | Logs, traces, analytics |
| `blocks-background-tasks` | Scheduled tasks (cron jobs) |
| `blocks-webhooks` | Event-driven webhooks |

---

## How It Works

When you describe a feature, Claude follows a fixed decision chain:

```
User request
    │
    ▼
skills/<domain>/SKILL.md       ← Which flow or action handles this?
    │
    ▼
skills/<domain>/flows/*.md    ← Multi-step workflow (run these, not individual actions)
    │
    ▼
skills/<domain>/actions/*.md    ← Exact curl, request body, response shape, error handling
    │
    ▼
skills/<domain>/contracts.md   ← TypeScript types for frontend generation
```

**Flows are the key layer.** A flow bundles multiple actions into a correct sequence. Without flows, each action would need to be manually sequenced every time.

---

## Skill Structure

Each skill follows this layout:

```
skills/<domain>/
├── SKILL.md              ← Intent map: "user wants X → use flow Y or action Z"
│                          ← Decision guides, verification checklist, troubleshooting
├── contracts.md           ← All TypeScript request/response types (API skills only)
├── README.md             ← Domain overview — coverage, conventions, environment variables
├── meta.json              ← Machine-readable metadata
├── evals/               ← Evaluation test cases
├── flows/               ← Multi-step workflows (login, schema creation, ...)
│   └── *.md
├── actions/             ← Single API operations with exact curl and error handling
│   └── *.md
├── checks/              ← Readiness check actions (deployment-readiness only)
│   └── *.md
└── references/          ← Framework-specific implementation guides
    └── *.md
```

---

## Quick Start

```
Build a login page with email/password and MFA support
```

```
Create a schema for blog posts with title, body, and tags
```

```
Set up English and German as project languages
```

```
Make my project deployment-ready
```

---

## Learn About Each Skill

You can ask the AI to explain any skill. Try:

```
How to use blocks-idp?
```

```
How to use blocks-uilm?
```

```
How to use blocks-uds?
```

```
How to use blocks-deployment?
```

```
How to use blocks-deployment-readiness?
```

Each command loads the skill's full documentation and explains what it covers, key conventions, how to set things up, common pitfalls, and example prompts.

---

## Prerequisites — Cloud Portal Setup

Complete these steps manually in the [Cloud Portal](https://cloud.seliseblocks.com) before any API call will work.

1. **Create a Project** — Cloud Portal → Projects → Create Project. Copy Blocks Key → `X_BLOCKS_KEY`
2. **Create an Environment** — Cloud Portal → Projects → [Your Project] → Environments → Create. The API base URL is always `https://api.seliseblocks.com`
3. **Add a Developer Account with `cloudadmin` role** — Cloud Portal → Projects → [Your Project] → People → Add Member
4. **Attach a Repository** — Cloud Portal → Projects → [Your Project] → Repositories → Attach

| Error | Fix |
|-------|-----|
| `401` | Wrong credentials — check `USERNAME` / `PASSWORD` |
| `403` | Missing `cloudadmin` role — assign in Cloud Portal |
| `404` | Wrong API URL — check `API_BASE_URL` |
| All APIs fail | Project not set up — complete all 4 steps above |

---

## Frontend Stack

The default stack follows the reference implementation at [blocks-construct-react](https://github.com/SELISEdigitalplatforms/blocks-construct-react):

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS 3.4 |
| Components | Radix UI + shadcn/ui |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| State | Zustand (persisted) |
| Data fetching | TanStack Query |
| Font | Nunito Sans |

**shadcn/ui MCP** — configure the shadcn/ui MCP server in Claude Code for real-time component API lookups:

```
https://ui.shadcn.com/docs/mcp
```

The skills system is not tied to any specific framework. Each skill references framework-specific guides for Next.js, React Native, Angular, Flutter, and Blazor .NET.

---

## Contributing

Contributions welcome. The most valuable additions:

- New action files grounded in real Swagger endpoints
- Flow files for common multi-step patterns not yet covered
- Corrections to `contracts.md` based on real API responses
- New domain skill sets (follow the structure in `CONTRIBUTING.md`)

```
# Add a new action
skills/<domain>/actions/<action-name>.md
  - Exact endpoint + HTTP method
  - curl example with all headers
  - Request/response schemas
  - Error handling

# Add a new flow
skills/<domain>/flows/<flow-name>.md
  - Multi-step sequence with branches
  - References existing actions (don't duplicate)
  - Error paths documented

# Add a new domain
# Copy skills/_template/ and adapt
```

See `CONTRIBUTING.md` for the full contribution guide.

---

## License

MIT License — Copyright (c) 2026 SELISE (Blocks)
