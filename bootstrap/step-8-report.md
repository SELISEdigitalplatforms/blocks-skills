# Step 8 — Report

Part of the [BOOTSTRAP.md](../BOOTSTRAP.md) runbook. Previous: [Step 7](step-7-verify.md). Next, only if the user asked: [Step 9](step-9-get-to-work.md).

Tell the user, plainly:

- Skills installed (count + names).
- Skills named in the routing table with no source directory, and source directories not named in it.
- Which agents the install is set up for, and what each got: nothing beyond `.agents/skills/` + `AGENTS.md`, a stub directory, a pointer file, or both. Name any agent that was installed on best-effort terms because its behavior is unverified.
- Whether `AGENTS.md` and each pointer file were created, block-replaced, or **appended to an existing file** — and if appended, any contradiction with what was already there.
- Anything the collision guard flagged, and what you did about it.
- The anonymous-reporting choice recorded (`opt-in` or `opt-out`), that it lives in `.agents/skills/.blocks-reporting`, and that they can flip it or ask for a one-off report at any time by just saying so.
- Both source refs and commits.
- That nothing was committed. Leave the commit to the user unless they asked for one.
- If Step 9 was not requested, say the install is complete and that they can start work by giving you a project key ("get me set up on project `<x-blocks-key>`") or by asking to be signed in from scratch.
