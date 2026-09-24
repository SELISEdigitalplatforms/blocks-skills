# Step 1 — Fetch the skills source

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. Previous: [Step 0](step-0-ask.md). Next: [Step 2](step-2-manifest.md).

The rules repo is already at `$RULES` — it was cloned under **Get the runbook files** in [BOOTSTRAP.md](../BOOTSTRAP.md), which is where you are reading this from. Clone the skills repo next to it:

```bash
SKILLS="$TMP/blocks-cli"; SKILLS_REF="main"

git clone --depth 1 --branch "$SKILLS_REF" --filter=blob:none \
  https://github.com/SELISEdigitalplatforms/blocks-cli.git "$SKILLS"

git -C "$RULES" rev-parse HEAD
git -C "$SKILLS" rev-parse HEAD
```

Verify both exist before continuing — `$RULES/AGENTS.md` and `$SKILLS/blocks-skills/`. (`$RULES/CLAUDE.md` is not an input; every pointer file is generated in [Step 3](step-3-rules.md).) Also confirm `$RULES/AGENTS.md` contains both `blocks-skills:distributable` markers. If anything is missing, **stop and report it**; do not improvise a partial install.
