# Updating a repo that was already bootstrapped

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. Read this first, then run the full install from [Step 0](step-0-ask.md) — this file only says what differs on a re-run.

Re-running the runbook is the update path. It is idempotent by construction:

1. Read `.agents/skills/.blocks-skills-source` and report each old commit vs. the new one.
2. [Step 0](step-0-ask.md) re-detects agents, **starting from the stamp's `agents=` line** — an agent already set up stays set up unless the user drops it. Show the user any newcomer the probes found.
3. The [Step 4](step-4-skills.md) guard catches any skill or stub edited locally since the last run, before anything is removed.
4. [Steps 4](step-4-skills.md)–[5](step-5-stubs.md) replace each skill directory and regenerate each stub wholesale.
5. [Step 3](step-3-rules.md) replaces only the marker blocks, so target-repo instructions written outside the markers survive.
6. The reporting choice in `.agents/skills/.blocks-reporting` is kept as it is and the question is not asked again. It is asked only when the file is missing.

## Why there is no skills-only or rules-only update

The routing table in the rules is the manifest of which skills get installed, and the stamp records the rules commit and the skills commit as one pair. A new skill needs a new routing-table row, and a rules change can add or drop a skill, so updating one side without the other leaves the stamp describing an install that does not exist. Pulling new skill content, picking up a newly added skill, or refreshing the imported rules is always this full re-run.

## What re-running does **not** do

- Remove a skill dropped from the routing table. Report those as stale and let the user decide — a repo may still depend on one.
- Remove a front door for an agent the user dropped from the list. Report the stub directory and pointer file as stale and let the user delete them — they may be the only thing left in that agent's directory, or not. To remove one on purpose, use [front-doors.md](front-doors.md).
