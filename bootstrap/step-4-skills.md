# Step 4 — Copy the skills into `.agents/skills/`

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. Previous: [Step 3](step-3-rules.md). Next: [Step 5](step-5-stubs.md).

## Collision guard — run this first

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
- **`<front>/<s>/SKILL.md`** — byte-identical to the stub [Step 5](step-5-stubs.md) would regenerate from the **currently installed** `.agents/skills/<s>/SKILL.md`. Generate it to a temp file and `diff`. Run this check *before* Step 4 replaces the content copy, or the comparison is against the wrong source.

Never delete a path outside `.agents/skills/<installed-skill-name>` or `<front>/<installed-skill-name>` for a front the stamp names — no globs that could reach wider.

## Then copy

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
