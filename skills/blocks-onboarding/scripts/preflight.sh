#!/usr/bin/env bash
# Blocks preflight — detect the user's account/project state before any configuration flow.
# Usage: ./preflight.sh [path-to-.env]   (default: ./.env)
# Exit codes: 0 = ready · 2 = missing .env or vars · 3 = login failed · 4 = no projects
# Prints the project list (name · environment · tenantId) on success. Never prints the password.
set -u

ENV_FILE="${1:-.env}"
if [ ! -f "$ENV_FILE" ]; then
  echo "PREFLIGHT[2]: no $ENV_FILE found — create it with BLOCKS_API_URL, BLOCKS_USERNAME, BLOCKS_PASSWORD (see blocks-onboarding)."
  exit 2
fi
set -a; . "$ENV_FILE"; set +a
BLOCKS_API_URL="${BLOCKS_API_URL:-https://api.seliseblocks.com}"
if [ -z "${BLOCKS_USERNAME:-}" ] || [ -z "${BLOCKS_PASSWORD:-}" ]; then
  echo "PREFLIGHT[2]: BLOCKS_USERNAME and/or BLOCKS_PASSWORD missing in $ENV_FILE."
  exit 2
fi

LOGIN=$(curl -s -X POST "$BLOCKS_API_URL/iam/v4/auth-login" \
  -H "Content-Type: application/json" \
  --data-raw "{\"username\":\"$BLOCKS_USERNAME\",\"password\":\"$BLOCKS_PASSWORD\"}")
TOK=$(printf '%s' "$LOGIN" | python3 -c "import sys,json
try: print(json.load(sys.stdin).get('access_token') or '')
except Exception: print('')")
if [ -z "$TOK" ]; then
  echo "PREFLIGHT[3]: login failed for $BLOCKS_USERNAME — wrong credentials, or no password set on the account (portal/social-only login). Response (truncated):"
  printf '%s' "$LOGIN" | head -c 300; echo
  exit 3
fi

ACCOUNT_TENANT=$(printf '%s' "$TOK" | cut -d. -f2 | python3 -c "import sys,base64,json
s=sys.stdin.read().strip(); s+='='*(-len(s)%4)
print(json.loads(base64.urlsafe_b64decode(s))['tenant_id'])")

PROJECTS=$(curl -s "$BLOCKS_API_URL/os/v4/Project/Gets?page=0&pageSize=100" \
  -H "x-blocks-key: $ACCOUNT_TENANT" -H "Authorization: Bearer $TOK")
printf '%s' "$PROJECTS" | python3 - << 'PY'
import sys, json
try:
    groups = json.load(sys.stdin)
except Exception:
    print("PREFLIGHT[3]: Project/Gets returned non-JSON — token/URL problem."); sys.exit(3)
projects = [p for g in (groups or []) for p in (g.get("projects") or [])]
if not projects:
    print("PREFLIGHT[4]: login OK, but the account has no projects — create one in the portal (https://cloud.seliseblocks.com), then re-run.")
    sys.exit(4)
print(f"PREFLIGHT[0]: ready — {len(projects)} project(s):")
for p in projects:
    print(f"  {p.get('name','?')} · {p.get('environment','?')} · tenantId={p.get('tenantId','?')}")
PY
exit $?
