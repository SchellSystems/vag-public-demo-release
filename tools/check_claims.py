#!/usr/bin/env python3
"""Check claims audit tool for VAG public demo quarantine repository.

Scans all text files for forbidden claims and overclaiming phrases.
Exit code 0: no hard violations found.
Exit code 1: hard violations found.
"""

import os
import sys

HARD_FAIL_PHRASES = [
    "production-ready",
    "public-ready",
    "compliance-ready",
    "security-ready",
    "compliance proof",
    "proves compliance",
    "Evidence proves compliance",
    "Evidence proves security",
    "Verify approves",
    "Verify authorizes",
    "Verify certifies",
    "safety certification",
    "sandboxed",
    "system-wide enforcement",
    "system-wide non-execution",
    "certified secure",
    "enterprise security",
    "enterprise-security-certified",
    "externally integrated with any named third-party platform",
    "OS-level isolation",
    "browser-level isolation",
    "network-level isolation",
    "process-level isolation",
    "filesystem isolation",
    "external production platform integration",
    "regulated external workflow integration",
    "production transaction workflow",
]

WARN_WORDS = [
    "security",
    "secure",
    "sandbox",
    "isolation",
    "certified",
]

# Files where certain warn words are legitimate
ALLOWLISTED_FILES = {
    "SECURITY.md": ["security", "secure"],
    "docs/claims-and-nonclaims.md": ["security", "secure", "sandbox", "isolation", "certified"],
    "docs/public-faq.md": ["security", "secure", "sandbox", "isolation", "certified"],
    "docs/authority-boundaries.md": ["sandbox", "isolation"],
    "docs/architecture.md": ["sandbox", "isolation"],
    "docs/architecture/authority-boundaries.md": ["sandbox", "isolation"],
    "docs/demo/threat-model.md": ["security", "secure", "sandbox", "isolation", "certified"],
    "docs/demo/walkthrough.md": ["security"],
    "docs/demo/runbook.md": ["security", "sandbox"],
    "README.md": ["security", "isolation", "sandbox"],
    "tools/check_claims.py": ["security", "secure", "sandbox", "isolation", "certified"],
    "tools/export_audit.py": ["security", "secure", "sandbox", "isolation", "certified"],
    "examples/evidence/bounded-demo-evidence.public.json": ["security"],
    "examples/evidence/deny-path.public.json": ["security", "sandbox", "isolation"],
    "examples/evidence/verify-integrity.public.json": ["security"],
    "docs/demo-script-3min.md": ["security"],
    "docs/demo-script-10min.md": ["security"],
    "docs/internal/public-export-manifest-v0.md": ["security"],
    "demo-gateway/README.md": ["security", "sandbox", "isolation"],
    "demo-gateway/src/core.mjs": ["security"],
    "demo-ui/src/constants.ts": ["security", "sandbox", "isolation"],
}

SKIP_DIRS = {".git", "__pycache__", "node_modules", ".github", "dist"}
# Files that contain forbidden phrases as part of their audit logic
SKIP_SELF_FILES = {"tools/check_claims.py"}
# Directories where forbidden phrases are legitimate (internal review docs)
SKIP_CLAIM_CHECK_PREFIXES = ["docs/internal/"]
TEXT_EXTENSIONS = {
    ".md", ".txt", ".py", ".yml", ".yaml", ".json", ".js", ".ts",
    ".html", ".css", ".sh", ".bat", ".cfg", ".ini", ".toml",
}


def is_text_file(filepath):
    """Check if a file is likely a text file."""
    _, ext = os.path.splitext(filepath)
    if ext.lower() in TEXT_EXTENSIONS:
        return True
    if not ext:
        # Check for files without extension (like LICENSE)
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


def check_file(filepath, root):
    """Check a single file for claim violations."""
    findings = []
    rel_path = get_relative_path(filepath, root)

    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
    except (IOError, OSError):
        return findings

    for line_num, line in enumerate(lines, 1):
        line_lower = line.lower()

        # Check hard-fail phrases
        for phrase in HARD_FAIL_PHRASES:
            if phrase.lower() in line_lower:
                # Check if this is in a context where it's listing forbidden things
                context_markers = [
                    "forbidden",
                    "non-claim",
                    "non_claim",
                    "not claim",
                    "does not claim",
                    "does not mean",
                    "does not prove",
                    "not:",
                    "hard-fail",
                    "hard_fail",
                    "hard fail",
                    "HARD_FAIL",
                    "forbidden claims",
                    "nicht",
                    "verboten",
                    "not_",
                    "non_claims",
                    "what_verify_does_not_mean",
                    "what_deny_does_not_mean",
                    "explicitly forbidden",
                    "is not",
                    "is this",
                    "no.",
                    "## non-claims",
                    "## forbidden claims",
                    "also:",
                    "### forbidden",
                ]
                is_meta_context = any(
                    marker.lower() in line_lower for marker in context_markers
                )
                # Also check surrounding lines for context (wide window)
                if not is_meta_context:
                    start = max(0, line_num - 18)
                    end = min(len(lines), line_num + 2)
                    context_block = "".join(lines[start:end]).lower()
                    is_meta_context = any(
                        marker.lower() in context_block for marker in context_markers
                    )

                if not is_meta_context:
                    findings.append((rel_path, line_num, phrase, "FAIL"))

        # Check warn words (only if not in allowlisted context)
        allowlisted_words = []
        for allowed_file, words in ALLOWLISTED_FILES.items():
            if rel_path.endswith(allowed_file) or rel_path == allowed_file:
                allowlisted_words.extend(words)

        for word in WARN_WORDS:
            if word in allowlisted_words:
                continue
            if word.lower() in line_lower:
                # Only warn if it's not part of a hard-fail phrase already caught
                already_caught = any(
                    phrase.lower() in line_lower
                    for phrase in HARD_FAIL_PHRASES
                    if word.lower() in phrase.lower()
                )
                if not already_caught:
                    findings.append((rel_path, line_num, word, "WARN"))

    return findings


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python tools/check_claims.py <directory>")
        sys.exit(1)

    root = os.path.abspath(sys.argv[1])
    if not os.path.isdir(root):
        print(f"Error: {root} is not a directory")
        sys.exit(1)

    all_findings = []

    for dirpath, dirnames, filenames in os.walk(root):
        # Skip directories
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            rel_path = get_relative_path(filepath, root)
            if rel_path in SKIP_SELF_FILES:
                continue
            if any(rel_path.startswith(prefix) for prefix in SKIP_CLAIM_CHECK_PREFIXES):
                continue
            if is_text_file(filepath):
                findings = check_file(filepath, root)
                all_findings.extend(findings)

    # Report findings
    fails = [f for f in all_findings if f[3] == "FAIL"]
    warns = [f for f in all_findings if f[3] == "WARN"]

    if fails:
        print("=== CLAIM AUDIT: HARD FAILURES ===")
        for filepath, line_num, phrase, severity in fails:
            print(f"  {severity}: {filepath}:{line_num} — \"{phrase}\"")
        print()

    if warns:
        print("=== CLAIM AUDIT: WARNINGS ===")
        for filepath, line_num, phrase, severity in warns:
            print(f"  {severity}: {filepath}:{line_num} — \"{phrase}\"")
        print()

    total_fails = len(fails)
    total_warns = len(warns)

    print(f"Claim audit complete: {total_fails} FAIL, {total_warns} WARN")

    if total_fails > 0:
        print("RESULT: FAIL — hard claim violations found")
        sys.exit(1)
    else:
        print("RESULT: PASS — no hard claim violations")
        sys.exit(0)


if __name__ == "__main__":
    main()
