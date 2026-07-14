#!/usr/bin/env python3
"""Repo lint for blocks-skills. Run from the repo root: python3 tools/lint.py

Checks:
1. SKILL.md frontmatter: name matches directory, name <= 64 chars,
   description present and <= 1024 chars.
2. Relative markdown links resolve to existing files.
3. No cross-skill *file* links (a skill may mention another skill by name,
   but must not link into another skill's directory — skills are installed
   as self-contained folders).
4. Every flows/get-into-project.md copy is byte-identical.
5. Scripts under skills/*/scripts/ are executable.
Exit 0 = clean, 1 = problems (listed).
"""
import os, re, sys, glob, hashlib

errors = []
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# 1. frontmatter
SKIP = ("skills/skill-creator/",)  # vendored upstream tooling, own conventions

for skill_md in sorted(glob.glob("skills/*/SKILL.md")):
    if skill_md.startswith(SKIP): continue
    skill_dir = os.path.basename(os.path.dirname(skill_md))
    text = open(skill_md).read()
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        errors.append(f"{skill_md}: missing frontmatter"); continue
    fm = m.group(1)
    name = re.search(r"^name:\s*(\S+)\s*$", fm, re.M)
    desc = re.search(r'^description:\s*"(.*)"\s*$', fm, re.M | re.S)
    if not name:
        errors.append(f"{skill_md}: no name in frontmatter")
    elif name.group(1) != skill_dir:
        errors.append(f"{skill_md}: name '{name.group(1)}' != directory '{skill_dir}'")
    elif len(name.group(1)) > 64:
        errors.append(f"{skill_md}: name longer than 64 chars")
    if not desc:
        errors.append(f"{skill_md}: no quoted description in frontmatter")
    elif len(desc.group(1)) > 1024:
        errors.append(f"{skill_md}: description {len(desc.group(1))} chars (max 1024)")

# 2 + 3. links
for md in sorted(glob.glob("**/*.md", recursive=True)):
    if md.startswith(SKIP): continue
    d = os.path.dirname(md)
    in_skill = md.startswith("skills/")
    own_skill = md.split("/")[1] if in_skill else None
    for m in re.finditer(r"\]\(([^)#\s]+?)(#[^)]*)?\)", open(md).read()):
        link = m.group(1)
        if link.startswith(("http://", "https://", "mailto:")):
            continue
        target = os.path.normpath(os.path.join(d, link))
        if not os.path.exists(target):
            errors.append(f"{md}: broken link -> {link}")
        elif in_skill and target.startswith("skills/"):
            target_skill = target.split("/")[1]
            if target_skill != own_skill and not target.endswith("SKILL.md"):
                errors.append(f"{md}: cross-skill file link -> {link} "
                              f"(link the skill by name or its SKILL.md instead)")

# 4. get-into-project sync
copies = sorted(glob.glob("skills/*/flows/get-into-project.md"))
hashes = {p: hashlib.md5(open(p, "rb").read()).hexdigest() for p in copies}
if len(set(hashes.values())) > 1:
    for p, h in hashes.items():
        errors.append(f"get-into-project drift: {p} ({h[:8]})")

# 5. scripts executable
for s in glob.glob("skills/*/scripts/*"):
    if s.startswith(SKIP): continue
    if not os.access(s, os.X_OK):
        errors.append(f"{s}: not executable (chmod +x)")

if errors:
    print(f"LINT: {len(errors)} problem(s):")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
print(f"LINT: clean — {len(glob.glob('skills/*/SKILL.md'))} skills, "
      f"{len(copies)} get-into-project copies in sync.")
