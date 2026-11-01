# Step 1 — Verify the source

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. Previous: [Step 0](step-0-ask.md). Next: [Step 2](step-2-manifest.md).

The source repo is already at `$RULES` — it was cloned under **Get the runbook files** in [BOOTSTRAP.md](../BOOTSTRAP.md), which is where you are reading this from. Rules and skills both come from it, so there is nothing else to clone:

```bash
SKILLS="$RULES/skills"
git -C "$RULES" rev-parse HEAD
```

Verify both exist before continuing — `$RULES/AGENTS.md` and `$SKILLS/`. (`$RULES/CLAUDE.md` is not an input; every pointer file is generated in [Step 3](step-3-rules.md).) Also confirm `$RULES/AGENTS.md` contains both `blocks-skills:distributable` markers. If anything is missing, **stop and report it**; do not improvise a partial install, and do not fetch skills from `blocks-cli`, where they used to live.
