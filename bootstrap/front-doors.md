# Adding or dropping one agent's front door

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. Use this when a repo is already bootstrapped and the user has started (or stopped) using one agent — "set Blocks up for Gemini too", "we don't use Qwen any more". The skills and rules don't change, so nothing is fetched beyond this runbook and the stamp's commits stay exactly as they are.

**Preconditions** — check these first:

| Target state | Go to |
|---|---|
| `.agents/skills/.blocks-skills-source` exists with `agents=`, `skill_fronts=`, `instruction_fronts=` lines | This file. |
| `.codex/skills/.blocks-skills-source` exists | [migrate-codex.md](migrate-codex.md) — the old layout has no front-door bookkeeping to edit. |
| No stamp at all | Not bootstrapped. Run the full install; the new agent is picked up in [Step 0](step-0-ask.md). |
| The user also wants the latest skills or rules | [update.md](update.md) — a full re-run adds or drops agents in Step 0 anyway. |

Then rebuild the working lists from the stamp — [Step 6 → Reading an existing stamp](step-6-stamp.md#reading-an-existing-stamp).

## Adding an agent

1. **Look it up** in [agents.md](agents.md), or answer its [Unknown agents](agents.md#unknown-agents) questions. It needs a stub directory if it doesn't read `.agents/skills/`, and a pointer file if it doesn't read `AGENTS.md`. If it reads both natively, it needs nothing on disk — add it to `agents.txt`, rewrite the stamp (step 5 below), and tell the user it was already covered.
2. **Tell the user** what the agent will get — a stub directory, a pointer file, or both — before writing anything.
3. **Stub directory**, if needed. Append the front to `$TMP/skill-fronts.txt` and also write it alone to `$TMP/new-fronts.txt`. The stamp doesn't name this front yet, so any `<front>/<skill>` that already exists is foreign — **stop and ask** ([Step 4](step-4-skills.md)'s collision table). Otherwise run the [Step 5](step-5-stubs.md) script with only the new front, so existing stubs are left alone:

   ```bash
   FRONTS="$TMP/new-fronts.txt"   # then run the Step 5 script as written
   ```

4. **Pointer file**, if needed. Append it to `$TMP/instruction-fronts.txt` and write it per [Step 3 → Pointer files](step-3-rules.md#pointer-files-are-generated-not-copied), using the same three-state table: create, replace between markers, or append and report. Touch no other instruction file.
5. **Stamp.** Append the agent's name to `$TMP/agents.txt`, then rewrite the three front-door lines with the in-place `awk` from [Step 6 → Reading an existing stamp](step-6-stamp.md#reading-an-existing-stamp). Never re-run the full Step 6 script here: it would stamp the commits of your fresh clone over the commits that are actually installed.
6. **Verify** with [Step 7](step-7-verify.md), then report what was added and where.

## Dropping an agent

Only on the user's explicit request — a re-run never removes a front door on its own ([update.md](update.md)).

1. **Scope it.** Only the agent's own front door is in play: the `<front>/<skill>` directories for skills the stamp's `skills=` names, and the marker block in its pointer file. If another agent still in use shares that front or pointer file, it stays.
2. **Check before deleting.** Each stub must be byte-identical to what [Step 5](step-5-stubs.md) would generate from the installed `.agents` copy (the same check as [Step 4](step-4-skills.md)'s guard). List any that differ and ask.
3. **Show the user the exact paths** that will be removed, and wait for a yes.
4. **Remove.**
   - Stubs: `rm -rf "<front>/<skill>"` for each stamped skill — never a glob over the front. Then `rmdir` the front and its parents only if they are empty; anything else in there is not ours.
   - Pointer file: delete the lines from `<!-- blocks-skills:start -->` through `<!-- blocks-skills:end -->`, and nothing else. If the file is left empty or whitespace-only, ask before deleting the file itself.
5. **Stamp.** Remove the agent from `$TMP/agents.txt`, its front from `$TMP/skill-fronts.txt`, and its file from `$TMP/instruction-fronts.txt`, then rewrite the three lines with the in-place `awk` from [Step 6](step-6-stamp.md#reading-an-existing-stamp).
6. **Verify** with [Step 7](step-7-verify.md), then report what was removed.

The runbook's rules still apply: nothing is committed unless the user asks, and no AI tool is named anywhere.
