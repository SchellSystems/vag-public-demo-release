#!/usr/bin/env python3
"""Export audit tool for VAG public demo quarantine repository.

Scans all text files for secrets, private paths, tokens, and other
sensitive content that must not be exported.
Exit code 0: no hard violations found.
Exit code 1: hard violations found.
"""

import os
import sys
import json

import re

# Patterns checked case-insensitively for secret/token/password/bearer/api-key detection
CASE_INSENSITIVE_PATTERNS = [
    re.compile(r"api[_\-]?key", re.IGNORECASE),
    re.compile(r"secret", re.IGNORECASE),
    re.compile(r"token", re.IGNORECASE),
    re.compile(r"password", re.IGNORECASE),
    re.compile(r"bearer", re.IGNORECASE),
    re.compile(r"private[_\-]?key", re.IGNORECASE),
    re.compile(r"access[_\-]?token", re.IGNORECASE),
    re.compile(r"refresh[_\-]?token", re.IGNORECASE),
    re.compile(r"client[_\-]?secret", re.IGNORECASE),
]

# Patterns checked case-sensitively (specific prefixes/literals)
CASE_SENSITIVE_PATTERNS = [
    "ghp_",
    "github_pat_",
    "sk-",
    "-----BEGIN",
    "C:\\Users",
    "AppData",
    "3D Objects",
    ".env",
    "mcp.json",
]

# Patterns that are hard-fail in evidence/JSON but warn in markdown
PATH_SENSITIVE_PATTERNS = [
    "workspace",
    "localhost",
    "127.0.0.1",
    "Desktop",
    "file://",
]

SKIP_DIRS = {".git", "__pycache__", "node_modules", ".github", "dist"}
# Files where pattern checks are skipped entirely (auto-generated)
SKIP_FILES = {"package-lock.json"}
TEXT_EXTENSIONS = {
    ".md", ".txt", ".py", ".yml", ".yaml", ".json", ".js", ".ts",
    ".html", ".css", ".sh", ".bat", ".cfg", ".ini", ".toml",
}

# Files where certain patterns are legitimate (self-references in tools)
TOOL_FILES = {"tools/check_claims.py", "tools/export_audit.py"}

# Official license text can contain generic terms such as "password" or "key".
LICENSE_FILES = {
    "LICENSE", "LICENSE.md", "LICENSE.txt",
    "COPYING", "COPYING.md", "COPYING.txt",
}

# Directories where pattern references are legitimate (internal review docs)
INTERNAL_REVIEW_PREFIXES = ["docs/internal/"]

# Files where localhost/127.0.0.1 references are legitimate (demo config)
LOCALHOST_ALLOWED_FILES = {
    "demo-gateway/README.md",
    "demo-gateway/src/server.mjs",
    "demo-gateway/src/core.mjs",
    "demo-ui/src/constants.ts",
    "demo-ui/src/services/gateway.ts",
    "demo-ui/vite.config.ts",
    "tools/public_demo_probe.mjs",
    "tools/gateway_smoke.mjs",
    "docs/demo/walkthrough.md",
    "docs/demo/runbook.md",
    "docs/demo/threat-model.md",
    "docs/architecture/authority-boundaries.md",
    "README.md",
}


def is_text_file(filepath):
    """Check if a file is likely a text file."""
    _, ext = os.path.splitext(filepath)
    if ext.lower() in TEXT_EXTENSIONS:
        return True
    if not ext:
        try:
            with open(filepath, "rb") as f:
                chunk = f.read(1024)
                return b"\x00" not in chunk
        except (IOError, OSError):
            return False
    return False


def get_relative_path(filepath, root):
    """Get relative path from root."""
    return os.path.relpath(filepath, root).replace(os.sep, "/")


def is_evidence_file(rel_path):
    """Check if file is in evidence examples directory."""
    return rel_path.startswith("examples/evidence/") and rel_path.endswith(".json")


def is_tool_file(rel_path):
    """Check if file is one of the audit tools themselves."""
    return rel_path in TOOL_FILES


def is_license_file(rel_path):
    """Check if file is a conventional license text file."""
    return rel_path in LICENSE_FILES


def is_internal_review_file(rel_path):
    """Check if file is in the internal review docs directory."""
    return any(rel_path.startswith(prefix) for prefix in INTERNAL_REVIEW_PREFIXES)


def check_file(filepath, root):
    """Check a single file for export violations."""
    findings = []
    rel_path = get_relative_path(filepath, root)

    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            lines = content.splitlines()
    except (IOError, OSError):
        return findings

    for line_num, line in enumerate(lines, 1):
        # Check case-insensitive patterns (secret/token/password/bearer/api-key)
        for pattern in CASE_INSENSITIVE_PATTERNS:
            if pattern.search(line):
                # Skip if this is a tool file referencing patterns
                if is_tool_file(rel_path) or is_license_file(rel_path) or is_internal_review_file(rel_path):
                    continue
                # Skip .gitignore for legitimate exclusion patterns
                if rel_path == ".gitignore":
                    continue
                # Evidence files always hard-fail
                if is_evidence_file(rel_path):
                    findings.append((rel_path, line_num, pattern.pattern, "FAIL"))
                else:
                    # In documentation, check if the reference is meta/policy context
                    context_markers = [
                        "must not", "forbidden", "verboten", "not allowed",
                        "hard-fail", "avoid", "no local", "no secrets",
                        "exported", "gitignore", "ignore", "do not",
                        "not present", "not export", "non-claim",
                        "no real", "no private", "submit",
                        "exposed", "risk", "detection", "audit",
                        "sanitization", "check", "scan",
                    ]
                    line_lower = line.lower()
                    is_meta = any(m in line_lower for m in context_markers)
                    if not is_meta:
                        start = max(0, line_num - 3)
                        end = min(len(lines), line_num + 1)
                        context = "\n".join(lines[start:end]).lower()
                        is_meta = any(m in context for m in context_markers)
                    if not is_meta:
                        findings.append(
                            (rel_path, line_num, pattern.pattern, "FAIL")
                        )

        # Check case-sensitive patterns
        for pattern in CASE_SENSITIVE_PATTERNS:
            if pattern in line:
                # Skip if this is a tool file referencing patterns
                if is_tool_file(rel_path) or is_internal_review_file(rel_path):
                    continue
                # Skip .gitignore for legitimate exclusion patterns
                if rel_path == ".gitignore":
                    continue
                findings.append((rel_path, line_num, pattern, "FAIL"))

        # Check path-sensitive patterns
        for pattern in PATH_SENSITIVE_PATTERNS:
            if pattern.lower() in line.lower():
                # Skip tool files
                if is_tool_file(rel_path) or is_internal_review_file(rel_path):
                    continue
                # Skip files where localhost references are legitimate
                if rel_path in LOCALHOST_ALLOWED_FILES:
                    continue
                if is_evidence_file(rel_path):
                    findings.append((rel_path, line_num, pattern, "FAIL"))
                else:
                    # Warn in markdown, but only if not clearly documenting
                    # what to avoid
                    context_markers = [
                        "must not",
                        "forbidden",
                        "verboten",
                        "not allowed",
                        "hard-fail",
                        "avoid",
                        "no local",
                        "no secrets",
                        "exported",
                        "gitignore",
                        "ignore",
                    ]
                    line_lower = line.lower()
                    is_meta = any(m in line_lower for m in context_markers)
                    if not is_meta:
                        # Check surrounding context
                        start = max(0, line_num - 3)
                        end = min(len(lines), line_num + 1)
                        context = "\n".join(lines[start:end]).lower()
                        is_meta = any(m in context for m in context_markers)

                    if not is_meta:
                        findings.append((rel_path, line_num, pattern, "WARN"))

    # Special checks for evidence files
    if is_evidence_file(rel_path):
        try:
            data = json.loads(content)
            if not data.get("synthetic"):
                findings.append(
                    (rel_path, 0, "missing synthetic: true", "FAIL")
                )
            if not data.get("not_real_evidence"):
                findings.append(
                    (rel_path, 0, "missing not_real_evidence: true", "FAIL")
                )
            if not data.get("not_from_private_runtime"):
                findings.append(
                    (rel_path, 0, "missing not_from_private_runtime: true", "FAIL")
                )
        except (json.JSONDecodeError, ValueError):
            findings.append(
                (rel_path, 0, "invalid JSON in evidence file", "FAIL")
            )

    return findings


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python tools/export_audit.py <directory>")
        sys.exit(1)

    root = os.path.abspath(sys.argv[1])
    if not os.path.isdir(root):
        print(f"Error: {root} is not a directory")
        sys.exit(1)

    all_findings = []

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            rel_path = get_relative_path(filepath, root)
            if rel_path in SKIP_FILES:
                continue
            if is_text_file(filepath):
                findings = check_file(filepath, root)
                all_findings.extend(findings)

    # Report findings
    fails = [f for f in all_findings if f[3] == "FAIL"]
    warns = [f for f in all_findings if f[3] == "WARN"]

    if fails:
        print("=== EXPORT AUDIT: HARD FAILURES ===")
        for filepath, line_num, pattern, severity in fails:
            print(f"  {severity}: {filepath}:{line_num} — \"{pattern}\"")
        print()

    if warns:
        print("=== EXPORT AUDIT: WARNINGS ===")
        for filepath, line_num, pattern, severity in warns:
            print(f"  {severity}: {filepath}:{line_num} — \"{pattern}\"")
        print()

    total_fails = len(fails)
    total_warns = len(warns)

    print(f"Export audit complete: {total_fails} FAIL, {total_warns} WARN")

    if total_fails > 0:
        print("RESULT: FAIL — export violations found")
        sys.exit(1)
    else:
        print("RESULT: PASS — no export violations")
        sys.exit(0)


if __name__ == "__main__":
    main()
