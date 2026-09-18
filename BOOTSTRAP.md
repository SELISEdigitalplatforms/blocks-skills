# BOOTSTRAP.md

**Runbook for vendoring the SELISE Blocks skills into another repository.**

Nobody develops application code in `blocks-skills`. This repo owns the agent **routing rules**; other repos consume them. This file is the procedure a coding agent follows to pull those rules and the skills they route to into a **target repo**, laid out so that **every coding agent the user actually works with** can find them — Claude Code, Codex, Cursor, Gemini CLI, Copilot, Qwen Code, Kimi, TRAE, ZCode, and the rest.

Invoke it from the target repo with a prompt like:

> Read `https://raw.githubusercontent.com/SELISEdigitalplatforms/blocks-skills/main/BOOTSTRAP.md` and follow it to bootstrap this repo.

That installs the files and stops. To continue straight into working on a project, say so — either with a project key in hand:

> Read `https://raw.githubusercontent.com/SELISEdigitalplatforms/blocks-skills/main/BOOTSTRAP.md` and follow it to bootstrap this repo, then get me set up on project `<x-blocks-key>` and show me what's already there.

or with nothing at all:

> Read `https://raw.githubusercontent.com/SELISEdigitalplatforms/blocks-skills/main/BOOTSTRAP.md` and follow it to bootstrap this repo, then help me sign in and get started — I'm new to Blocks.

Both of those run [Step 9](#step-9--get-to-work-only-if-asked) after the install. Neither asks the user for a URL; see that step for why there isn't one to ask for.

The agent executing this file does the work with its own shell and file tools. There is no installer to run and nothing to add to the target repo's dependencies.

---

## Two sources, one install

Rules and skills live in different repos. Both are read-only inputs here.

| What | Where | Path |
|---|---|---|
| Routing rules, hard rules, workflow | `SELISEdigitalplatforms/blocks-skills` | the region of `AGENTS.md` between the `blocks-skills:distributable` markers |
| Skill content (19 skills) | `SELISEdigitalplatforms/blocks-cli` | `blocks-skills/<skill>/` |

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

**One copy of the content, as many front doors as the agents in use need.** `.agents/skills/` is the cross-agent convention the [Agent Skills](https://agentskills.io) ecosystem settled on; Codex, Cursor, Gemini CLI, Copilot, OpenCode, Amp, Zed, Windsurf, Kilo Code and Kimi Code read it natively and need nothing else. An agent that only reads its own directory — Claude Code reads `.claude/skills/`, Qwen Code reads `.qwen/skills/` — gets a **pointer stub** there: identical frontmatter, so it routes identically, and a body that does nothing except send the agent to the `.agents` file. Content is never duplicated, so the copies cannot drift. `AGENTS.md` works the same way: most agents read it; the few that don't get a pointer file in the name they do read.

Which front doors get built is decided in [Step 0](#step-0--ask-before-writing) from what is actually in use — the agent running this runbook, the agents installed on the machine, the agents this repo is already configured for — and confirmed with the user. **Never install a front door for an agent nobody here uses.** A repo littered with a dozen `.<agent>/` directories is the failure this design exists to avoid.

Relative links inside a skill (`flows/x.md`, `../SKILL.md`) keep resolving because each skill directory is copied intact. No skill links outside its own directory.

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

### Unknown agents

Anything not in the table — including you, if you are the agent running this and don't see yourself above — answers three questions from its own documentation, which it knows better than this file does:

1. Which project-relative directory do you discover skills from, and does that include `.agents/skills/`?
2. Which instruction file do you read at the repo root, and does that include `AGENTS.md`?
3. What is your name, in lowercase, for the provenance stamp?

Use those answers exactly like a table row. If the user names an agent neither of you can answer for, install `.agents/skills/` and `AGENTS.md` only, and say so in the report.

---

## Inputs

| Input | Default | Notes |
|---|---|---|
| Target repo root | current working directory | Must be the repo being bootstrapped, not a source repo. |
| Rules repo / ref | `SELISEdigitalplatforms/blocks-skills` @ `main` | |
| Skills repo / ref | `SELISEdigitalplatforms/blocks-cli` @ `main` | Skills are under `blocks-skills/`. |
| Agents in use | detected in Step 0, confirmed by the user | Decides which front doors are built. |

Requires `git` and a writable target repo. Requires nothing from the `blocks` CLI — installing that is `blocks-bootstrap`'s job, later, and only with the user's consent.

---

## Step 0 — Ask before writing

Everything this step needs from the user is gathered in **one prompt**: the safety confirmations if any apply, the agent list, and the reporting question. Then the rest of the run is uninterrupted.

### Confirm it is safe to proceed

Stop and ask the user if any of these hold:

- The working directory is one of the source repos (this runbook installs *into other repos*).
- The target repo has uncommitted changes to `AGENTS.md`, `.agents/`, or any agent directory or instruction file this run will touch.
- `.agents/skills/.blocks-skills-source` already exists — this is a **re-run**; see [Updating](#updating-a-repo-that-was-already-bootstrapped).
- `.codex/skills/.blocks-skills-source` exists — this repo was bootstrapped by the **old layout**; see [Migrating](#migrating-from-the-old-codex-layout).
- `.agents/skills/` contains skill directories but there is **no** provenance stamp — something else authored them. See the collision guard in Step 4.

Otherwise proceed. Everything below is additive or marker-scoped; nothing outside the markers, `.agents/skills/`, and the chosen front doors is touched.

### Work out which agents are in use

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

Map every hit to a row of the agent table, then **show the user the list and ask them to confirm it** — add an agent the probes missed (a colleague's editor, a CI agent), drop one they no longer use. Say plainly what each agent on the list will get: nothing extra, a stub directory, a pointer file, or both. This is the one place the runbook guesses, so it is the one place the user must be able to correct it.

Write the confirmed result to three files for the steps below, one entry per line:

```bash
: > "$TMP/agents.txt"              # agent names, lowercase, e.g. claude-code / codex / qwen-code
: > "$TMP/skill-fronts.txt"        # own skills dirs for agents that do NOT read .agents/skills/, e.g. .claude/skills
: > "$TMP/instruction-fronts.txt"  # own instruction files for agents that do NOT read AGENTS.md, e.g. CLAUDE.md
```

(`$TMP` is created in Step 1; create it first if you run this step's shell before that one.) A repo where every agent in use reads `.agents/skills/` and `AGENTS.md` natively — a Codex-and-Cursor team, say — ends up with both front-door files empty and installs nothing beyond `.agents/skills/` and `AGENTS.md`. That is the ideal outcome, not a gap.

Only root-level instruction files (`CLAUDE.md`, `GEMINI.md`, `QWEN.md`, `IFLOW.md`) go in `instruction-fronts.txt`. Agents whose own file lives in a subdirectory — Copilot, Windsurf, Kiro, TRAE, Cline — all read `AGENTS.md` too, so they need no pointer.

### Ask about anonymous reporting

Every bootstrap asks this once, in the same prompt as the confirmations above:

> While working with Blocks, the agent will sometimes hit bugs, quirks, limitations, or things that took real effort to figure out. May it send those to the SELISE Blocks team as anonymous reports? A report never contains names, emails, tokens, secrets, or paths under your home directory — only what happened on the platform and how to reproduce it. You can change this at any time, and you can always ask for a one-off report whether or not you opt in.

Record the answer as `opt-in` or `opt-out` for Step 6. A clear yes is `opt-in`; anything else — a no, a "later", no answer — is `opt-out`. Never write `opt-in` on the user's behalf.

On a re-run, ask **only if** `.agents/skills/.blocks-reporting` is missing (a repo bootstrapped before the file existed). If it is present, read it, mention the current value in the Step 8 report, and leave it alone — changing it is the user's request to make, at any time, and takes one sentence (see **Report what you find** in the imported rules).

---

## Step 1 — Fetch both sources

```bash
TMP="${TMP:-$(mktemp -d)}"
RULES="$TMP/blocks-skills"; RULES_REF="main"
SKILLS="$TMP/blocks-cli";   SKILLS_REF="main"

git clone --depth 1 --branch "$RULES_REF" \
  https://github.com/SELISEdigitalplatforms/blocks-skills.git "$RULES"
git clone --depth 1 --branch "$SKILLS_REF" --filter=blob:none \
  https://github.com/SELISEdigitalplatforms/blocks-cli.git "$SKILLS"

git -C "$RULES" rev-parse HEAD
git -C "$SKILLS" rev-parse HEAD
```

Verify both exist before continuing — `$RULES/AGENTS.md` and `$SKILLS/blocks-skills/`. (`$RULES/CLAUDE.md` is not an input; every pointer file is generated in Step 3.) Also confirm `$RULES/AGENTS.md` contains both `blocks-skills:distributable` markers. If anything is missing, **stop and report it**; do not improvise a partial install.

---

## Step 2 — Resolve the skill list from the distributable region

**The routing table is the manifest.** Copy the skills it names — no more, no less. Read names from *inside* the distributable region only, so source-only prose can never inject a name:

```bash
awk '/blocks-skills:distributable:start/,/blocks-skills:distributable:end/' "$RULES/AGENTS.md" \
  | grep -oE '`blocks-[a-z0-9-]+`' | tr -d '`' | sort -u > "$TMP/manifest.txt"
ls -d "$SKILLS"/blocks-skills/*/ | xargs -n1 basename | sort > "$TMP/available.txt"
comm -12 "$TMP/manifest.txt" "$TMP/available.txt" > "$TMP/install.txt"   # install these
comm -23 "$TMP/manifest.txt" "$TMP/available.txt"                        # named, no source directory
comm -13 "$TMP/manifest.txt" "$TMP/available.txt"                        # source directory, unrouted
```

- **In both** → install it (Steps 4–5).
- **Named, no directory** → do not fabricate one. Collect it for the final report.
- **Directory, not named** → skip it. Collect it for the final report. (Non-directory entries such as `lint.mjs` are tooling, not skills, and are excluded by construction.)

Both mismatch lists go in the report to the user. A silent skip reads as "everything installed" when it didn't.

Sanity-check the count before continuing: `wc -l < "$TMP/install.txt"` should equal the number of skills in the routing table.

---

## Step 3 — Import the rules into AGENTS.md, and point the other instruction files at it

Import **only** the distributable region — never the whole file. Everything outside those markers is source-repo-only: skill-authoring conventions, notes about where skill sources live, statements about a particular checkout. None of it is true in a consumer repo, and some of it goes stale the moment it is copied.

```bash
awk '/blocks-skills:distributable:start/{f=1;next} /blocks-skills:distributable:end/{f=0} f' \
  "$RULES/AGENTS.md" > "$TMP/agents-block.md"
```

The imported region says skills are vendored files but not *where* this repo put them, so **prepend this scoping header** to the block before writing it:

```markdown
## SELISE Blocks

These rules govern Blocks work in this repo. Skills are vendored at `.agents/skills/<name>/SKILL.md`;
an agent that does not read that directory finds the same set through a pointer stub in its own skills
directory. Read the `.agents` copy directly; there is no CLI command that serves a skill. Re-vendor
with BOOTSTRAP.md.
```

Imported content always lives between markers, so re-runs are a block replacement instead of a merge conflict:

```
<!-- blocks-skills:start -->
...header + imported region...
<!-- blocks-skills:end -->
```

For `AGENTS.md`:

| Target state | Action |
|---|---|
| File absent | Create it containing the marker block. |
| File exists, markers present | Replace **only** what is between the markers. Leave the rest byte-for-byte alone. |
| File exists, no markers | **Never overwrite.** Append the marker block at the end, then tell the user what was appended and where. If the existing file's instructions contradict the imported ones, surface the conflict — do not resolve it silently. |

### Pointer files are generated, not copied

For each file in `instruction-fronts.txt` — `CLAUDE.md`, `GEMINI.md`, `QWEN.md`, `IFLOW.md`, whichever apply — write this block, **not** a copy of anything from the source repo. This repo's own `CLAUDE.md` says the file is "a pointer and nothing more" and forbids guidance that isn't in `AGENTS.md`; true here, false in a target that has its own instructions, and it would contradict whatever is already in the file.

```markdown
## SELISE Blocks

For Blocks work in this repo, read [AGENTS.md](./AGENTS.md) and follow the Blocks section there.

This block scopes Blocks rules only; it says nothing about the rest of this file. Keep Blocks
guidance in `AGENTS.md` rather than duplicating it here — a second copy will drift.
```

The same three-state table applies to each: create the file around this block, replace it between existing markers, or append it and report. It never claims authority over the target's other instructions. An empty `instruction-fronts.txt` means no pointer file is written at all.

---

## Step 4 — Copy the skills into `.agents/skills/`

### Collision guard — run this first

Steps 4 and 5 replace directories wholesale. Before removing anything, prove nothing local is being destroyed:

```bash
git check-ignore -q .agents/skills && echo "WARNING: .agents/skills is git-ignored — changes are invisible to git"
git status --porcelain --ignored -- .agents $(cat "$TMP/skill-fronts.txt")
```

Then, for each skill about to be installed, check `.agents/skills/<s>` **and** every `<front>/<s>` in `skill-fronts.txt`. Step 5 overwrites stubs just as wholesale as Step 4 overwrites content, so a hand-written stub is exactly as losable as a hand-edited skill.

| Situation | Action |
|---|---|
| No destination exists | Fresh install. Proceed. |
| No provenance stamp, but any destination exists | Authored by something other than this runbook. **Stop and ask.** Never `rm -rf` or overwrite it on your own authority. |
| Stamp present, every destination matches what the stamp implies | Safe. Replace them all. |
| Stamp present, any destination differs | Locally customized. **List the changed files and ask** before replacing. Offer to save the local version aside. |
| A stub in a front dir the stamp's `skill_fronts` does not name | Foreign — another tool or a person put it there. **Stop and ask.** |

"Matches what the stamp implies" means:

- **`.agents/skills/<s>`** — identical to that directory at `skills_commit`. Check the stamped commit out into a temp dir and `diff -r` against it.
- **`<front>/<s>/SKILL.md`** — byte-identical to the stub Step 5 would regenerate from the **currently installed** `.agents/skills/<s>/SKILL.md`. Generate it to a temp file and `diff`. Run this check *before* Step 4 replaces the content copy, or the comparison is against the wrong source.

Never delete a path outside `.agents/skills/<installed-skill-name>` or `<front>/<installed-skill-name>` for a front the stamp names — no globs that could reach wider.

### Then copy

```bash
mkdir -p .agents/skills
while IFS= read -r s; do
  [ -n "$s" ] || continue
  rm -rf ".agents/skills/$s"         # cleared by the guard above; replace, never merge
  cp -R "$SKILLS/blocks-skills/$s" ".agents/skills/$s"
  [ -d ".agents/skills/$s/scripts" ] && chmod +x ".agents/skills/$s"/scripts/* 2>/dev/null
done < "$TMP/install.txt"
```

`chmod` runs inside the loop, against the skill just copied. A bare `.agents/skills/*/scripts/*` glob would also re-mark scripts belonging to skills this run never touched.

Copy the **entire** directory — `SKILL.md` plus whatever else the skill ships (today, three skills ship a `flows/` directory and the rest are a single file). Replace, don't merge: a half-old/half-new skill directory is worse than either version.

---

## Step 5 — Generate the front-door stubs

For each front dir in `skill-fronts.txt` and each installed skill, write `<front>/<skill>/SKILL.md`:

```markdown
---
name: <skill>
description: <copied verbatim from .agents/skills/<skill>/SKILL.md>
---

# <skill>

This skill's content lives at [`.agents/skills/<skill>/SKILL.md`](<ups>.agents/skills/<skill>/SKILL.md).

**Read that file now and follow it.** Its relative links (`flows/`, sibling files) resolve from that directory, not this one.

This stub exists so this agent discovers the skill. It holds no guidance of its own and must never be given any — the `.agents` copy is the single source of truth, and a second copy would drift.
```

The frontmatter is what routes a request, so it must be **verbatim**: copy the whole block between the first and second `---` of the source `SKILL.md`. Do not re-word, truncate, or re-wrap the description — some run to several hundred characters by design, and shortening one makes the skill stop triggering.

```bash
while IFS= read -r front; do
  [ -n "$front" ] || continue
  # walk from <front>/<skill>/ back up to the repo root: one "../" per path segment, plus one for <skill>
  ups=""; n=$(( $(printf '%s' "$front" | tr -cd '/' | wc -c) + 2 ))
  i=0; while [ "$i" -lt "$n" ]; do ups="../$ups"; i=$((i+1)); done
  while IFS= read -r s; do
    [ -n "$s" ] || continue
    mkdir -p "$front/$s"
    {
      awk 'NR==1 && $0=="---" {print; next} /^---$/ {print; exit} {print}' ".agents/skills/$s/SKILL.md"
      printf '\n# %s\n\nThis skill'"'"'s content lives at [`.agents/skills/%s/SKILL.md`](%s.agents/skills/%s/SKILL.md).\n\n**Read that file now and follow it.** Its relative links (`flows/`, sibling files) resolve from that directory, not this one.\n\nThis stub exists so this agent discovers the skill. It holds no guidance of its own and must never be given any — the `.agents` copy is the single source of truth, and a second copy would drift.\n' "$s" "$s" "$ups" "$s"
    } > "$front/$s/SKILL.md"
  done < "$TMP/install.txt"
done < "$TMP/skill-fronts.txt"
```

Read both lists from files, not from unquoted variables — `for s in $LIST` silently collapses to a single item in zsh, which is the default shell on macOS.

The `ups` count is computed, not hard-coded: `.claude/skills/<skill>/` is three levels below the root, so it gets `../../../`; a deeper front such as `.tabnine/agent/skills/` gets four. An empty `skill-fronts.txt` means this step writes nothing.

---

## Step 6 — Stamp provenance

```bash
cat > .agents/skills/.blocks-skills-source <<STAMP
rules_repo=https://github.com/SELISEdigitalplatforms/blocks-skills.git
rules_ref=$RULES_REF
rules_commit=$(git -C "$RULES" rev-parse HEAD)
skills_repo=https://github.com/SELISEdigitalplatforms/blocks-cli.git
skills_ref=$SKILLS_REF
skills_commit=$(git -C "$SKILLS" rev-parse HEAD)
skills=$(tr '\n' ' ' < "$TMP/install.txt")
agents=$(tr '\n' ' ' < "$TMP/agents.txt")
skill_fronts=$(tr '\n' ' ' < "$TMP/skill-fronts.txt")
instruction_fronts=$(tr '\n' ' ' < "$TMP/instruction-fronts.txt")
STAMP
```

Both commits are required — Step 4's collision guard and the update path depend on `skills_commit`. The three front-door lines are what lets a re-run know **which** stub directories and pointer files this runbook owns, so it never touches an agent directory it didn't create.

No timestamp, no author, and **no mention of which AI tool ran this** — a hard rule inherited from `AGENTS.md` that applies to the target repo too, including commit messages. The `agents=` line names tools the repo is set up for, which is configuration, not attribution.

### Record the reporting choice

Write the answer from Step 0 to its own file, next to the stamp. It is deliberately not a line in the stamp: the stamp is regenerated on every run, while this choice must survive re-runs untouched.

```bash
REPORTING="opt-out"   # or opt-in — the literal answer from Step 0
[ -f .agents/skills/.blocks-reporting ] || printf 'reporting=%s\n' "$REPORTING" > .agents/skills/.blocks-reporting
```

The `[ -f ]` guard is what keeps an earlier choice across re-runs. The file holds exactly one line, `reporting=opt-in` or `reporting=opt-out`, and it is the whole preference — the imported rules in `AGENTS.md` read it before any report is sent, and rewrite it when the user asks to switch.

---

## Step 7 — Verify

Run these and confirm each; report any failure rather than declaring success.

```bash
# every front dir lists exactly the installed skills, and every stub's target exists
while IFS= read -r front; do
  [ -n "$front" ] || continue
  diff <(ls .agents/skills | grep -v '^\.') <(ls "$front") || echo "FRONT MISMATCH: $front"
  for f in "$front"/*/SKILL.md; do
    s=$(basename "$(dirname "$f")")
    test -f ".agents/skills/$s/SKILL.md" || echo "BROKEN POINTER: $front/$s"
    grep -q "^name: $s\$" "$f" || echo "FRONTMATTER LOST: $front/$s"
  done
done < "$TMP/skill-fronts.txt"

# markers: exactly one start AND one end in AGENTS.md and every pointer file — an unpaired or
# duplicated end marker makes the next run's block replacement overwrite the wrong range
for f in AGENTS.md $(cat "$TMP/instruction-fronts.txt"); do
  st=$(grep -c 'blocks-skills:start' "$f"); en=$(grep -c 'blocks-skills:end' "$f")
  [ "$st" = 1 ] && [ "$en" = 1 ] || echo "MARKER ERROR in $f: start=$st end=$en (want 1/1)"
  grep -n 'blocks-skills:start\|blocks-skills:end' "$f" | head -2   # start must precede end
done

# no source-only marker leaked into the target
grep -c 'blocks-skills:distributable' AGENTS.md    # must be 0

# reporting choice recorded, with one of the two accepted values
grep -qxE 'reporting=(opt-in|opt-out)' .agents/skills/.blocks-reporting || echo "REPORTING CHOICE MISSING OR INVALID"

# the stamp names every front door that exists on disk, and nothing that doesn't
grep -E '^(skill_fronts|instruction_fronts)=' .agents/skills/.blocks-skills-source
```

Then spot-check one skill by hand from the running agent's own front door: open the stub (or the `.agents` file directly, if you read that natively), follow its link, and confirm a `flows/` link inside the `.agents` copy resolves.

---

## Step 8 — Report

Tell the user, plainly:

- Skills installed (count + names).
- Skills named in the routing table with no source directory, and source directories not named in it.
- Which agents the install is set up for, and what each got: nothing beyond `.agents/skills/` + `AGENTS.md`, a stub directory, a pointer file, or both. Name any agent that was installed on best-effort terms because its behavior is unverified.
- Whether `AGENTS.md` and each pointer file were created, block-replaced, or **appended to an existing file** — and if appended, any contradiction with what was already there.
- Anything the collision guard flagged, and what you did about it.
- The anonymous-reporting choice recorded (`opt-in` or `opt-out`), that it lives in `.agents/skills/.blocks-reporting`, and that they can flip it or ask for a one-off report at any time by just saying so.
- Both source refs and commits.
- That nothing was committed. Leave the commit to the user unless they asked for one.
- If Step 9 was not requested, say the install is complete and that they can start work by giving you a project key ("get me set up on project `<x-blocks-key>`") or by asking to be signed in from scratch.

---

## Step 9 — Get to work (only if asked)

Steps 0–8 are a file copy and stop there. Run this step **only** when the user asked to continue into project work — by supplying an `x-blocks-key`, or by asking to be signed in, set up, or shown around.

This step does not reimplement bootstrap. The skill you just installed owns that flow: read `.agents/skills/blocks-bootstrap/SKILL.md` and follow it. What is below is only the entry point — which branch to enter on, and what to show at the end.

**The user never supplies a URL.** The CLI's endpoints are built in and self-correcting. The only URL you ever mention is the **portal**, `https://os.seliseblocks.com`, and only for what the CLI genuinely cannot do: **create an account**, and add further environments to a project that already exists. Creating the project itself is no longer portal-only — `blocks projects create` does it. Never ask "what's your Blocks OS URL" — there isn't one to ask for.

### Prerequisite — the CLI

Run `blocks --version`. If it's missing, **ask before installing** (`npm install -g @seliseblocks/cli-os@latest`) — never install it unprompted. If the user declines, stop and report; nothing past here works without it.

### Branch A — the user supplied an `x-blocks-key`

1. `blocks auth status --json`. If not logged in, run `blocks login` **yourself** — it's a device-code flow, so read back the verification URL and user code it prints so the user can approve. Re-run `blocks auth status --json` to confirm rather than assuming it worked.
2. `blocks use <x-blocks-key>` — the key *is* the project tenant id, so it's the literal argument.
3. If selection fails, don't guess at the key. Run `blocks projects list --json` and show what the account can actually reach; the usual cause is a key belonging to a different account, or a typo.
4. Continue to **The brief**.

### Branch B — greenfield: no key, unknown state

1. `blocks auth status --json`.
2. **No account yet?** Signing up is the one thing the CLI can't do. Send them to `https://os.seliseblocks.com` to create an account and wait — don't proceed on the assumption it worked.
3. `blocks login` (device-code, as above).
4. `blocks projects list --json`. Show the full list; never silently adopt a prior session's selection.
   - **Empty?** Create one with the CLI — `blocks projects create "<name>"`. Ask for a name (3–100 characters) and get explicit consent before running it: the call **accepts the Blocks terms on the user's behalf** (`isAcceptBlocksTerms`, `isUseBlocksExclusively`), which is not yours to accept silently. Run `blocks help projects create --json`, then `--dry-run --json`; use `--yes` only after approval. It creates exactly one app in the `dev` environment, and the platform replaces the placeholder domain with the assigned domain. It does not select the project, so continue to step 5. Add further environments from the portal (`https://os.seliseblocks.com`); there is no CLI path for that.
   - **One or more?** Ask which project, and which environment. Don't pick for them.
5. `blocks use <x-blocks-key>` with the chosen project's key.
6. Continue to **The brief**.

### The brief

Before asking what to build, show what's already there. All read-only:

```bash
blocks projects list --json                 # selected project + everything else reachable
blocks auth oidc-clients list --json        # is the app's browser client registered?
blocks auth config get --json               # isOidcEnabled
blocks data schema list --json              # what is already modelled
blocks localization language list --json    # which languages exist
```

Summarize it plainly: project name, key, and app domain; how many other projects the account can reach; whether login is actually wired up (`isOidcEnabled`, plus whether a public OIDC client exists); the existing schemas; the configured languages. Then ask what they want to build.

Two failures this prevents: proposing a schema that already exists, and scaffolding an app whose login silently cannot work because `isOidcEnabled` is `false`.

If one of these commands fails, report that line as unavailable and continue — a missing schema list is no reason to abandon the summary. `data schema list` failing usually just means no data source is configured yet, which is itself worth saying.

### Then hand off

Route the user's answer through the routing table in the `AGENTS.md` you just installed. Don't re-derive any flow here — the skills own it.

---

## Updating a repo that was already bootstrapped

Re-running this runbook is the update path. It is idempotent by construction:

1. Read `.agents/skills/.blocks-skills-source` and report each old commit vs. the new one.
2. Step 0 re-detects agents, **starting from the stamp's `agents=` line** — an agent already set up stays set up unless the user drops it. Show the user any newcomer the probes found.
3. The Step 4 guard catches any skill or stub edited locally since the last run, before anything is removed.
4. Steps 4–5 replace each skill directory and regenerate each stub wholesale.
5. Step 3 replaces only the marker blocks, so target-repo instructions written outside the markers survive.
6. The reporting choice in `.agents/skills/.blocks-reporting` is kept as it is and the question is not asked again. It is asked only when the file is missing.

What re-running does **not** do:

- Remove a skill dropped from the routing table. Report those as stale and let the user decide — a repo may still depend on one.
- Remove a front door for an agent the user dropped from the list. Report the stub directory and pointer file as stale and let the user delete them — they may be the only thing left in that agent's directory, or not.

### Migrating from the old `.codex` layout

Earlier versions of this runbook put the content at `.codex/skills/` with Claude Code stubs at `.claude/skills/`, and nothing else. Codex never read a repo-level `.codex/skills/` — its project location is `.agents/skills/` — so that layout served exactly one agent. A repo with `.codex/skills/.blocks-skills-source` is on it. On such a repo:

1. Treat it as a re-run: read the old stamp for `skills_commit` and the skill list.
2. Run the Step 4 collision guard against the **old** locations — `.codex/skills/<s>` against the stamped commit, and `.claude/skills/<s>/SKILL.md` against a stub generated with `.codex/skills` as the content root, since that is what the old stubs point at.
3. Move the two dotfiles, then delete only what the old stamp names:

   ```bash
   mkdir -p .agents/skills
   git mv .codex/skills/.blocks-skills-source .agents/skills/.blocks-skills-source 2>/dev/null \
     || mv .codex/skills/.blocks-skills-source .agents/skills/.blocks-skills-source
   [ -f .codex/skills/.blocks-reporting ] && { git mv .codex/skills/.blocks-reporting .agents/skills/.blocks-reporting 2>/dev/null \
     || mv .codex/skills/.blocks-reporting .agents/skills/.blocks-reporting; }
   for s in $(sed -n 's/^skills=//p' .agents/skills/.blocks-skills-source); do rm -rf ".codex/skills/$s"; done
   rmdir .codex/skills .codex 2>/dev/null   # only if empty — anything else in there is not ours
   ```

4. Continue from Step 0's agent detection as normal. Claude Code will be on the list (the old layout proves it was in use), so `.claude/skills/` is regenerated in Step 5, now pointing at `.agents`.
5. Say in the report that the layout moved, and why.

---

## Rules for the agent running this

- **Steps 0–8 are a file copy — don't install the `blocks` CLI or log anything in during them.** Runtime setup happens only in Step 9, only when the user asked for it, and installing the CLI still needs their consent. The flow itself belongs to `blocks-bootstrap`; Step 9 only enters it.
- **Front doors follow the agents in use, never the table.** Detect, show the user, let them correct it, then build for that list only. Installing every directory the table knows about is wrong even if it would work.
- **Existence checks only** when detecting agents. Never open, list, or print anything inside `~/.claude`, `~/.codex`, `~/.gemini`, or any other agent's home directory — several hold tokens.
- **Never ask the user for a Blocks OS or API URL.** The CLI's endpoints are built in. The portal (`https://os.seliseblocks.com`) is the only URL you ever name, and only for account creation or adding an environment to an existing project.
- **Don't edit skill content while copying.** No rewriting for the target repo's stack, no trimming. Skills are verified against the live platform; an edited copy is unverified.
- **Don't import anything outside the distributable markers.**
- **Ask the reporting question once and record exactly what was answered.** Never write `opt-in` without a clear yes, and never send a report on your own authority under `opt-out`. What a report may and may not contain is set by **Report what you find** in the imported rules, and that applies to this run too.
- **Don't commit or push** unless the user asks.
- **Don't attribute the work to an AI tool** anywhere — files, comments, or commit messages.
- **Stop and ask** on anything ambiguous: an existing unmarked `AGENTS.md` that contradicts the import, a skill directory with no provenance, a stub in a directory the stamp doesn't name, a target that isn't a git repo, a manifest that doesn't match the source tree.
