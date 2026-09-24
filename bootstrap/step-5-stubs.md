# Step 5 — Generate the front-door stubs

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. Previous: [Step 4](step-4-skills.md). Next: [Step 6](step-6-stamp.md).

For each front dir in `skill-fronts.txt` and each installed skill, write `<front>/<skill>/SKILL.md`: the source skill's frontmatter, then a body that does nothing but send the agent to the `.agents` copy.

```markdown
---
name: <skill>
description: <copied verbatim from .agents/skills/<skill>/SKILL.md>
---
```

The frontmatter is what routes a request, so it must be **verbatim**: copy the whole block between the first and second `---` of the source `SKILL.md`. Do not re-word, truncate, or re-wrap the description — some run to several hundred characters by design, and shortening one makes the skill stop triggering.

The body is the `STUB` heredoc in the script below. That heredoc is the only copy of the stub text — change it there and nowhere else. Every byte matters: [Step 4](step-4-skills.md)'s collision guard compares installed stubs against this output, so any edit makes every existing stub read as locally customized on the next run.

```bash
FRONTS="${FRONTS:-$TMP/skill-fronts.txt}"   # front-doors.md points this at a single new front
while IFS= read -r front; do
  [ -n "$front" ] || continue
  # walk from <front>/<skill>/ back up to the repo root: one "../" per path segment, plus one for <skill>
  ups=""; n=$(( $(printf '%s' "$front" | tr -cd '/' | wc -c) + 2 ))
  i=0; while [ "$i" -lt "$n" ]; do ups="../$ups"; i=$((i+1)); done
  while IFS= read -r s; do
    [ -n "$s" ] || continue
    mkdir -p "$front/$s"
    {
      awk 'NR==1 && $0=="---" {print; next} /^---$/ {print; exit} {print}' ".agents/skills/$s/SKILL.md"
      cat <<STUB

# $s

This skill's content lives at [\`.agents/skills/$s/SKILL.md\`](${ups}.agents/skills/$s/SKILL.md).

**Read that file now and follow it.** Its relative links (\`flows/\`, sibling files) resolve from that directory, not this one.

This stub exists so this agent discovers the skill. It holds no guidance of its own and must never be given any — the \`.agents\` copy is the single source of truth, and a second copy would drift.
STUB
    } > "$front/$s/SKILL.md"
  done < "$TMP/install.txt"
done < "$FRONTS"
```

The `STUB` terminator must stay at the start of its line, as shown — an indented terminator never closes the heredoc.

Read both lists from files, not from unquoted variables — `for s in $LIST` silently collapses to a single item in zsh, which is the default shell on macOS.

The `ups` count is computed, not hard-coded: `.claude/skills/<skill>/` is three levels below the root, so it gets `../../../`; a deeper front such as `.tabnine/agent/skills/` gets four. An empty `skill-fronts.txt` means this step writes nothing.
