# Step 6 — Stamp provenance

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. Previous: [Step 5](step-5-stubs.md). Next: [Step 7](step-7-verify.md).

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

Both commits are required — [Step 4](step-4-skills.md)'s collision guard and the update path depend on `skills_commit`. The three front-door lines are what lets a re-run know **which** stub directories and pointer files this runbook owns, so it never touches an agent directory it didn't create.

No timestamp, no author, and **no mention of which AI tool ran this** — a hard rule inherited from `AGENTS.md` that applies to the target repo too, including commit messages. The `agents=` line names tools the repo is set up for, which is configuration, not attribution.

## Record the reporting choice

Write the answer from [Step 0](step-0-ask.md) to its own file, next to the stamp. It is deliberately not a line in the stamp: the stamp is regenerated on every run, while this choice must survive re-runs untouched.

```bash
REPORTING="opt-out"   # or opt-in — the literal answer from Step 0
[ -f .agents/skills/.blocks-reporting ] || printf 'reporting=%s\n' "$REPORTING" > .agents/skills/.blocks-reporting
```

The `[ -f ]` guard is what keeps an earlier choice across re-runs. The file holds exactly one line, `reporting=opt-in` or `reporting=opt-out`, and it is the whole preference — the imported rules in `AGENTS.md` read it before any report is sent, and rewrite it when the user asks to switch.

## Reading an existing stamp

Tasks that work on an install without re-running the whole runbook — [front-doors.md](front-doors.md), and checking an install with [Step 7](step-7-verify.md) — need the working lists the full run would have built. Rebuild them from the stamp instead:

```bash
STAMP_FILE=.agents/skills/.blocks-skills-source
sed -n 's/^skills=//p'             "$STAMP_FILE" | tr ' ' '\n' | sed '/^$/d' > "$TMP/install.txt"
sed -n 's/^agents=//p'             "$STAMP_FILE" | tr ' ' '\n' | sed '/^$/d' > "$TMP/agents.txt"
sed -n 's/^skill_fronts=//p'       "$STAMP_FILE" | tr ' ' '\n' | sed '/^$/d' > "$TMP/skill-fronts.txt"
sed -n 's/^instruction_fronts=//p' "$STAMP_FILE" | tr ' ' '\n' | sed '/^$/d' > "$TMP/instruction-fronts.txt"
```

A stamp written before the front-door lines existed has no `agents=`, `skill_fronts=`, or `instruction_fronts=`; that is the old `.codex` layout, and it goes through [migrate-codex.md](migrate-codex.md) instead.

To change only the front-door lines — leaving both commits and the skill list exactly as they are — rewrite those three lines in place:

```bash
STAMP_FILE=.agents/skills/.blocks-skills-source
awk -v a="$(tr '\n' ' ' < "$TMP/agents.txt")" \
    -v sf="$(tr '\n' ' ' < "$TMP/skill-fronts.txt")" \
    -v inf="$(tr '\n' ' ' < "$TMP/instruction-fronts.txt")" '
  /^agents=/             { print "agents=" a; next }
  /^skill_fronts=/       { print "skill_fronts=" sf; next }
  /^instruction_fronts=/ { print "instruction_fronts=" inf; next }
  { print }' "$STAMP_FILE" > "$TMP/stamp.new" && mv "$TMP/stamp.new" "$STAMP_FILE"
```
