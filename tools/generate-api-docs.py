#!/usr/bin/env python3
"""Generate endpoints.md and contracts.md for each SELISE Blocks v4 service skill.

Usage:
    python3 tools/generate-api-docs.py [--swagger-dir DIR] [--out-dir DIR] [service ...]

Downloads (or reads cached) swagger.json for each v4 service and emits:
    skills/blocks-<svc>/endpoints.md   — every endpoint with params + request/response shapes
    skills/blocks-<svc>/contracts.md   — TypeScript types for all schemas used by this service

Routes that ship in several services (shared platform controllers) are documented in
full only in their canonical skill; other services get a one-line pointer table.
"""

import argparse
import json
import os
import re
import sys
import urllib.request
from collections import defaultdict

BASE = "https://api.seliseblocks.com"
SERVICES = ["os", "iam", "localization", "logic", "data", "release", "monitor", "utilities"]

# Skill folder name per service (folders are named blocks-<svc>).
SKILL_NAME = {s: f"blocks-{s}" for s in SERVICES}

# Canonical home for routes that appear in more than one service's swagger,
# keyed by the route's tag. A shared route is documented in full only in its
# canonical service; elsewhere it appears in a pointer table.
SHARED_TAG_CANONICAL = {
    "Log": "monitor", "Trace": "monitor", "Monitor": "monitor", "Health": "monitor",
    "Captcha": "os", "Mfa": "os", "Migration": "os", "Notification": "os",
    "People": "os", "Project": "os", "Service": "os", "Storage": "os",
    "Subscription": "os", "ApiEndpointConfig": "os", "Discovery": "os", "Secrets": "os",
    "Mail": "utilities", "Template": "utilities", "Notifier": "utilities",
    "Language": "localization",
}

METHODS = ("get", "post", "put", "delete", "patch")
MAX_DEPTH = 4


def fetch_spec(svc, swagger_dir):
    path = os.path.join(swagger_dir, f"{svc}.json")
    if not os.path.exists(path):
        url = f"{BASE}/{svc}/v4/swagger/v1/swagger.json"
        print(f"  downloading {url}")
        with urllib.request.urlopen(url, timeout=30) as r:
            data = r.read()
        os.makedirs(swagger_dir, exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)
    with open(path) as f:
        return json.load(f)


def short_name(full):
    """Authentication.DomainService.OAuth.RequestModel.EmbeddedLoginRequest -> EmbeddedLoginRequest

    CLR generic names collapse to Of-form:
    Ns.PaginationResponse`1[[Ns.DataValidationResponse, Asm, Version=…]] -> PaginationResponseOfDataValidationResponse
    """
    m = re.match(r"^(?P<outer>[^`]+)`\d+\[\[(?P<inner>[^,\]`]+)", full)
    if m:
        outer = m.group("outer").split(".")[-1]
        inner = m.group("inner").split(".")[-1]
        return f"{outer}Of{inner}"
    return re.sub(r"[^\w]", "_", full.split(".")[-1]) if not full.split(".")[-1].isidentifier() else full.split(".")[-1]


def build_name_map(schemas):
    """Map full schema names to unique short TS-friendly names."""
    by_short = defaultdict(list)
    for full in schemas:
        by_short[short_name(full)].append(full)
    out = {}
    for short, fulls in by_short.items():
        if len(fulls) == 1:
            out[fulls[0]] = short
        else:
            for full in fulls:
                parts = full.split(".")
                qualifier = parts[-2] if len(parts) > 1 else ""
                out[full] = f"{qualifier}{short}" if qualifier else short
    return out


class Renderer:
    def __init__(self, spec):
        self.spec = spec
        self.schemas = spec.get("components", {}).get("schemas", {})
        self.names = build_name_map(self.schemas)
        self.used = set()  # full schema names referenced by rendered ops

    def resolve(self, ref):
        assert ref.startswith("#/components/schemas/"), ref
        return ref[len("#/components/schemas/"):]

    def mark_used(self, schema, seen=None):
        seen = seen or set()
        if not isinstance(schema, dict):
            return
        if "$ref" in schema:
            full = self.resolve(schema["$ref"])
            if full in seen:
                return
            seen.add(full)
            self.used.add(full)
            self.mark_used(self.schemas.get(full, {}), seen)
            return
        for key in ("items", "additionalProperties"):
            if isinstance(schema.get(key), dict):
                self.mark_used(schema[key], seen)
        for sub in schema.get("properties", {}).values():
            self.mark_used(sub, seen)

    # ---- compact shape rendering for endpoints.md ----

    def shape(self, schema, depth=0, seen=None):
        seen = seen or set()
        if not isinstance(schema, dict) or not schema:
            return "unknown"
        if "$ref" in schema:
            full = self.resolve(schema["$ref"])
            name = self.names.get(full, short_name(full))
            if full in seen or depth >= MAX_DEPTH:
                return name
            return self.shape(self.schemas.get(full, {}), depth, seen | {full})
        t = schema.get("type")
        if t == "array":
            inner = self.shape(schema.get("items", {}), depth, seen)
            if "\n" in inner:
                return inner + "[]"
            return f"{inner}[]"
        if t == "object" or "properties" in schema:
            props = schema.get("properties", {})
            if not props:
                ap = schema.get("additionalProperties")
                if isinstance(ap, dict) and ap:
                    return f"{{ [key: string]: {self.shape(ap, depth + 1, seen)} }}"
                return "object"
            if depth >= MAX_DEPTH:
                return "{ … }"
            required = set(schema.get("required", []))
            pad = "  " * (depth + 1)
            lines = ["{"]
            for pname, psch in props.items():
                opt = "" if pname in required else "?"
                val = self.shape(psch, depth + 1, seen)
                desc = psch.get("description", "").strip().replace("\n", " ")
                comment = f"  // {desc[:90]}" if desc else ""
                lines.append(f"{pad}{pname}{opt}: {val}{comment}")
            lines.append("  " * depth + "}")
            return "\n".join(lines)
        if "enum" in schema:
            vals = " | ".join(json.dumps(v) for v in schema["enum"])
            note = " (int enum)" if t == "integer" else ""
            return f"{vals}{note}"
        base = {"integer": "number", "number": "number", "boolean": "boolean", "string": "string"}.get(t, t or "unknown")
        if t == "string" and schema.get("format") in ("date-time", "date"):
            base = f"string ({schema['format']})"
        if schema.get("nullable"):
            base += " | null"
        return base

    # ---- TypeScript emission for contracts.md ----

    def ts_type(self, schema, seen=None):
        seen = seen or set()
        if not isinstance(schema, dict) or not schema:
            return "unknown"
        if "$ref" in schema:
            full = self.resolve(schema["$ref"])
            return self.names.get(full, short_name(full))
        t = schema.get("type")
        if t == "array":
            inner = self.ts_type(schema.get("items", {}), seen)
            return f"{inner}[]" if re.fullmatch(r"[\w.]+(\[\])*", inner) else f"Array<{inner}>"
        if t == "object" or "properties" in schema:
            props = schema.get("properties", {})
            if not props:
                ap = schema.get("additionalProperties")
                if isinstance(ap, dict) and ap:
                    return f"Record<string, {self.ts_type(ap, seen)}>"
                return "Record<string, unknown>"
            required = set(schema.get("required", []))
            fields = []
            for pname, psch in props.items():
                opt = "" if pname in required else "?"
                fields.append(f"{pname}{opt}: {self.ts_type(psch, seen)}")
            return "{ " + "; ".join(fields) + " }"
        if "enum" in schema:
            return " | ".join(json.dumps(v) for v in schema["enum"])
        base = {"integer": "number", "number": "number", "boolean": "boolean", "string": "string"}.get(t, "unknown")
        if schema.get("nullable"):
            base += " | null"
        return base

    def ts_decl(self, full):
        schema = self.schemas.get(full, {})
        name = self.names.get(full, short_name(full))
        desc = schema.get("description", "").strip()
        header = f"/** {desc} */\n" if desc else ""
        if "enum" in schema:
            vals = " | ".join(json.dumps(v) for v in schema["enum"])
            note = "" if schema.get("type") != "integer" else "  // int enum — member names not published in swagger"
            return f"{header}export type {name} = {vals};{note}"
        if schema.get("type") == "object" or "properties" in schema:
            props = schema.get("properties", {})
            if not props:
                return f"{header}export type {name} = Record<string, unknown>;"
            required = set(schema.get("required", []))
            lines = [f"{header}export interface {name} {{"]
            for pname, psch in props.items():
                opt = "" if pname in required else "?"
                pdesc = psch.get("description", "").strip().replace("\n", " ")
                if pdesc:
                    lines.append(f"  /** {pdesc} */")
                lines.append(f"  {pname}{opt}: {self.ts_type(psch)};")
            lines.append("}")
            return "\n".join(lines)
        return f"{header}export type {name} = {self.ts_type(schema)};"


def op_security(op, spec):
    sec = op.get("security", spec.get("security"))
    if not sec or all(not s for s in sec):
        return None
    names = sorted({k for s in sec for k in s})
    return ", ".join(names) if names else None


def params_table(op):
    params = op.get("parameters", [])
    if not params:
        return []
    lines = ["| Param | In | Type | Required | Description |", "|---|---|---|---|---|"]
    for p in params:
        sch = p.get("schema", {})
        t = sch.get("type", "string")
        if sch.get("format"):
            t += f" ({sch['format']})"
        desc = p.get("description", "").replace("\n", " ").replace("|", "\\|")
        lines.append(f"| `{p['name']}` | {p.get('in', '?')} | {t} | {'yes' if p.get('required') else 'no'} | {desc} |")
    return lines


def gen_service(svc, spec, route_owner, out_dir):
    rnd = Renderer(spec)
    skill = SKILL_NAME[svc]
    base_url = f"{BASE}/{svc}/v4"
    paths = spec.get("paths", {})

    own_ops = defaultdict(list)      # tag -> [(method, path, op)]
    foreign_ops = defaultdict(list)  # canonical svc -> [(method, path, summary)]
    for path, item in paths.items():
        for m in METHODS:
            if m not in item:
                continue
            op = item[m]
            tag = (op.get("tags") or ["General"])[0]
            owner = route_owner.get((m.upper(), path), svc)
            if owner == svc:
                own_ops[tag].append((m.upper(), path, op))
            else:
                summary = (op.get("summary") or "").split("\n")[0].strip()
                foreign_ops[owner].append((m.upper(), path, summary))

    # ---------- endpoints.md ----------
    out = []
    out.append(f"# {skill} — API Endpoints")
    out.append("")
    out.append(f"> Generated from `{BASE}/{svc}/v4/swagger/v1/swagger.json` — do not edit by hand.")
    out.append(f"> Regenerate with `python3 tools/generate-api-docs.py {svc}`.")
    out.append("")
    out.append(f"**Base URL:** `{base_url}`")
    out.append("")
    out.append("**Authentication** (see `blocks-setup` skill for obtaining tokens):")
    out.append("- `x-blocks-key: <X_BLOCKS_KEY>` header — required on every request")
    out.append("- `Authorization: Bearer <access_token>` — required for authenticated operations")
    out.append("")
    n_ops = sum(len(v) for v in own_ops.values())
    out.append(f"**{n_ops} endpoints** across {len(own_ops)} controllers.")
    out.append("")
    out.append("## Contents")
    out.append("")
    for tag in sorted(own_ops):
        out.append(f"- [{tag}](#{tag.lower()}) ({len(own_ops[tag])})")
    if foreign_ops:
        out.append("- [Shared platform controllers](#shared-platform-controllers) — documented in other skills")
    out.append("")

    for tag in sorted(own_ops):
        out.append(f"## {tag}")
        out.append("")
        for m, path, op in sorted(own_ops[tag], key=lambda x: (x[1], x[0])):
            out.append(f"### `{m} {path}`")
            out.append("")
            summary = (op.get("summary") or "").strip()
            if summary:
                out.append(summary.replace("\n", "  \n"))
                out.append("")
            desc = (op.get("description") or "").strip()
            if desc and desc != summary:
                out.append(desc)
                out.append("")
            sec = op_security(op, spec)
            if sec:
                out.append(f"**Security:** {sec}")
                out.append("")
            pt = params_table(op)
            if pt:
                out.extend(pt)
                out.append("")
            body = op.get("requestBody", {}).get("content", {}).get("application/json", {}).get("schema")
            if body:
                rnd.mark_used(body)
                out.append("**Request body** (`application/json`):")
                out.append("")
                out.append("```ts")
                out.append(rnd.shape(body))
                out.append("```")
                out.append("")
            responses = op.get("responses", {})
            for code in sorted(responses):
                resp = responses[code]
                content = resp.get("content", {})
                schema = content.get("application/json", {}).get("schema") or content.get("text/plain", {}).get("schema")
                if schema:
                    rnd.mark_used(schema)
                    out.append(f"**Response {code}:**")
                    out.append("")
                    out.append("```ts")
                    out.append(rnd.shape(schema))
                    out.append("```")
                else:
                    out.append(f"**Response {code}:** {resp.get('description', '')} — no schema documented in swagger; verify the live response before relying on its shape.")
                out.append("")

    if foreign_ops:
        out.append("## Shared platform controllers")
        out.append("")
        out.append("These routes are also served by this service but are platform-wide controllers.")
        out.append("They are documented in full in their canonical skill — use that skill's docs and")
        out.append("call them on this base URL only if you specifically need this service's instance.")
        out.append("")
        for owner in sorted(foreign_ops):
            out.append(f"### Documented in `{SKILL_NAME[owner]}`")
            out.append("")
            out.append("| Method | Path | Summary |")
            out.append("|---|---|---|")
            for m, path, summary in sorted(foreign_ops[owner], key=lambda x: (x[1], x[0])):
                out.append(f"| {m} | `{path}` | {summary[:100]} |")
            out.append("")

    os.makedirs(os.path.join(out_dir, skill), exist_ok=True)
    with open(os.path.join(out_dir, skill, "endpoints.md"), "w") as f:
        f.write("\n".join(out).rstrip() + "\n")

    # ---------- contracts.md ----------
    cts = []
    cts.append(f"# {skill} — TypeScript Contracts")
    cts.append("")
    cts.append(f"> Generated from `{BASE}/{svc}/v4/swagger/v1/swagger.json` — do not edit by hand.")
    cts.append(f"> Regenerate with `python3 tools/generate-api-docs.py {svc}`.")
    cts.append("")
    cts.append("Types for every schema referenced by this service's endpoints (see `endpoints.md`).")
    cts.append("Integer enums are emitted as numeric unions — the C# member names are not published")
    cts.append("in the swagger, so treat the meanings as unverified until observed from the live API.")
    cts.append("")
    cts.append("```ts")
    for full in sorted(rnd.used, key=lambda x: rnd.names.get(x, x)):
        cts.append(rnd.ts_decl(full))
        cts.append("")
    cts.append("```")
    with open(os.path.join(out_dir, skill, "contracts.md"), "w") as f:
        f.write("\n".join(cts).rstrip() + "\n")

    return n_ops, sum(len(v) for v in foreign_ops.values()), len(rnd.used)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("services", nargs="*", default=None)
    ap.add_argument("--swagger-dir", default=".swagger-cache")
    ap.add_argument("--out-dir", default="skills")
    args = ap.parse_args()
    targets = args.services or SERVICES

    specs = {s: fetch_spec(s, args.swagger_dir) for s in SERVICES}

    # Determine canonical owner for every route across all services.
    route_svcs = defaultdict(list)
    route_tag = {}
    for s, d in specs.items():
        for p, item in d.get("paths", {}).items():
            for m in METHODS:
                if m in item:
                    route_svcs[(m.upper(), p)].append(s)
                    route_tag[(m.upper(), p)] = (item[m].get("tags") or ["General"])[0]
    route_owner = {}
    for key, svcs in route_svcs.items():
        if len(svcs) == 1:
            route_owner[key] = svcs[0]
        else:
            canonical = SHARED_TAG_CANONICAL.get(route_tag[key])
            route_owner[key] = canonical if canonical in svcs else sorted(svcs)[0]

    for svc in targets:
        own, shared, used = gen_service(svc, specs[svc], route_owner, args.out_dir)
        print(f"{SKILL_NAME[svc]}: {own} endpoints documented, {shared} shared routes pointed elsewhere, {used} schemas in contracts.md")


if __name__ == "__main__":
    main()
