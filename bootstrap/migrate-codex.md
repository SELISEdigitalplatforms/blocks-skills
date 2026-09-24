# Migrating from the old `.codex` layout

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. [Step 0](step-0-ask.md) sends you here when `.codex/skills/.blocks-skills-source` exists.

Earlier versions of this runbook put the content at `.codex/skills/` with Claude Code stubs at `.claude/skills/`, and nothing else. Codex never read a repo-level `.codex/skills/` — its project location is `.agents/skills/` — so that layout served exactly one agent. A repo with `.codex/skills/.blocks-skills-source` is on it. On such a repo:

1. Treat it as a re-run ([update.md](update.md)): read the old stamp for `skills_commit` and the skill list.
2. Run the [Step 4](step-4-skills.md) collision guard against the **old** locations — `.codex/skills/<s>` against the stamped commit, and `.claude/skills/<s>/SKILL.md` against a stub generated with `.codex/skills` as the content root, since that is what the old stubs point at.
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

4. Continue from [Step 0](step-0-ask.md)'s agent detection as normal. Claude Code will be on the list (the old layout proves it was in use), so `.claude/skills/` is regenerated in [Step 5](step-5-stubs.md), now pointing at `.agents`.
5. Say in the report that the layout moved, and why.
