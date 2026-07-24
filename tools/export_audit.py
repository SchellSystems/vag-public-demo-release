#!/usr/bin/env python3
"""Audit the bounded public-demo tree for non-public export material."""

from dataclasses import dataclass
import json
import os
import re
import sys
from urllib.parse import urlparse


@dataclass(frozen=True)
class ContentRule:
    label: str
    pattern: re.Pattern[str]


# High-confidence value formats only. Generic words such as token, key, and
# password are intentionally not findings by themselves.
CONTENT_RULES = [
    ContentRule("GitHub classic token value", re.compile(r"\bghp_[A-Za-z0-9]{20,}\b")),
    ContentRule("GitHub fine-grained token value", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b")),
    ContentRule("provider API key value", re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b")),
    ContentRule("AWS access key value", re.compile(r"\bAKIA[A-Z0-9]{16}\b")),
    ContentRule("private key block", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
    ContentRule("credential-bearing URL", re.compile(r"(?:https?|git\+https?)://[^/\s:@]+:[^@\s/]+@", re.I)),
    ContentRule("private npm registry", re.compile(r"https?://(?:npm\.pkg\.github\.com|registry\.(?!npmjs\.org)[A-Za-z0-9.-]+)/?", re.I)),
    ContentRule("private repository URL", re.compile(r"https?://github\.com/SchellSystems/(?:VAG-v1-main|vag-public-demo(?:\.git)?|VAG-Controlled-Agent-Pilot|VAG-lite)(?:\.git)?(?:[/?#]|$)", re.I)),
    ContentRule("absolute local path", re.compile(r"(?:/Users/[^/\s]+/|/home/[^/\s]+/|/workspace/|[A-Za-z]:\\Users\\|file://)", re.I)),
]

SECRET_ASSIGNMENT_RE = re.compile(
    r"\b(api[_-]?key|private[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|bearer)\b\s*[:=]\s*[\"']?([^\s,\"'}]+)",
    re.I,
)
RUNTIME_FIXTURE_RE = re.compile(
    r"synthetic-(?:record-hash|signature)-placeholder|\"(?:record_hash|signature|computed_hash|input_hash)\"\s*:\s*\"[a-f0-9]{64}\"",
    re.I,
)
SKIP_DIRS = {".git", "__pycache__", "node_modules", "dist"}
TEXT_EXTENSIONS = {
    ".md", ".txt", ".py", ".yml", ".yaml", ".json", ".js", ".ts",
    ".html", ".css", ".sh", ".bat", ".cfg", ".ini", ".toml",
}
FORBIDDEN_PUBLIC_PREFIXES = ("docs/internal/", "private/", "internal/", "logs/", "evidence/")
FORBIDDEN_BASENAMES = {"mcp.json"}
FORBIDDEN_SUFFIXES = (".pem", ".key", ".p12", ".log", ".har", ".db", ".sqlite")
PATH_SENSITIVE_PATTERNS = ["workspace", "localhost", "127.0.0.1", "Desktop", "file://"]
LOCALHOST_ALLOWED_FILES = {
    "demo-gateway/README.md", "demo-gateway/src/server.mjs", "demo-gateway/src/core.mjs",
    "demo-ui/src/constants.ts", "demo-ui/src/services/gateway.ts", "demo-ui/vite.config.ts",
    "tools/public_demo_probe.mjs", "tools/gateway_smoke.mjs", "docs/demo/walkthrough.md",
    "docs/demo/runbook.md", "docs/demo/threat-model.md",
    "docs/architecture/authority-boundaries.md", "README.md",
}
PLACEHOLDER_RE = re.compile(
    r"^(?:<[^>]+>|\$\{\{?[^}]+\}\}?|REDACTED|PLACEHOLDER|EXAMPLE|NOT[_-]?REAL|null|none)$",
    re.I,
)

# Narrow, EXACT-MATCH allowlist for non-registry lockfile sources.
# Keyed by package name -> set of allowed source bases (the part before any
# '#<commit>' fragment). This intentionally does NOT blanket-skip
# devDependencies: every other git/ssh/file/foreign-registry source, in any
# dependency tree and regardless of the dev flag, is still reported as FAIL.
# Only the pinned Electron-owned build tooling that Electron Forge requires is
# exempted here.
ALLOWED_NONREGISTRY_LOCKFILE_SOURCES = {
    "@electron/node-gyp": {
        "git+ssh://git@github.com/electron/node-gyp.git",
        "git+https://github.com/electron/node-gyp.git",
    },
}


def lockfile_source_base(source):
    """Return the source without its '#<commit>' fragment for allowlist match."""
    return source.split("#", 1)[0]


def package_name_from_lock_path(pkg_path):
    """Extract the installed package name from a lockfile-v3 packages key."""
    if "node_modules/" in pkg_path:
        return pkg_path.rsplit("node_modules/", 1)[-1]
    return pkg_path


def is_allowlisted_lockfile_source(pkg_name, source):
    """True only for an exact (package, source-base) pair in the allowlist."""
    allowed = ALLOWED_NONREGISTRY_LOCKFILE_SOURCES.get(pkg_name)
    return bool(allowed) and lockfile_source_base(source) in allowed


def is_text_file(filepath):
    _, ext = os.path.splitext(filepath)
    if ext.lower() in TEXT_EXTENSIONS:
        return True
    if not ext:
        try:
            with open(filepath, "rb") as handle:
                return b"\x00" not in handle.read(1024)
        except OSError:
            return False
    return False


def get_relative_path(filepath, root):
    return os.path.relpath(filepath, root).replace(os.sep, "/")


def is_evidence_file(rel_path):
    return rel_path.startswith("examples/evidence/") and rel_path.endswith(".public.json")


def is_self_pattern_literal(rel_path, line):
    if rel_path != "tools/export_audit.py":
        return False
    declaration_markers = (
        "ContentRule(", "SECRET_ASSIGNMENT_RE =", "RUNTIME_FIXTURE_RE =",
        "PATH_SENSITIVE_PATTERNS =", "FORBIDDEN_PUBLIC_PREFIXES =",
        "FORBIDDEN_BASENAMES =", "FORBIDDEN_SUFFIXES =", "PLACEHOLDER_RE =",
    )
    return any(marker in line for marker in declaration_markers)


def is_safe_placeholder(value):
    return bool(PLACEHOLDER_RE.match(value.strip().strip("\"'")))


def check_package_lock(content, rel_path):
    findings = []
    try:
        data = json.loads(content)
    except (json.JSONDecodeError, ValueError):
        return [(rel_path, 0, "invalid package-lock.json", "FAIL")]

    # npm lockfile v3 uses "packages" with path-based keys.
    # Workspace directory references are local, not exportable secrets.
    top_pkg = data.get("packages", {}).get("", {})
    workspaces = set()
    if isinstance(data.get("workspaces"), list):
        workspaces.update(data["workspaces"])
    if isinstance(top_pkg.get("workspaces"), list):
        workspaces.update(top_pkg["workspaces"])

    def check_source(source, source_label):
        lowered = source.lower()
        if lowered.startswith(("file:", "git:", "git+ssh:", "git+https:", "git://", "ssh:")):
            findings.append((rel_path, 0, f"non-public lockfile {source_label}", "FAIL"))
        elif source.startswith(("http://", "https://")):
            parsed = urlparse(source)
            if parsed.username or parsed.password:
                findings.append((rel_path, 0, "credential-bearing lockfile URL", "FAIL"))
            elif parsed.hostname != "registry.npmjs.org":
                findings.append((rel_path, 0, "non-public npm registry", "FAIL"))

    def guarded_check(source, pkg_name):
        # Bypass ONLY exact allowlisted (package, source) pairs. All other
        # git/ssh/file/foreign sources — including dev dependencies — are
        # still checked and reported.
        if is_allowlisted_lockfile_source(pkg_name, source):
            return
        check_source(source, pkg_name or "resolved")

    packages = data.get("packages", {})
    for pkg_path, pkg_info in packages.items():
        if not isinstance(pkg_info, dict):
            continue

        pkg_name = package_name_from_lock_path(pkg_path)

        # Skip workspace self-references (bare local directory paths).
        resolved = pkg_info.get("resolved", "")
        if isinstance(resolved, str) and resolved in workspaces:
            continue

        # Check resolved field for EVERY package, dev or not.
        if isinstance(resolved, str) and resolved:
            guarded_check(resolved, pkg_name)

        # Check version field when it carries a source specifier.
        version = pkg_info.get("version", "")
        if isinstance(version, str) and version.lower().startswith(
            ("file:", "git:", "git+ssh:", "git+https:", "git://", "ssh:")
        ):
            guarded_check(version, pkg_name)

        # Check dependency specifiers declared in this package entry.
        for dep_key in ("dependencies", "devDependencies", "optionalDependencies", "peerDependencies"):
            deps = pkg_info.get(dep_key)
            if not isinstance(deps, dict):
                continue
            for dep_name, dep_spec in deps.items():
                if not isinstance(dep_spec, str):
                    continue
                dep_lower = dep_spec.lower()
                if dep_lower.startswith(("file:", "git:", "git+ssh:", "git+https:", "git://", "ssh:")):
                    guarded_check(dep_spec, dep_name)
                elif dep_spec.startswith(("http://", "https://")):
                    guarded_check(dep_spec, dep_name)

    return findings


def check_evidence(content, rel_path):
    findings = []
    try:
        data = json.loads(content)
    except (json.JSONDecodeError, ValueError):
        return [(rel_path, 0, "invalid JSON in evidence file", "FAIL")]
    required = {
        "synthetic": True,
        "conceptual_example": True,
        "runtime_replayable": False,
        "not_real_evidence": True,
        "not_from_private_runtime": True,
    }
    for key, expected in required.items():
        if data.get(key) is not expected:
            findings.append((rel_path, 0, f"required {key}: {str(expected).lower()}", "FAIL"))
    if re.search(r"\bVERIFY_OK\b", content):
        findings.append((rel_path, 0, "VERIFY_OK in conceptual evidence", "FAIL"))
    if re.search(r'"status"\s*:\s*"completed"', content, re.I):
        findings.append((rel_path, 0, "completed runtime status in conceptual evidence", "FAIL"))
    if re.search(r'"execution"\s*:', content, re.I):
        findings.append((rel_path, 0, "execution object in conceptual evidence", "FAIL"))
    if RUNTIME_FIXTURE_RE.search(content):
        findings.append((rel_path, 0, "runtime-like hash/signature fixture", "FAIL"))
    return findings


def check_file(filepath, root):
    findings = []
    rel_path = get_relative_path(filepath, root)
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as handle:
            content = handle.read()
    except OSError:
        return findings

    for line_num, line in enumerate(content.splitlines(), 1):
        for rule in CONTENT_RULES:
            if is_self_pattern_literal(rel_path, line):
                continue
            if rule.pattern.search(line):
                findings.append((rel_path, line_num, rule.label, "FAIL"))
        assignment = SECRET_ASSIGNMENT_RE.search(line)
        if assignment and not is_self_pattern_literal(rel_path, line):
            if not is_safe_placeholder(assignment.group(2)):
                findings.append((rel_path, line_num, "non-placeholder secret assignment", "FAIL"))

        for pattern in PATH_SENSITIVE_PATTERNS:
            if pattern.lower() not in line.lower() or rel_path in LOCALHOST_ALLOWED_FILES:
                continue
            if rel_path in ("tools/export_audit.py", "package-lock.json"):
                continue
            line_lower = line.lower()
            if not any(marker in line_lower for marker in ("must not", "forbidden", "avoid", "ignore", "not allowed")):
                findings.append((rel_path, line_num, pattern, "WARN"))

    if rel_path == "package-lock.json":
        findings.extend(check_package_lock(content, rel_path))
    if is_evidence_file(rel_path):
        findings.extend(check_evidence(content, rel_path))
    return findings


def structural_finding(rel_path):
    basename = os.path.basename(rel_path)
    lowered = basename.lower()
    if any(rel_path.startswith(prefix) for prefix in FORBIDDEN_PUBLIC_PREFIXES):
        return "forbidden public path"
    if rel_path.startswith("examples/evidence/") and not rel_path.endswith(".public.json"):
        return "non-public evidence filename"
    if basename in FORBIDDEN_BASENAMES or lowered == ".env" or lowered.startswith(".env."):
        return "forbidden sensitive filename"
    if lowered.endswith(FORBIDDEN_SUFFIXES):
        return "forbidden sensitive file type"
    return None


def audit(root):
    root = os.path.abspath(root)
    findings = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [name for name in dirnames if name not in SKIP_DIRS]
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            rel_path = get_relative_path(filepath, root)
            reason = structural_finding(rel_path)
            if reason:
                findings.append((rel_path, 0, reason, "FAIL"))
                continue
            if is_text_file(filepath):
                findings.extend(check_file(filepath, root))
    return findings


def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/export_audit.py <directory>")
        sys.exit(1)
    root = os.path.abspath(sys.argv[1])
    if not os.path.isdir(root):
        print(f"Error: {root} is not a directory")
        sys.exit(1)
    findings = audit(root)
    fails = [finding for finding in findings if finding[3] == "FAIL"]
    warns = [finding for finding in findings if finding[3] == "WARN"]
    if fails:
        print("=== EXPORT AUDIT: HARD FAILURES ===")
        for filepath, line_num, pattern, severity in fails:
            print(f'  {severity}: {filepath}:{line_num} — "{pattern}"')
        print()
    if warns:
        print("=== EXPORT AUDIT: WARNINGS ===")
        for filepath, line_num, pattern, severity in warns:
            print(f'  {severity}: {filepath}:{line_num} — "{pattern}"')
        print()
    print(f"Export audit complete: {len(fails)} FAIL, {len(warns)} WARN")
    if fails:
        print("RESULT: FAIL — export violations found")
        sys.exit(1)
    print("RESULT: PASS — no export violations")


if __name__ == "__main__":
    main()
