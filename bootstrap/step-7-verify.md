# Step 7 — Verify

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. Previous: [Step 6](step-6-stamp.md). Next: [Step 8](step-8-report.md).

Run these and confirm each; report any failure rather than declaring success. Checking an install outside a full run? Rebuild the `$TMP` lists first — [Step 6](step-6-stamp.md#reading-an-existing-stamp) shows how.

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
