# Step 0 — Ask before writing

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. Next: [Step 1](step-1-fetch.md).

Everything this step needs from the user is gathered in **one prompt**: the safety confirmations if any apply, the agent list, and the reporting question. Then the rest of the run is uninterrupted.

## Confirm it is safe to proceed

Stop and ask the user if any of these hold:

- The working directory is one of the source repos (this runbook installs *into other repos*).
- The target repo has uncommitted changes to `AGENTS.md`, `.agents/`, or any agent directory or instruction file this run will touch.
- `.agents/skills/.blocks-skills-source` already exists — this is a **re-run**; see [update.md](update.md).
- `.codex/skills/.blocks-skills-source` exists — this repo was bootstrapped by the **old layout**; see [migrate-codex.md](migrate-codex.md).
- `.agents/skills/` contains skill directories but there is **no** provenance stamp — something else authored them. See the collision guard in [Step 4](step-4-skills.md).

Otherwise proceed. Everything below is additive or marker-scoped; nothing outside the markers, `.agents/skills/`, and the chosen front doors is touched.

## Work out which agents are in use

Read [agents.md](agents.md) and run its **Detecting the agents in use** probes. On a re-run, start from the stamp's `agents=` line — an agent already set up stays set up unless the user drops it.

Then **show the user the list and ask them to confirm it** — add an agent the probes missed (a colleague's editor, a CI agent), drop one they no longer use. Say plainly what each agent on the list will get: nothing extra, a stub directory, a pointer file, or both. This is the one place the runbook guesses, so it is the one place the user must be able to correct it.

Write the confirmed result to three files for the steps below, one entry per line:

```bash
: > "$TMP/agents.txt"              # agent names, lowercase, e.g. claude-code / codex / qwen-code
: > "$TMP/skill-fronts.txt"        # own skills dirs for agents that do NOT read .agents/skills/, e.g. .claude/skills
: > "$TMP/instruction-fronts.txt"  # own instruction files for agents that do NOT read AGENTS.md, e.g. CLAUDE.md
```

`$TMP` is the directory created under **Get the runbook files** in [BOOTSTRAP.md](../BOOTSTRAP.md). A repo where every agent in use reads `.agents/skills/` and `AGENTS.md` natively — a Codex-and-Cursor team, say — ends up with both front-door files empty and installs nothing beyond `.agents/skills/` and `AGENTS.md`. That is the ideal outcome, not a gap.

Only root-level instruction files go in `instruction-fronts.txt`; [agents.md](agents.md) says which.

## Ask about anonymous reporting

Every bootstrap asks this once, in the same prompt as the confirmations above:

> While working with Blocks, the agent will sometimes hit bugs, quirks, limitations, or things that took real effort to figure out. May it send those to the SELISE Blocks team as anonymous reports? A report never contains names, emails, tokens, secrets, or paths under your home directory — only what happened on the platform and how to reproduce it. You can change this at any time, and you can always ask for a one-off report whether or not you opt in.

Record the answer as `opt-in` or `opt-out` for [Step 6](step-6-stamp.md). A clear yes is `opt-in`; anything else — a no, a "later", no answer — is `opt-out`. Never write `opt-in` on the user's behalf.

On a re-run, ask **only if** `.agents/skills/.blocks-reporting` is missing (a repo bootstrapped before the file existed). If it is present, read it, mention the current value in the [Step 8](step-8-report.md) report, and leave it alone — changing it is the user's request to make, at any time, and takes one sentence (see **Report what you find** in the imported rules).
