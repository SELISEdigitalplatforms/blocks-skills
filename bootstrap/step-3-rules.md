# Step 3 — Import the rules into AGENTS.md, and point the other instruction files at it

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. Previous: [Step 2](step-2-manifest.md). Next: [Step 4](step-4-skills.md).

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

## Pointer files are generated, not copied

For each file in `instruction-fronts.txt` — `CLAUDE.md`, `GEMINI.md`, `QWEN.md`, `IFLOW.md`, whichever apply — write this block, **not** a copy of anything from the source repo. This repo's own `CLAUDE.md` says the file is "a pointer and nothing more" and forbids guidance that isn't in `AGENTS.md`; true here, false in a target that has its own instructions, and it would contradict whatever is already in the file.

```markdown
## SELISE Blocks

For Blocks work in this repo, read [AGENTS.md](./AGENTS.md) and follow the Blocks section there.

This block scopes Blocks rules only; it says nothing about the rest of this file. Keep Blocks
guidance in `AGENTS.md` rather than duplicating it here — a second copy will drift.
```

The same three-state table applies to each: create the file around this block, replace it between existing markers, or append it and report. It never claims authority over the target's other instructions. An empty `instruction-fronts.txt` means no pointer file is written at all.
