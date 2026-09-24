# BOOTSTRAP.md

**Runbook for vendoring the SELISE Blocks skills into another repository.**

Nobody develops application code in `blocks-skills`. This repo owns the agent **routing rules**; other repos consume them. This runbook is the procedure a coding agent follows to pull those rules and the skills they route to into a **target repo**, laid out so that **every coding agent the user actually works with** can find them — Claude Code, Codex, Cursor, Gemini CLI, Copilot, Qwen Code, Kimi, TRAE, ZCode, and the rest.

Invoke it from the target repo with a prompt like:

> Read `https://raw.githubusercontent.com/SELISEdigitalplatforms/blocks-skills/main/BOOTSTRAP.md` and follow it to bootstrap this repo.

That installs the files and stops. To continue straight into working on a project, say so — either with a project key in hand:

> Read `https://raw.githubusercontent.com/SELISEdigitalplatforms/blocks-skills/main/BOOTSTRAP.md` and follow it to bootstrap this repo, then get me set up on project `<x-blocks-key>` and show me what's already there.

or with nothing at all:

> Read `https://raw.githubusercontent.com/SELISEdigitalplatforms/blocks-skills/main/BOOTSTRAP.md` and follow it to bootstrap this repo, then help me sign in and get started — I'm new to Blocks.

Both of those run [Step 9](bootstrap/step-9-get-to-work.md) after the install. Neither asks the user for a URL; see that step for why there isn't one to ask for. The same entry point handles a repo that is already bootstrapped — "follow it to update the Blocks skills in this repo", "…to set Blocks up for Gemini too".

The agent executing this runbook does the work with its own shell and file tools. There is no installer to run and nothing to add to the target repo's dependencies.

**This file is the map; the procedure lives in [`bootstrap/`](bootstrap/).** Read [Get the runbook files](#get-the-runbook-files), then [Pick your task](#pick-your-task) to see which of those files your job needs.

---

## Two sources, one install

Rules and skills live in different repos. Both are read-only inputs here.

| What | Where | Path |
|---|---|---|
| Routing rules, hard rules, workflow | `SELISEdigitalplatforms/blocks-skills` | the region of `AGENTS.md` between the `blocks-skills:distributable` markers |
| Skill content (21 skills) | `SELISEdigitalplatforms/blocks-cli` | `blocks-skills/<skill>/` |

`blocks-skills` has **no `skills/` directory** — the older raw-HTTP generation that lived there is removed. Do not look for one, and do not fall back to an older commit that still has it.

---

## What gets installed

```
<target-repo>/
  AGENTS.md                                  # distributable rules, imported between markers
  .agents/skills/<skill>/                    # THE SOURCE OF TRUTH — full skill content
      SKILL.md
      flows/*.md                             # only the skills that ship flows
  .agents/skills/.blocks-skills-source       # provenance: repos, refs, commits, skill list, front doors
  .agents/skills/.blocks-reporting           # the user's anonymous-reporting choice: opt-in or opt-out

  # one per agent IN USE HERE that does not read .agents/skills/ — never for agents nobody uses:
  .claude/skills/<skill>/SKILL.md            # pointer stub -> the .agents copy        (Claude Code)
  .qwen/skills/<skill>/SKILL.md              # same, for Qwen Code — see the agent table for the rest

  # one per agent IN USE HERE that does not read AGENTS.md:
  CLAUDE.md                                  # generated pointer block, between markers (Claude Code)
  GEMINI.md                                  # same, for Gemini CLI — see the agent table for the rest
```

**One copy of the content, as many front doors as the agents in use need.** `.agents/skills/` is the cross-agent convention the [Agent Skills](https://agentskills.io) ecosystem settled on; Codex, Cursor, Gemini CLI, Copilot, OpenCode, Amp, Zed, Windsurf, Kilo Code and Kimi Code read it natively and need nothing else. An agent that only reads its own directory — Claude Code reads `.claude/skills/`, Qwen Code reads `.qwen/skills/` — gets a **pointer stub** there: identical frontmatter, so it routes identically, and a body that does nothing except send the agent to the `.agents` file. Content is never duplicated, so the copies cannot drift. `AGENTS.md` works the same way: most agents read it; the few that don't get a pointer file in the name they do read. Who reads what is in [the agent table](bootstrap/agents.md).

Which front doors get built is decided in [Step 0](bootstrap/step-0-ask.md) from what is actually in use — the agent running this runbook, the agents installed on the machine, the agents this repo is already configured for — and confirmed with the user. **Never install a front door for an agent nobody here uses.** A repo littered with a dozen `.<agent>/` directories is the failure this design exists to avoid.

Relative links inside a skill (`flows/x.md`, `../SKILL.md`) keep resolving because each skill directory is copied intact. No skill links outside its own directory.

---

## Inputs

| Input | Default | Notes |
|---|---|---|
| Target repo root | current working directory | Must be the repo being bootstrapped, not a source repo. |
| Rules repo / ref | `SELISEdigitalplatforms/blocks-skills` @ `main` | Also where the `bootstrap/` files come from. |
| Skills repo / ref | `SELISEdigitalplatforms/blocks-cli` @ `main` | Skills are under `blocks-skills/`. |
| Agents in use | detected in Step 0, confirmed by the user | Decides which front doors are built. |

Requires `git` and a writable target repo. Requires nothing from the `blocks` CLI — installing that is `blocks-bootstrap`'s job, later, and only with the user's consent.

---

## Get the runbook files

Whatever the task, do this first. The files under `bootstrap/` are read from a local clone of this repo rather than fetched one URL at a time, so every one of them comes from the same commit as the rules being installed.

```bash
TMP="$(mktemp -d)"
RULES="$TMP/blocks-skills"; RULES_REF="main"

git clone --depth 1 --branch "$RULES_REF" \
  https://github.com/SELISEdigitalplatforms/blocks-skills.git "$RULES"
ls "$RULES/bootstrap"
```

From here on, every `bootstrap/<file>` link means **`$RULES/bootstrap/<file>`** — read it from the clone. The clone goes to a temp directory and writes nothing to the target repo, so it is safe before Step 0's confirmations. Keep `$TMP` for the whole run; later steps write their working lists there.

If the clone fails or `$RULES/bootstrap/` is missing, **stop and report it**. Do not reconstruct a step from memory or from this file's summaries.

---

## Pick your task

Match what the user asked for to **one** row and read the listed files in order. Read nothing else unless a file sends you there. If the request is unclear, look at the target repo: `.agents/skills/.blocks-skills-source` means it is already bootstrapped; `.codex/skills/.blocks-skills-source` means it is on the old layout.

| The user wants to… | Read, in order |
|---|---|
| Bootstrap a repo for the first time | [The full install](#the-full-install), Steps 0–8 |
| Bootstrap, then start working on a project | The full install, then [step-9-get-to-work.md](bootstrap/step-9-get-to-work.md) |
| Update an existing install to the latest skills and rules | [update.md](bootstrap/update.md), then the full install from Step 0 |
| Pick up a new skill, or changed skill content | Same as updating — there is no skills-only path; [update.md](bootstrap/update.md) says why |
| Set Blocks up for another agent, or drop one | [front-doors.md](bootstrap/front-doors.md) (uses [agents.md](bootstrap/agents.md) and parts of Steps 3, 5, 6, 7) |
| Move a repo off the old `.codex/skills/` layout | [migrate-codex.md](bootstrap/migrate-codex.md), which continues into the full install |
| Check that an existing install is intact | [step-6-stamp.md → Reading an existing stamp](bootstrap/step-6-stamp.md#reading-an-existing-stamp), then [step-7-verify.md](bootstrap/step-7-verify.md) |
| Sign in, pick a project, or get shown around in a repo that is already bootstrapped | [step-9-get-to-work.md](bootstrap/step-9-get-to-work.md) only |
| Turn anonymous reporting on or off | No runbook file. The imported rules cover it (**Report what you find** in the target's `AGENTS.md`): rewrite `.agents/skills/.blocks-reporting`. If that file is missing, ask the question from [Step 0](bootstrap/step-0-ask.md#ask-about-anonymous-reporting) and write it as in [Step 6](bootstrap/step-6-stamp.md#record-the-reporting-choice). |

---

## The full install

Steps 0–8 always run, in order. Read each file in full before running any of its commands, and don't skip one because its title looks irrelevant to the repo — each carries a check a later step depends on.

| Step | File | What it does |
|---|---|---|
| 0 | [step-0-ask.md](bootstrap/step-0-ask.md) | One prompt to the user: safety confirmations, which agents are in use (with [agents.md](bootstrap/agents.md)), anonymous reporting |
| 1 | [step-1-fetch.md](bootstrap/step-1-fetch.md) | Clone the skills repo; verify both sources |
| 2 | [step-2-manifest.md](bootstrap/step-2-manifest.md) | Resolve the skill list from the routing table |
| 3 | [step-3-rules.md](bootstrap/step-3-rules.md) | Import the rules into `AGENTS.md`; write pointer files for agents that don't read it |
| 4 | [step-4-skills.md](bootstrap/step-4-skills.md) | Collision guard, then copy the skills into `.agents/skills/` |
| 5 | [step-5-stubs.md](bootstrap/step-5-stubs.md) | Generate the front-door stubs |
| 6 | [step-6-stamp.md](bootstrap/step-6-stamp.md) | Stamp provenance; record the reporting choice |
| 7 | [step-7-verify.md](bootstrap/step-7-verify.md) | Verify |
| 8 | [step-8-report.md](bootstrap/step-8-report.md) | Report to the user |
| 9 | [step-9-get-to-work.md](bootstrap/step-9-get-to-work.md) | **Only if asked:** sign in, select a project, show what's there |

Read only when a step sends you there: [agents.md](bootstrap/agents.md) (Step 0), [update.md](bootstrap/update.md) (a re-run), [migrate-codex.md](bootstrap/migrate-codex.md) (the old layout).

---

## Rules for the agent running this

These hold for every task above, whichever files it reads.

- **Steps 0–8 are a file copy — don't install the `blocks` CLI or log anything in during them.** Runtime setup happens only in Step 9, only when the user asked for it, and installing the CLI still needs their consent. The flow itself belongs to `blocks-bootstrap`; Step 9 only enters it.
- **Read the files your task names, from the clone, in full.** Don't work from memory of an earlier version of this runbook, and don't skip a step's file.
- **Front doors follow the agents in use, never the table.** Detect, show the user, let them correct it, then build for that list only. Installing every directory the table knows about is wrong even if it would work.
- **Existence checks only** when detecting agents. Never open, list, or print anything inside `~/.claude`, `~/.codex`, `~/.gemini`, or any other agent's home directory — several hold tokens.
- **Never ask the user for a Blocks OS or API URL.** The CLI's endpoints are built in. The portal (`https://os.seliseblocks.com`) is the only URL you ever name, and only for account creation or adding an environment to an existing project.
- **Don't edit skill content while copying.** No rewriting for the target repo's stack, no trimming. Skills are verified against the live platform; an edited copy is unverified.
- **Don't import anything outside the distributable markers.**
- **Ask the reporting question once and record exactly what was answered.** Never write `opt-in` without a clear yes, and never send a report on your own authority under `opt-out`. What a report may and may not contain is set by **Report what you find** in the imported rules, and that applies to this run too.
- **Don't commit or push** unless the user asks.
- **Don't attribute the work to an AI tool** anywhere — files, comments, or commit messages.
- **Stop and ask** on anything ambiguous: an existing unmarked `AGENTS.md` that contradicts the import, a skill directory with no provenance, a stub in a directory the stamp doesn't name, a target that isn't a git repo, a manifest that doesn't match the source tree.
