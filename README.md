# Blocks AI Skills

**Blocks AI Skills** is a modular AI skill system that enables **Claude Code** to build full-stack applications on **SELISE Blocks** — automatically calling the right APIs, generating production-ready frontend code, and following consistent architecture across every project.

Instead of writing boilerplate integration code, you describe what you want to build. Claude reads the skills, selects the correct flow or action, executes the backend requests, and generates the frontend — all grounded in real API contracts.

---

## About SELISE Blocks

SELISE Blocks is a cloud platform that provides backend services as a unified environment:

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

```
skills/
├── blocks-idp/              ✅  Auth, MFA, users, roles, permissions, orgs, sessions, SSO/OIDC
└── blocks-uilm/             ✅  Languages, translation keys, auto-translate, import/export
```

### Coming Soon

```
skills/
├── blocks-data-management/    Schemas, GraphQL CRUD, files, access policies
├── blocks-communication/      Email, notifications, templates
├── blocks-ai-services/      AI agents, knowledge bases, streaming chat
├── blocks-logging/           Logs, traces, analytics
├── blocks-background-tasks/   Scheduled tasks (cron jobs)
└── blocks-webhooks/          Event-driven webhooks
```

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
skills/<domain>/actions/*.md  ← Exact curl, request body, response shape, error handling
    │
    ▼
skills/<domain>/contracts.md   ← TypeScript types for frontend generation
```

**Flows are the key layer.** A flow bundles multiple actions into a correct sequence — for example, the login flow covers: get login options → handle MFA branching → call get-token → store tokens → redirect. Without flows, each action would need to be manually sequenced every time.

---

## Quick Start

```
claude
```

Then try:

```
Build a login page with email/password and MFA support
```

```
Set up authentication for my Next.js app
```

```
Create a schema for blog posts with title, body, and tags
```

```
Set up an AI agent with a knowledge base
```

```
Add email notifications for new signups
```

---

## Skill Structure

Each skill follows this layout:

```
skills/<domain>/
├── SKILL.md              ← Intent map: "user wants X → use flow Y or action Z"
│                          ← Decision guides, verification checklist, troubleshooting
├── contracts.md          ← All TypeScript request/response types
├── README.md             ← Domain overview with quick reference
├── flows/               ← Multi-step workflows (login, schema creation, MFA setup, …)
│   └── *.md
├── actions/             ← Single API operations with exact curl and error handling
│   └── *.md
└── references/         ← Framework-specific implementation guides (Next.js, Vite, Angular, …)
    └── *.md
```

---

## Skill: blocks-idp

Authentication, user management, MFA, RBAC, SSO/OIDC, and organization operations via the IDP v1 API.

### Coverage

| Category | Details |
|----------|---------|
| Authentication | Email/password, social login, OIDC/OAuth2, `client_credentials` |
| MFA | Email OTP (5-digit), TOTP authenticator app (6-digit), resend, disable |
| Users | Create, update, activate, deactivate, search, list with pagination |
| Roles & permissions | Full RBAC — create roles, create permissions, assign to users |
| Organizations | Create orgs, configure multi-org settings, toggle signup methods |
| Sessions | View active sessions, single-device logout, logout all, audit history |
| SSO / OIDC | OIDC client CRUD, SSO credential setup (Okta, Azure AD, Google) |
| Client credentials | Machine-to-machine OAuth2 for backend services and CLI tools |
| CAPTCHA | Create, submit, verify (reCaptcha, hCaptcha) |

### Key Conventions

The IDP API uses conventions that differ from standard REST APIs. Wrong field names silently return empty results.

| Wrong | Correct | Why |
|-------|---------|-----|
| `success` | `isSuccess` | All response envelopes |
| `id` | `itemId` | User, org, credential, role all use `itemId` |
| `languageName` | `language` | User fields use `language` |
| JSON body | `application/x-www-form-urlencoded` | Token endpoint only |
| `/ResendOTP` | `/ResendOtp` | Swagger typo — preserve it |

### Flows

| Flow | What it does |
|------|--------------|
| `auth-setup.md` | Project scaffold — types, service, React Query hooks, auth context |
| `login-flow.md` | Email/password + social + OIDC + MFA branching |
| `user-registration.md` | Self-signup or admin-created with account activation |
| `password-recovery.md` | Forgot password → reset password |
| `mfa-setup.md` | Email OTP + TOTP authenticator enrollment |
| `user-onboarding.md` | Admin creates user + assigns roles + org |
| `session-management.md` | View sessions, single/all device logout |
| `role-permission-setup.md` | Create roles, create permissions, assign to users |
| `oidc-sso-setup.md` | OIDC client, SSO credential, authorize URL |
| `client-credentials.md` | Machine-to-machine OAuth2 for backend services |

### Environment Variables

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.seliseblocks.com
NEXT_PUBLIC_X_BLOCKS_KEY=your-project-key
NEXT_PUBLIC_OIDC_CLIENT_ID=your-client-id
NEXT_PUBLIC_OIDC_REDIRECT_URI=http://localhost:3000/api/auth/callback

# For direct API operations (never embed in frontend)
USERNAME=your-cloudadmin-email
PASSWORD=your-cloudadmin-password
```

---

## Skill: blocks-uilm

Languages, translation keys, AI-powered auto-translation, and UILM file import/export via the UILM v1 API.

### Coverage

| Category | Details |
|----------|---------|
| Languages | Add, list, set default, delete |
| Modules | Create, list (route-based loading: `common` + route-specific) |
| Translation keys | Create, update, delete, batch create, get by name |
| Translations | Add values per language, auto-translate via AI |
| File management | Import JSON, export compiled JSON, regenerate, rollback |
| Webhooks | Configure localization change notifications |

### Key Conventions

| Wrong | Correct | Why |
|-------|---------|-----|
| `moduleName` | `moduleId` | Key operations (Save, Gets, TranslateAll) |
| `moduleName` | `moduleName` | Module operations (Module/Save, Module/Gets) |
| `translations[]` | `resources[]` | Key structures use `{value, culture, characterLength}` |
| `data[]` | `keys[]` | GetKeysQueryResponse |
| `keyId` | `itemId` | Key responses |

### Translation Key Naming

Translation keys must use **semantic names** that describe meaning, not UI structure:

| Bad | Good | Why |
|-----|------|-----|
| `HERO_WELCOME_CLIENTS` | `WELCOME_CLIENTS` | Hero is a UI pattern |
| `FEATURES_SHIP_HOURS_DESC_1` | `SHIP_HOURS_DESC` | Count-based segments are fragile |
| `FOOTER_COPYRIGHT` | _(not a key)_ | Copyright/legal text is not translatable |

Rules:
- No UI-type prefixes: `BTN_`, `CTA_`, `BADGE_`, `SECTION_`
- No layout names: `HEADER_`, `FOOTER_`, `SIDEBAR_`
- No component names: `CARD_`, `TABLE_`, `FORM_`
- Use `SCREAMING_SNAKE_CASE`
- Common module: `NAV_HOME`, `ERROR_REQUIRED`
- Route-specific: `HOME_HERO_TITLE`, `AUTH_LOGIN_SUBMIT`

### Flows

| Flow | What it does |
|------|--------------|
| `client-i18n-setup.md` | React + Vite/Next.js scaffold with i18next + React Query |
| `language-setup.md` | Add languages, set default, create modules |
| `key-management.md` | Create keys, add translations, AI-translate missing values |
| `import-export.md` | Import JSON files, export/download compiled files |
| `scan-and-generate.md` | Scan source code for `useTranslation()` calls, generate CSV |

---

## Prerequisites — Cloud Portal Setup

Complete these steps manually in the [Cloud Portal](https://cloud.seliseblocks.com) before any API call will work.

### 1. Create a Project

Cloud Portal → Projects → Create Project

Copy **Blocks Key** → `X_BLOCKS_KEY`

### 2. Create an Environment

Cloud Portal → Projects → [Your Project] → Environments → Create

The API base URL is always `https://api.seliseblocks.com`. The environment must exist for your project to be active.

### 3. Add a Developer Account with `cloudadmin` role

Cloud Portal → Projects → [Your Project] → People → Add Member

Assign the `cloudadmin` role. This account's credentials become `USERNAME` and `PASSWORD` in `.env`.

### 4. Attach a Repository

Cloud Portal → Projects → [Your Project] → Repositories → Attach

### Error Reference

| HTTP Status | Likely Cause | Fix |
|-------------|-------------|-----|
| `401` | Wrong credentials | Check `USERNAME` / `PASSWORD` in Cloud Portal → People |
| `403` | Missing `cloudadmin` role | Assign role in Cloud Portal → People |
| `404` | Wrong API URL | Re-check `API_BASE_URL` from Environments |
| All APIs fail | Project not set up | Complete all 4 portal steps above |

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

**shadcn/ui MCP** — configure the shadcn/ui MCP server in Claude Code for real-time component API lookups during code generation:
```
https://ui.shadcn.com/docs/mcp
```

The skills system is not tied to any specific framework. To use a different stack, each skill's `SKILL.md` references framework-specific guides for Next.js, React Native, Angular, Flutter, and Blazor .NET.

---

## Example Use Cases

### Authentication & Access Control
- Login with email/password and MFA (email OTP + TOTP)
- Self-registration with account activation
- Password recovery with email reset link
- Role-based access control — create roles, assign permissions, manage users
- View active sessions and logout from all devices
- SSO/OIDC login with Okta, Azure AD, or Google

### Data Management
- Define data schemas with validation rules
- GraphQL-based CRUD for collections
- File upload with S3/DMS integration

### Localization
- Set up multiple languages for a project
- Manage translation keys with semantic naming
- Auto-translate all missing translations via AI
- Import/export translation files

### Communication
- Send transactional emails
- Configure email templates
- In-app notification system

### AI Services
- Create AI agents with custom prompts
- Upload documents for knowledge bases (RAG)
- Streaming chat interfaces
- Direct LLM queries

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
