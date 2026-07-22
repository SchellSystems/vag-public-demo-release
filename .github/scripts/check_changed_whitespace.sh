#!/usr/bin/env bash
set -euo pipefail
ZERO_SHA="0000000000000000000000000000000000000000"
fail(){ printf 'ERROR: %s\n' "$*" >&2; exit 1; }
is_sha(){ [[ "${1:-}" =~ ^[0-9a-fA-F]{40}$ ]]; }
require_sha(){ local name="$1" value="${2:-}"; is_sha "$value" || fail "$name must be a 40-character hexadecimal commit SHA"; }
has_commit(){ git cat-file -e "${1}^{commit}" 2>/dev/null; }
ensure_commit(){
  local name="$1" sha="$2"
  require_sha "$name" "$sha"
  if has_commit "$sha"; then return 0; fi
  printf 'INFO: %s %s is not present locally; attempting targeted fetch.\n' "$name" "$sha" >&2
  if ! git fetch --no-tags --depth=1 origin "$sha" >/dev/null 2>&1; then
    fail "$name $sha is unavailable after targeted fetch; refusing an unverifiable diff"
  fi
  has_commit "$sha" || fail "$name $sha is unavailable after targeted fetch; refusing an unverifiable diff"
}
EVENT_NAME="${EVENT_NAME:-}"; REF_NAME="${REF_NAME:-}"; DELETED="${DELETED:-false}"
BASE_SHA="${BASE_SHA:-}"; HEAD_SHA="${HEAD_SHA:-}"; BEFORE_SHA="${BEFORE_SHA:-}"; AFTER_SHA="${AFTER_SHA:-}"
case "$EVENT_NAME" in
  pull_request)
    ensure_commit "BASE_SHA" "$BASE_SHA"
    ensure_commit "HEAD_SHA" "$HEAD_SHA"
    git diff --check "${BASE_SHA}...${HEAD_SHA}"
    ;;
  push)
    if [[ "$REF_NAME" != "refs/heads/main" ]]; then
      printf 'INFO: ref %s is outside the bounded main-push scope; no source diff executed.\n' "${REF_NAME:-<unset>}"
      exit 0
    fi
    if [[ "$DELETED" == "true" ]]; then
      printf 'INFO: deleted ref event for main; no source diff executed.\n'
      exit 0
    elif [[ "$DELETED" != "false" ]]; then
      fail "DELETED must be either true or false"
    fi
    ensure_commit "AFTER_SHA" "$AFTER_SHA"
    if [[ "$BEFORE_SHA" == "$ZERO_SHA" ]]; then
      git show --check --format= "$AFTER_SHA"
    else
      ensure_commit "BEFORE_SHA" "$BEFORE_SHA"
      git diff --check "${BEFORE_SHA}..${AFTER_SHA}"
    fi
    ;;
  workflow_dispatch)
    [[ "$REF_NAME" == "refs/heads/main" ]] || fail "workflow_dispatch must target refs/heads/main"
    ensure_commit "AFTER_SHA" "$AFTER_SHA"
    if parent_sha="$(git rev-parse "${AFTER_SHA}^1" 2>/dev/null)" && is_sha "$parent_sha"; then
      ensure_commit "PARENT_SHA" "$parent_sha"
      git diff --check "${parent_sha}..${AFTER_SHA}"
    else
      git show --check --format= "$AFTER_SHA"
    fi
    ;;
  *) fail "EVENT_NAME must be pull_request, push, or workflow_dispatch" ;;
esac
