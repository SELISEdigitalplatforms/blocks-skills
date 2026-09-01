# BOOTSTRAP.md

**Runbook for vendoring the SELISE Blocks skills into another repository.**

Nobody develops application code in `blocks-skills`. This repo owns the agent **routing rules**; other repos consume them. This file is the procedure a coding agent follows to pull those rules and the skills they route to into a **target repo**, laid out so that **both Codex and Claude Code** can use them.

Invoke it from the target repo with a prompt like:

> Read `https://raw.githubusercontent.com/SELISEdigitalplatforms/blocks-skills/main/BOOTSTRAP.md` and follow it to bootstrap this repo.

That installs the files and stops. To continue straight into working on a project, say so — either with a project key in hand:

> Read `https://raw.githubusercontent.com/SELISEdigitalplatforms/blocks-skills/main/BOOTSTRAP.md` and follow it to bootstrap this repo, then get me set up on project `<x-blocks-key>` and show me what's already there.

or with nothing at all:

> Read `https://raw.githubusercontent.com/SELISEdigitalplatforms/blocks-skills/main/BOOTSTRAP.md` and follow it to bootstrap this repo, then help me sign in and get started — I'm new to Blocks.

Both of those run [Step 9](#step-9--get-to-work-only-if-asked) after the install. Neither asks the user for a URL; see that step for why there isn't one to ask for.

The agent executing this file does the work with its own shell and file tools. There is no installer to run and nothing to add to the target repo's dependencies.

---

## Two sources, one install

Rules and skills live in different repos. Both are read-only inputs here.

| What | Where | Path |
|---|---|---|
| Routing rules, hard rules, workflow | `SELISEdigitalplatforms/blocks-skills` | the region of `AGENTS.md` between the `blocks-skills:distributable` markers |
| Skill content (19 skills) | `SELISEdigitalplatforms/blocks-cli` | `blocks-skills/<skill>/` |

`blocks-skills` has **no `skills/` directory** — the older raw-HTTP generation that lived there is removed. Do not look for one, and do not fall back to an older commit that still has it.

---

## What gets installed

```
<target-repo>/
  AGENTS.md                                  # distributable rules, imported between markers
  CLAUDE.md                                  # generated Blocks pointer, between markers
  .codex/skills/<skill>/                     # THE SOURCE OF TRUTH — full skill content
      SKILL.md
      flows/*.md                             # only the skills that ship flows
  .claude/skills/<skill>/SKILL.md            # pointer stub -> the .codex copy
  .codex/skills/.blocks-skills-source        # provenance: repos, refs, commits, skill list
```

**One copy of the content, two front doors.** Codex reads `.codex/skills/<skill>/SKILL.md` directly. Claude Code discovers `.claude/skills/<skill>/SKILL.md`, which carries the same frontmatter — so it routes identically — but whose body does nothing except send the agent to the `.codex` file. Content is never duplicated, so the two cannot drift.

Relative links inside a skill (`flows/x.md`, `../SKILL.md`) keep resolving because each skill directory is copied intact. No skill links outside its own directory.

---

## Inputs

| Input | Default | Notes |
|---|---|---|
| Target repo root | current working directory | Must be the repo being bootstrapped, not a source repo. |
| Rules repo / ref | `SELISEdigitalplatforms/blocks-skills` @ `main` | |
| Skills repo / ref | `SELISEdigitalplatforms/blocks-cli` @ `main` | Skills are under `blocks-skills/`. |

Requires `git` and a writable target repo. Requires nothing from the `blocks` CLI — installing that is `blocks-bootstrap`'s job, later, and only with the user's consent.

---

## Step 0 — Confirm before writing

Stop and ask the user if any of these hold:

- The working directory is one of the source repos (this runbook installs *into other repos*).
- The target repo has uncommitted changes to `AGENTS.md`, `CLAUDE.md`, `.codex/`, or `.claude/skills/`.
- `.codex/skills/.blocks-skills-source` already exists — this is a **re-run**; see [Updating](#updating-a-repo-that-was-already-bootstrapped).
- `.codex/skills/` contains skill directories but there is **no** provenance stamp — something else authored them. See the collision guard in Step 4.

Otherwise proceed. Everything below is additive or marker-scoped; nothing outside the markers and the two skill directories is touched.

---

## Step 1 — Fetch both sources

```bash
TMP="$(mktemp -d)"
RULES="$TMP/blocks-skills"; RULES_REF="main"
SKILLS="$TMP/blocks-cli";   SKILLS_REF="main"

git clone --depth 1 --branch "$RULES_REF" \
  https://github.com/SELISEdigitalplatforms/blocks-skills.git "$RULES"
git clone --depth 1 --branch "$SKILLS_REF" --filter=blob:none \
  https://github.com/SELISEdigitalplatforms/blocks-cli.git "$SKILLS"

git -C "$RULES" rev-parse HEAD
git -C "$SKILLS" rev-parse HEAD
```

Verify both exist before continuing — `$RULES/AGENTS.md` and `$SKILLS/blocks-skills/`. (`$RULES/CLAUDE.md` is not an input; the target's `CLAUDE.md` block is generated in Step 3.) Also confirm `$RULES/AGENTS.md` contains both `blocks-skills:distributable` markers. If anything is missing, **stop and report it**; do not improvise a partial install.

---

## Step 2 — Resolve the skill list from the distributable region

**The routing table is the manifest.** Copy the skills it names — no more, no less. Read names from *inside* the distributable region only, so source-only prose can never inject a name:

```bash
awk '/blocks-skills:distributable:start/,/blocks-skills:distributable:end/' "$RULES/AGENTS.md" \
  | grep -oE '`blocks-[a-z0-9-]+`' | tr -d '`' | sort -u > "$TMP/manifest.txt"
ls -d "$SKILLS"/blocks-skills/*/ | xargs -n1 basename | sort > "$TMP/available.txt"
comm -12 "$TMP/manifest.txt" "$TMP/available.txt" > "$TMP/install.txt"   # install these
comm -23 "$TMP/manifest.txt" "$TMP/available.txt"                        # named, no source directory
comm -13 "$TMP/manifest.txt" "$TMP/available.txt"                        # source directory, unrouted
```

- **In both** → install it (Steps 4–5).
- **Named, no directory** → do not fabricate one. Collect it for the final report.
- **Directory, not named** → skip it. Collect it for the final report. (Non-directory entries such as `lint.mjs` are tooling, not skills, and are excluded by construction.)

Both mismatch lists go in the report to the user. A silent skip reads as "everything installed" when it didn't.

Sanity-check the count before continuing: `wc -l < "$TMP/install.txt"` should equal the number of skills in the routing table.

---

## Step 3 — Import the rules into AGENTS.md and CLAUDE.md

Import **only** the distributable region — never the whole file. Everything outside those markers is source-repo-only: skill-authoring conventions, notes about where skill sources live, statements about a particular checkout. None of it is true in a consumer repo, and some of it goes stale the moment it is copied.

```bash
awk '/blocks-skills:distributable:start/{f=1;next} /blocks-skills:distributable:end/{f=0} f' \
  "$RULES/AGENTS.md" > "$TMP/agents-block.md"
```

The imported region says skills are vendored files but not *where* this repo put them, so **prepend this scoping header** to the block before writing it:

```markdown
## SELISE Blocks

These rules govern Blocks work in this repo. Skills are vendored at `.codex/skills/<name>/SKILL.md`
(Claude Code discovers the same set via `.claude/skills/`). Read the vendored copy directly; there is
no CLI command that serves a skill. Re-vendor with BOOTSTRAP.md.
```

Imported content always lives between markers, so re-runs are a block replacement instead of a merge conflict:

```
<!-- blocks-skills:start -->
...header + imported region...
<!-- blocks-skills:end -->
```

For each of `AGENTS.md` and `CLAUDE.md`:

| Target state | Action |
|---|---|
| File absent | Create it containing the marker block. |
| File exists, markers present | Replace **only** what is between the markers. Leave the rest byte-for-byte alone. |
| File exists, no markers | **Never overwrite.** Append the marker block at the end, then tell the user what was appended and where. If the existing file's instructions contradict the imported ones, surface the conflict — do not resolve it silently. |

### CLAUDE.md is generated, not copied

**Do not import this repo's `CLAUDE.md` verbatim.** It says the file is "a pointer and nothing more" and forbids guidance that isn't in `AGENTS.md` — true here, false in a target repo that has its own Claude instructions, and it would contradict whatever is already in the file. Write this scoped block instead:

```markdown
## SELISE Blocks

For Blocks work in this repo, read [AGENTS.md](./AGENTS.md) and follow the Blocks section there.

This block scopes Blocks rules only; it says nothing about the rest of this file. Keep Blocks
guidance in `AGENTS.md` rather than duplicating it here — a second copy will drift.
```

The same three-state table applies: create the file around this block, replace it between existing markers, or append it and report. It never claims authority over the target's other instructions.

---

## Step 4 — Copy the skills into `.codex/skills/`

### Collision guard — run this first

Step 4 replaces directories wholesale. Before removing anything, prove nothing local is being destroyed:

```bash
git check-ignore -q .codex/skills && echo "WARNING: .codex/skills is git-ignored — changes are invisible to git"
git status --porcelain --ignored -- .codex .claude/skills
```

Then, for each skill about to be installed, check **both** destinations — `.codex/skills/<s>` and `.claude/skills/<s>`. Step 5 overwrites stubs just as wholesale as Step 4 overwrites content, so a hand-written stub is exactly as losable as a hand-edited skill.

| Situation | Action |
|---|---|
| Neither destination exists | Fresh install. Proceed. |
| No provenance stamp, but either destination exists | Authored by something other than this runbook. **Stop and ask.** Never `rm -rf` or overwrite it on your own authority. |
| Stamp present, both match what the stamp implies | Safe. Replace both. |
| Stamp present, either differs | Locally customized. **List the changed files and ask** before replacing. Offer to save the local version aside. |

"Matches what the stamp implies" means:

- **`.codex/skills/<s>`** — identical to that directory at `skills_commit`. Check the stamped commit out into a temp dir and `diff -r` against it.
- **`.claude/skills/<s>/SKILL.md`** — byte-identical to the stub Step 5 would regenerate from the **currently installed** `.codex/skills/<s>/SKILL.md`. Generate it to a temp file and `diff`. Run this check *before* Step 4 replaces the codex copy, or the comparison is against the wrong source.
- **A stub with no matching `.codex` directory** is foreign. Stop and ask.

Never delete a path outside `.codex/skills/<installed-skill-name>` or `.claude/skills/<installed-skill-name>` — no globs that could reach wider.

### Then copy

```bash
mkdir -p .codex/skills
while IFS= read -r s; do
  [ -n "$s" ] || continue
  rm -rf ".codex/skills/$s"          # cleared by the guard above; replace, never merge
  cp -R "$SKILLS/blocks-skills/$s" ".codex/skills/$s"
  [ -d ".codex/skills/$s/scripts" ] && chmod +x ".codex/skills/$s"/scripts/* 2>/dev/null
done < "$TMP/install.txt"
```

`chmod` runs inside the loop, against the skill just copied. A bare `.codex/skills/*/scripts/*` glob would also re-mark scripts belonging to skills this run never touched.

Copy the **entire** directory — `SKILL.md` plus whatever else the skill ships (today, three skills ship a `flows/` directory and the rest are a single file). Replace, don't merge: a half-old/half-new skill directory is worse than either version.

---

## Step 5 — Generate the Claude pointer stubs

For each installed skill, write `.claude/skills/<skill>/SKILL.md`:

```markdown
---
name: <skill>
description: <copied verbatim from .codex/skills/<skill>/SKILL.md>
---

# <skill>

This skill's content lives at [`.codex/skills/<skill>/SKILL.md`](../../../.codex/skills/<skill>/SKILL.md).

**Read that file now and follow it.** Its relative links (`flows/`, sibling files) resolve from that directory, not this one.

This stub exists so Claude Code discovers the skill. It holds no guidance of its own and must never be given any — the `.codex` copy is the single source of truth, and a second copy would drift.
```

The frontmatter is what routes a request, so it must be **verbatim**: copy the whole block between the first and second `---` of the source `SKILL.md`. Do not re-word, truncate, or re-wrap the description — some run to several hundred characters by design, and shortening one makes the skill stop triggering.

```bash
mkdir -p .claude/skills
while IFS= read -r s; do
  [ -n "$s" ] || continue
  mkdir -p ".claude/skills/$s"
  {
    awk 'NR==1 && $0=="---" {print; next} /^---$/ {print; exit} {print}' ".codex/skills/$s/SKILL.md"
    printf '\n# %s\n\nThis skill'"'"'s content lives at [`.codex/skills/%s/SKILL.md`](../../../.codex/skills/%s/SKILL.md).\n\n**Read that file now and follow it.** Its relative links (`flows/`, sibling files) resolve from that directory, not this one.\n\nThis stub exists so Claude Code discovers the skill. It holds no guidance of its own and must never be given any — the `.codex` copy is the single source of truth, and a second copy would drift.\n' "$s" "$s" "$s"
  } > ".claude/skills/$s/SKILL.md"
done < "$TMP/install.txt"
```

Read the list from the file, not from an unquoted variable — `for s in $LIST` silently collapses to a single item in zsh, which is the default shell on macOS.

The `../../../` is exact: from `.claude/skills/<skill>/` it walks up to the repo root, then down into `.codex`.

---

## Step 6 — Stamp provenance

```bash
cat > .codex/skills/.blocks-skills-source <<STAMP
rules_repo=https://github.com/SELISEdigitalplatforms/blocks-skills.git
rules_ref=$RULES_REF
rules_commit=$(git -C "$RULES" rev-parse HEAD)
skills_repo=https://github.com/SELISEdigitalplatforms/blocks-cli.git
skills_ref=$SKILLS_REF
skills_commit=$(git -C "$SKILLS" rev-parse HEAD)
skills=$(tr '\n' ' ' < "$TMP/install.txt")
STAMP
```

Both commits are required — Step 4's collision guard and the update path depend on `skills_commit`.

No timestamp, no author, and **no mention of which AI tool ran this** — a hard rule inherited from `AGENTS.md` that applies to the target repo too, including commit messages.

---

## Step 7 — Verify

Run these and confirm each; report any failure rather than declaring success.

```bash
# every codex skill has a matching claude stub, and vice versa
diff <(ls .codex/skills | grep -v '^\.') <(ls .claude/skills)

# every stub's pointer target actually exists
for f in .claude/skills/*/SKILL.md; do
  s=$(basename "$(dirname "$f")")
  test -f ".codex/skills/$s/SKILL.md" || echo "BROKEN POINTER: $s"
done

# frontmatter survived the copy — must equal the skill count
grep -l '^name: ' .claude/skills/*/SKILL.md | wc -l

# markers: exactly one start AND one end per file — an unpaired or duplicated
# end marker makes the next run's block replacement overwrite the wrong range
for f in AGENTS.md CLAUDE.md; do
  st=$(grep -c 'blocks-skills:start' "$f"); en=$(grep -c 'blocks-skills:end' "$f")
  [ "$st" = 1 ] && [ "$en" = 1 ] || echo "MARKER ERROR in $f: start=$st end=$en (want 1/1)"
  grep -n 'blocks-skills:start\|blocks-skills:end' "$f" | head -2   # start must precede end
done

# no source-only marker leaked into the target
grep -c 'blocks-skills:distributable' AGENTS.md    # must be 0
```

Then spot-check one skill by hand: open a `.claude` stub, follow its link, and confirm a `flows/` link inside the `.codex` copy resolves.

---

## Step 8 — Report

Tell the user, plainly:

- Skills installed (count + names).
- Skills named in the routing table with no source directory, and source directories not named in it.
- Whether `AGENTS.md` / `CLAUDE.md` were created, block-replaced, or **appended to an existing file** — and if appended, any contradiction with what was already there.
- Anything the collision guard flagged, and what you did about it.
- Both source refs and commits.
- That nothing was committed. Leave the commit to the user unless they asked for one.
- If Step 9 was not requested, say the install is complete and that they can start work by giving you a project key ("get me set up on project `<x-blocks-key>`") or by asking to be signed in from scratch.

---

## Step 9 — Get to work (only if asked)

Steps 0–8 are a file copy and stop there. Run this step **only** when the user asked to continue into project work — by supplying an `x-blocks-key`, or by asking to be signed in, set up, or shown around.

This step does not reimplement bootstrap. The skill you just installed owns that flow: read `.codex/skills/blocks-bootstrap/SKILL.md` and follow it. What is below is only the entry point — which branch to enter on, and what to show at the end.

**The user never supplies a URL.** The CLI's endpoints are built in and self-correcting. The only URL you ever mention is the **portal**, `https://os.seliseblocks.com`, and only for what the CLI genuinely cannot do: **create an account**, and add further environments to a project that already exists. Creating the project itself is no longer portal-only — `blocks projects create` does it. Never ask "what's your Blocks OS URL" — there isn't one to ask for.

### Prerequisite — the CLI

Run `blocks --version`. If it's missing, **ask before installing** (`npm install -g @seliseblocks/cli-os@latest`) — never install it unprompted. If the user declines, stop and report; nothing past here works without it.

### Branch A — the user supplied an `x-blocks-key`

1. `blocks auth status --json`. If not logged in, run `blocks login` **yourself** — it's a device-code flow, so read back the verification URL and user code it prints so the user can approve. Re-run `blocks auth status --json` to confirm rather than assuming it worked.
2. `blocks use <x-blocks-key>` — the key *is* the project tenant id, so it's the literal argument.
3. If selection fails, don't guess at the key. Run `blocks projects list --json` and show what the account can actually reach; the usual cause is a key belonging to a different account, or a typo.
4. Continue to **The brief**.

### Branch B — greenfield: no key, unknown state

1. `blocks auth status --json`.
2. **No account yet?** Signing up is the one thing the CLI can't do. Send them to `https://os.seliseblocks.com` to create an account and wait — don't proceed on the assumption it worked.
3. `blocks login` (device-code, as above).
4. `blocks projects list --json`. Show the full list; never silently adopt a prior session's selection.
   - **Empty?** Create one with the CLI — `blocks projects create "<name>"`. Ask for a name (3–100 characters) and get explicit consent before running it: the call **accepts the Blocks terms on the user's behalf** (`isAcceptBlocksTerms`, `isUseBlocksExclusively`), which is not yours to accept silently. Run `blocks help projects create --json`, then `--dry-run --json`; use `--yes` only after approval. It creates exactly one app in the `dev` environment, and the platform replaces the placeholder domain with the assigned domain. It does not select the project, so continue to step 5. Add further environments from the portal (`https://os.seliseblocks.com`); there is no CLI path for that.
   - **One or more?** Ask which project, and which environment. Don't pick for them.
5. `blocks use <x-blocks-key>` with the chosen project's key.
6. Continue to **The brief**.

### The brief

Before asking what to build, show what's already there. All read-only:

```bash
blocks projects list --json                 # selected project + everything else reachable
blocks auth oidc-clients list --json        # is the app's browser client registered?
blocks auth config get --json               # isOidcEnabled
blocks data schema list --json              # what is already modelled
blocks localization language list --json    # which languages exist
```

Summarize it plainly: project name, key, and app domain; how many other projects the account can reach; whether login is actually wired up (`isOidcEnabled`, plus whether a public OIDC client exists); the existing schemas; the configured languages. Then ask what they want to build.

Two failures this prevents: proposing a schema that already exists, and scaffolding an app whose login silently cannot work because `isOidcEnabled` is `false`.

If one of these commands fails, report that line as unavailable and continue — a missing schema list is no reason to abandon the summary. `data schema list` failing usually just means no data source is configured yet, which is itself worth saying.

### Then hand off

Route the user's answer through the routing table in the `AGENTS.md` you just installed. Don't re-derive any flow here — the skills own it.

---

## Updating a repo that was already bootstrapped

Re-running this runbook is the update path. It is idempotent by construction:

1. Read `.codex/skills/.blocks-skills-source` and report each old commit vs. the new one.
2. The Step 4 guard catches any skill edited locally since the last run, before anything is removed.
3. Steps 4–5 replace each skill directory and regenerate each stub wholesale.
4. Step 3 replaces only the marker block, so target-repo instructions written outside the markers survive.

What re-running does **not** do: remove a skill dropped from the routing table. Report those as stale and let the user decide — a repo may still depend on one.

---

## Rules for the agent running this

- **Steps 0–8 are a file copy — don't install the `blocks` CLI or log anything in during them.** Runtime setup happens only in Step 9, only when the user asked for it, and installing the CLI still needs their consent. The flow itself belongs to `blocks-bootstrap`; Step 9 only enters it.
- **Never ask the user for a Blocks OS or API URL.** The CLI's endpoints are built in. The portal (`https://os.seliseblocks.com`) is the only URL you ever name, and only for account creation or adding an environment to an existing project.
- **Don't edit skill content while copying.** No rewriting for the target repo's stack, no trimming. Skills are verified against the live platform; an edited copy is unverified.
- **Don't import anything outside the distributable markers.**
- **Don't commit or push** unless the user asks.
- **Don't attribute the work to an AI tool** anywhere — files, comments, or commit messages.
- **Stop and ask** on anything ambiguous: an existing unmarked `AGENTS.md` that contradicts the import, a skill directory with no provenance, a target that isn't a git repo, a manifest that doesn't match the source tree.
