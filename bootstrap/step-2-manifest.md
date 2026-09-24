# Step 2 — Resolve the skill list from the distributable region

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. Previous: [Step 1](step-1-fetch.md). Next: [Step 3](step-3-rules.md).

**The routing table is the manifest.** Copy the skills it names — no more, no less. Read names from *inside* the distributable region only, so source-only prose can never inject a name:

```bash
awk '/blocks-skills:distributable:start/,/blocks-skills:distributable:end/' "$RULES/AGENTS.md" \
  | grep -oE '`blocks-[a-z0-9-]+`' | tr -d '`' | sort -u > "$TMP/manifest.txt"
ls -d "$SKILLS"/blocks-skills/*/ | xargs -n1 basename | sort > "$TMP/available.txt"
comm -12 "$TMP/manifest.txt" "$TMP/available.txt" > "$TMP/install.txt"   # install these
comm -23 "$TMP/manifest.txt" "$TMP/available.txt"                        # named, no source directory
comm -13 "$TMP/manifest.txt" "$TMP/available.txt"                        # source directory, unrouted
```

- **In both** → install it ([Steps 4](step-4-skills.md)–[5](step-5-stubs.md)).
- **Named, no directory** → do not fabricate one. Collect it for the final report.
- **Directory, not named** → skip it. Collect it for the final report. (Non-directory entries such as `lint.mjs` are tooling, not skills, and are excluded by construction.)

Both mismatch lists go in the report to the user. A silent skip reads as "everything installed" when it didn't.

Sanity-check the count before continuing: `wc -l < "$TMP/install.txt"` should equal the number of skills in the routing table.
