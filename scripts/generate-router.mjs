#!/usr/bin/env node
// Generates the `blocks` router skill (skills/blocks/SKILL.md) and keeps the
// plugin manifests in step. Run: npm run generate:router (--check to verify only).
//
// A plugin install (Claude Code, Cursor) delivers skills but never this repo's
// AGENTS.md, so the routing table, hard rules and reporting policy would not
// reach plugin users. The router skill carries them: its body is the
// distributable region of AGENTS.md, copied verbatim, so the rules are written
// once and every install path gets the same text.
//
// Also:
//   - .claude-plugin/plugin.json and .cursor-plugin/plugin.json `version`
//     follow package.json `version`, which the router skill states too.
//   - Every skill directory except the router has a routing-table row, and
//     every row names a skill directory, so no skill ships unroutable.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const skillsDir = join(root, "skills");
const routerPath = join(skillsDir, "blocks", "SKILL.md");
const manifestPaths = [join(root, ".claude-plugin", "plugin.json"), join(root, ".cursor-plugin", "plugin.json")];
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const errors = [];

const DESCRIPTION =
  "Start here for any SELISE Blocks work. Routes a plain-language request — sign-in and projects, SSO, users, roles, " +
  "MFA, data schemas and records, file storage, translations, mail, notifications, workflows, functions, proxies, " +
  "secrets, deployments — to the right Blocks skill, and carries the rules every Blocks skill follows: the blocks " +
  "CLI and @seliseblocks/client SDK only, never raw HTTP to the platform API; --dry-run before --yes; never read the " +
  "CLI's credential files; when to report a finding. Use whenever work touches SELISE Blocks, the blocks CLI, or " +
  "@seliseblocks/client.";

// --- router skill -------------------------------------------------------------
const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
const region = agents.match(/<!-- blocks-skills:distributable:start -->([\s\S]*?)<!-- blocks-skills:distributable:end -->/);
if (!region) fail("AGENTS.md: no blocks-skills:distributable markers");
// Drop the region's own leading comment; it describes vendoring, not this file.
const body = region[1].replace(/^\s*<!--[\s\S]*?-->\s*/, "").trim();

const router = `---
name: blocks
description: "${DESCRIPTION}"
---

<!-- GENERATED from the distributable region of AGENTS.md by scripts/generate-router.mjs.
     Edit AGENTS.md, then run npm run generate:router. -->

# SELISE Blocks

Plugin version: \`${version}\`. This skill routes; the skill it routes to owns the flow. Don't duplicate a skill's steps from memory.

${body}
`;
writeOrCheck(routerPath, router);

// --- manifests ------------------------------------------------------------------
for (const path of manifestPaths) {
  const text = readFileSync(path, "utf8");
  const next = text.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${version}"`);
  if (!/"version"\s*:/.test(text)) errors.push(`${relative(root, path)}: no "version" field`);
  writeOrCheck(path, next);
}

// --- routing table vs. skill directories --------------------------------------------
// Same extraction as bootstrap/step-2-manifest.md: any backticked `blocks-*`
// name in the region is a manifest entry, so prose that backticks a repo name
// (`blocks-skills`) would make every vendored install report a missing skill.
const routed = new Set([...body.matchAll(/`(blocks-[a-z0-9-]+)`/g)].map((m) => m[1]));
const shipped = readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "blocks" && existsSync(join(skillsDir, entry.name, "SKILL.md")))
  .map((entry) => entry.name);
for (const name of shipped) {
  if (!routed.has(name)) errors.push(`skills/${name} has no routing-table row in AGENTS.md`);
}
for (const name of routed) {
  if (!shipped.includes(name)) errors.push(`routing table names ${name}, but skills/${name}/SKILL.md does not exist`);
}

if (errors.length) fail(...errors);
console.log(`router ${check ? "ok" : "generated"}: plugin ${version}, ${shipped.length} skills routed`);

function writeOrCheck(path, content) {
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (current === content) return;
  if (check) {
    errors.push(`${relative(root, path)} is out of date -- run npm run generate:router`);
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function fail(...messages) {
  for (const message of messages) console.error(`error: ${message}`);
  process.exit(1);
}
