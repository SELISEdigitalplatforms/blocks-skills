# Agents — who reads what, and how to tell who is here

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. [Step 0](step-0-ask.md) uses this file to decide which front doors to build; [front-doors.md](front-doors.md) uses it to add or drop one agent. When an agent's behavior changes, this is the only file to update.

---

## The agent table

What each agent reads, verified against its own documentation on 2026-09-19 unless marked. The two "reads" columns decide what to build: a **no** in the skills column means a stub directory, a **no** in the `AGENTS.md` column means a pointer file. A blank own-directory cell means the agent has no native location besides `.agents/skills/`.

| Agent | Reads `.agents/skills/` | Own project skills dir | Reads `AGENTS.md` | Own instruction file | Detect by |
|---|---|---|---|---|---|
| Claude Code (CLI, desktop, IDE) | **no** | `.claude/skills/` | **no** | `CLAUDE.md` | `claude` on PATH, `~/.claude/` |
| Codex | yes | | yes | | `codex` on PATH, `~/.codex/` |
| Cursor | yes | `.cursor/skills/` | yes | | `cursor-agent` or `cursor` on PATH, `~/.cursor/` |
| Gemini CLI | yes | `.gemini/skills/` | **no** — only via `context.fileName` | `GEMINI.md` | `gemini` on PATH, `~/.gemini/` |
| GitHub Copilot (CLI, VS Code, coding agent) | yes | `.github/skills/` | yes | `.github/copilot-instructions.md` | `copilot` on PATH, `~/.copilot/` |
| OpenCode | yes | `.opencode/skills/` | yes | | `opencode` on PATH, `~/.config/opencode/` |
| Amp | yes | | yes | | `amp` on PATH, `~/.config/amp/` |
| Zed | yes — its only location | | yes | | `zed` on PATH, `~/.config/zed/` |
| Windsurf | yes | `.windsurf/skills/` | yes | `.windsurf/rules/` | `windsurf` on PATH, `~/.codeium/windsurf/` |
| Kilo Code | yes | `.kilo/skills/` | yes | | `kilo` on PATH, `~/.kilo/` |
| Kimi Code CLI | yes | `.kimi-code/skills/` | unverified | | `kimi` on PATH, `~/.kimi-code/` |
| Qwen Code | **no** | `.qwen/skills/` | **no** | `QWEN.md` | `qwen` on PATH, `~/.qwen/` |
| Kiro | **no** | `.kiro/skills/` | yes | `.kiro/steering/` | `kiro-cli` on PATH, `~/.kiro/` |
| TRAE | **no** | `.trae/skills/` | yes | `.trae/rules/project_rules.md` | `~/.trae/` |
| ZCode (Z.ai) | **no** | `.zcode/skills/` | unverified | | `zcode` on PATH, `~/.zcode/` |
| CodeBuddy (Tencent) | **no** | `.codebuddy/skills/` | unverified | | `codebuddy` on PATH, `~/.codebuddy/` |
| Qoder / Lingma (Alibaba) | changelog says yes; unverified | `.qoder/skills/` | unverified | | `qoder` on PATH, `~/.qoder/`, `~/.qoder-cn/`, `~/.lingma/` |
| iFlow CLI | unverified | `.iflow/skills/` ᴿ | **no** | `IFLOW.md` | `iflow` on PATH, `~/.iflow/` |
| MiniMax Code | unverified | `.minimax/skills/` ᴿ | unverified | | `~/.minimax/` |
| Cline | yes ᴿ | | yes | `.clinerules/` | `.clinerules/` in the repo |
| Roo Code | unverified | `.roo/skills/` ᴿ | yes | | `~/.roo/` |
| Factory Droid | yes ᴿ | | yes | | `droid` on PATH, `~/.factory/` |
| Goose | unverified | `.goose/skills/` ᴿ | yes | | `goose` on PATH, `~/.config/goose/` |
| Junie (JetBrains) | unverified | `.junie/skills/` ᴿ | yes | | `~/.junie/` |

ᴿ — path taken from the [`skills` CLI registry](https://github.com/vercel-labs/skills), not from the vendor's own docs. "Unverified" means neither source settles it. **Treat unverified as no** — a stub an agent ignores costs one directory; a missing stub costs the whole install for that agent.

Treat this table as a snapshot. Agents add `.agents/skills/` support regularly, and one that gained it since this was written just ends up with a harmless extra stub.

Only root-level instruction files (`CLAUDE.md`, `GEMINI.md`, `QWEN.md`, `IFLOW.md`) ever get a pointer file. Agents whose own file lives in a subdirectory — Copilot, Windsurf, Kiro, TRAE, Cline — all read `AGENTS.md` too, so they need no pointer.

---

## Unknown agents

Anything not in the table — including you, if you are the agent running this and don't see yourself above — answers three questions from its own documentation, which it knows better than this file does:

1. Which project-relative directory do you discover skills from, and does that include `.agents/skills/`?
2. Which instruction file do you read at the repo root, and does that include `AGENTS.md`?
3. What is your name, in lowercase, for the provenance stamp?

Use those answers exactly like a table row. If the user names an agent neither of you can answer for, install `.agents/skills/` and `AGENTS.md` only, and say so in the report.

---

## Detecting the agents in use

Three sources, merged. Existence checks only — **never read inside any of these directories**; several hold credentials.

**1. The agent running this runbook.** That is you. State which agent you are (Claude Code, Codex, Cursor, Gemini CLI, …) and include yourself. You are, by definition, in use here. If you are not in the table, answer the [Unknown agents](#unknown-agents) questions for yourself now.

**2. The machine.** Binaries on `PATH` catch CLIs; configuration directories under `$HOME` catch desktop apps and IDE integrations that install no binary — Claude Code's desktop app, Cursor, Windsurf, TRAE, Kiro.

```bash
for bin in claude codex cursor-agent cursor gemini copilot opencode amp zed windsurf kilo kimi qwen kiro-cli zcode codebuddy qoder iflow droid goose; do
  command -v "$bin" >/dev/null 2>&1 && echo "PATH: $bin"
done
for d in .claude .codex .cursor .gemini .copilot .config/opencode .config/amp .config/zed .codeium/windsurf .kilo .kimi-code .qwen .kiro .trae .zcode .codebuddy .qoder .qoder-cn .lingma .iflow .minimax .roo .factory .config/goose .junie; do
  [ -d "$HOME/$d" ] && echo "HOME: ~/$d"
done
```

**3. The repo.** An agent the repo is already configured for stays configured, whatever the machine says — a teammate may be the one using it.

```bash
for p in .claude .cursor .gemini .github/copilot-instructions.md .github/skills .opencode .windsurf .kilo .kimi-code .qwen .kiro .trae .zcode .codebuddy .qoder .iflow .minimax .roo .junie .clinerules CLAUDE.md GEMINI.md QWEN.md IFLOW.md; do
  [ -e "$p" ] && echo "REPO: $p"
done
```

Map every hit to a row of the table above. What happens with the list next — confirming it with the user and writing it down — belongs to whichever file sent you here.
