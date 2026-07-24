#!/usr/bin/env python3
"""Audit public-demo text for prohibited positive claims.

Exit code 0 means no hard claim violations were found. Warnings remain
review signals and do not turn this bounded check into a security assessment.
"""

from dataclasses import dataclass
import os
import re
import sys


@dataclass(frozen=True)
class ClaimRule:
    label: str
    pattern: re.Pattern[str]


# Keep each detector on one line so the narrow self-reference exemption can
# identify pattern declarations without exempting the rest of this file.
CLAIM_RULES = [
    ClaimRule("production readiness", re.compile(r"\b(?:production[\s-]?(?:ready|grade)|ready\s+for\s+production|public[\s-]?ready)\b", re.I)),
    ClaimRule("compliance claim", re.compile(r"\b(?:compliance[\s-]?(?:ready|certified)|certified\s+compliant|compliance\s+proof|proves?\s+compliance)\b", re.I)),
    ClaimRule("security claim", re.compile(r"\b(?:security[\s-]?(?:ready|guarantee)|certified\s+secure|secure\s+by\s+design|(?:is|are)\s+secure|provides?\s+security(?!\s+(?:policy|documentation|guidance|contact|reporting|review|notice))|guarantees?\s+security)\b", re.I)),
    ClaimRule("sandbox claim", re.compile(r"\b(?:(?:is|provides?|creates?|implements?)\s+(?:an?\s+)?sandbox|sandboxed)\b", re.I)),
    ClaimRule("isolation claim", re.compile(r"\b(?:(?:provides?|ensures?|guarantees?|implements?)\s+(?:os|browser|network|process|filesystem|system)?[\s-]*isolation|(?:os|browser|network|process|filesystem)[\s-]+level\s+isolation)\b", re.I)),
    ClaimRule("enterprise claim", re.compile(r"\b(?:enterprise[\s-]?(?:ready|grade)|enterprise\s+security(?:\s+(?:platform|product))?|enterprise[\s-]security[\s-]certified)\b", re.I)),
    ClaimRule("external integration claim", re.compile(r"\b(?:externally\s+integrated|integrated\s+with\s+(?:(?:an?|the)\s+)?[A-Za-z][A-Za-z0-9.+-]*(?:\s+[A-Za-z][A-Za-z0-9.+-]*){0,2}|external\s+(?:production\s+platform|platform|workflow)\s+integration|regulated\s+external\s+workflow\s+integration|production\s+transaction\s+workflow)\b", re.I)),
    ClaimRule("system-wide claim", re.compile(r"\bsystem[\s-]wide\s+(?:enforcement|blocking|blockade|non[\s-]execution)\b", re.I)),
    ClaimRule("execution blocking claim", re.compile(r"\b(?:blocks?|prevents?|guarantees?)\s+(?:all\s+|external\s+|system[\s-]wide\s+)?(?:execution|network|browser|filesystem|os\s+execution)\b", re.I)),
    ClaimRule("ToolGrant subsystem claim", re.compile(r"\bToolGrant\s+(?:subsystem|system|service|issued|produced)\b", re.I)),
    ClaimRule("gateway execution-observation claim", re.compile(r"\bgateway\b.{0,100}\b(?:observes?|monitors?|captures?)\b.{0,60}\bexternal\s+execution\b", re.I)),
    ClaimRule("commit execution-binding claim", re.compile(r"\bcommit\b.{0,100}\b(?:what\s+was\s+executed|executed\s+output|execution\s+artifact)\b", re.I)),
    ClaimRule("Verify authority claim", re.compile(r"\bVerify\s+(?:approves?|authorizes?|certifies?|governs?)\b", re.I)),
    ClaimRule("Evidence proof claim", re.compile(r"\bEvidence\s+(?:proves?|certifies?)\s+(?:compliance|security|safety)\b", re.I)),
]

WARN_WORDS = ["security", "secure", "sandbox", "isolation", "certified"]

# Warnings are suppressed only for known public files where the words are
# necessary to state boundaries. Hard claim rules still run in these files.
ALLOWLISTED_FILES = {
    "SECURITY.md": ["security", "secure"],
    "docs/claims-and-nonclaims.md": WARN_WORDS,
    "docs/public-faq.md": WARN_WORDS,
    "docs/authority-boundaries.md": ["sandbox", "isolation"],
    "docs/architecture.md": ["sandbox", "isolation"],
    "docs/architecture/authority-boundaries.md": ["sandbox", "isolation"],
    "docs/demo/threat-model.md": WARN_WORDS,
    "docs/demo/walkthrough.md": ["security"],
    "docs/demo/runbook.md": ["security", "sandbox"],
    "README.md": ["security", "isolation", "sandbox"],
    "tools/check_claims.py": WARN_WORDS,
    "tools/export_audit.py": WARN_WORDS,
    "test/audit/test_check_claims.py": WARN_WORDS,
    "examples/evidence/bounded-demo-evidence.public.json": ["security"],
    "examples/evidence/deny-path.public.json": ["security", "sandbox", "isolation"],
    "examples/evidence/verify-integrity.public.json": ["security"],
    "docs/demo-script-3min.md": ["security"],
    "docs/demo-script-10min.md": ["security"],
    "demo-gateway/README.md": ["security", "sandbox", "isolation"],
    "demo-gateway/src/core.mjs": ["security"],
    "demo-ui/src/constants.ts": ["security", "sandbox", "isolation"],
    "desktop/main.mjs": ["sandbox"],
    "forge.config.mjs": ["sandbox"],
}

SKIP_DIRS = {".git", "__pycache__", "node_modules", "dist"}
TEXT_EXTENSIONS = {
    ".md", ".txt", ".py", ".yml", ".yaml", ".json", ".js", ".ts",
    ".html", ".css", ".sh", ".bat", ".cfg", ".ini", ".toml",
}
FORBIDDEN_PUBLIC_PREFIXES = ("docs/internal/",)
NEGATIVE_SECTION_RE = re.compile(
    r"\b(?:non[\s-]?claims?|forbidden\s+claims?|not\s+included|out\s+of\s+scope|incorrect\s+interpretations?|does\s+not(?:\s+(?:claim|cover|show|mean|prove))?|explicit\s+non[\s-]?authorities)\b",
    re.I,
)
NEGATION_RE = re.compile(
    r"\b(?:no|not|never|without|cannot|can't|does\s+not|do\s+not|is\s+not|are\s+not|must\s+not|must\s+never|doesn't|isn't|aren't|forbidden|disallowed|avoid|rejects?|outside\s+(?:this|the)\b.{0,40}\bscope|prevents?\s+the\s+claim)\b",
    re.I,
)
STRUCTURED_NEGATION_RE = re.compile(
    r"(?:non_claims|not_[a-z0-9_]+|what_[a-z0-9_]+_does_not_mean|deny_non_claim|explicitly_forbidden)",
    re.I,
)
ASSERTIVE_SENTENCE_RE = re.compile(
    r"^(?:this|the|vag|gateway|verify|evidence|commit|deny|it|we)\b.{0,100}\b(?:is|are|has|provides?|proves?|approves?|authorizes?|certifies?|implements?|observes?|binds?)\b",
    re.I,
)


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


def is_self_pattern_literal(rel_path, line):
    """Exempt only detector declarations, never the full audit tool."""
    return rel_path == "tools/check_claims.py" and "ClaimRule(" in line


def is_bare_negative_item(line, section, matched_text):
    if not NEGATIVE_SECTION_RE.search(section):
        return False
    stripped = line.strip()
    if not stripped or stripped.startswith("#"):
        return False
    item = stripped.lstrip("-* ").strip().strip("`\"',:; ")
    matched = matched_text.strip().strip("`\"'.:; ")
    if item.endswith((".", "!", "?")):
        return False
    if section.lower().replace("-", " ").startswith("non claims") and ASSERTIVE_SENTENCE_RE.search(item):
        return False
    return matched.lower() in item.lower() and len(item.split()) <= 12


def is_negated(line, match, section, previous_line=""):
    stripped = line.strip()
    if stripped.startswith("#") and stripped.endswith("?"):
        return True
    if STRUCTURED_NEGATION_RE.search(line):
        return True
    nearby = line[max(0, match.start() - 200):match.end() + 200]
    if NEGATION_RE.search(nearby):
        return True
    if line.lstrip().lower().startswith(("and ", "or ")) and NEGATION_RE.search(previous_line):
        return True
    return is_bare_negative_item(line, section, match.group(0))


def check_file(filepath, root):
    findings = []
    rel_path = get_relative_path(filepath, root)
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as handle:
            lines = handle.readlines()
    except OSError:
        return findings

    section = ""
    structured_negative_list = False
    for line_num, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("#"):
            section = stripped.lstrip("#").strip()
            structured_negative_list = False
        elif STRUCTURED_NEGATION_RE.search(line) or (
            NEGATIVE_SECTION_RE.search(line) and stripped.endswith(":")
        ):
            section = "structured non-claims"
            structured_negative_list = True
        elif structured_negative_list and stripped in ("]", "],", "}", "},"):
            structured_negative_list = False

        for rule in CLAIM_RULES:
            for match in rule.pattern.finditer(line):
                if is_self_pattern_literal(rel_path, line):
                    continue
                previous_line = lines[line_num - 2] if line_num > 1 else ""
                if not is_negated(line, match, section, previous_line):
                    findings.append((rel_path, line_num, rule.label, "FAIL"))

        allowed_words = []
        for allowed_file, words in ALLOWLISTED_FILES.items():
            if rel_path == allowed_file or rel_path.endswith(allowed_file):
                allowed_words.extend(words)
        line_lower = line.lower()
        for word in WARN_WORDS:
            if word in allowed_words or word not in line_lower:
                continue
            if not any(rule.pattern.search(line) for rule in CLAIM_RULES):
                findings.append((rel_path, line_num, word, "WARN"))

    return findings


def audit(root):
    root = os.path.abspath(root)
    findings = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [name for name in dirnames if name not in SKIP_DIRS]
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            rel_path = get_relative_path(filepath, root)
            if any(rel_path.startswith(prefix) for prefix in FORBIDDEN_PUBLIC_PREFIXES):
                findings.append((rel_path, 0, "forbidden public path: docs/internal/**", "FAIL"))
                continue
            if is_text_file(filepath):
                findings.extend(check_file(filepath, root))
    return findings


def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/check_claims.py <directory>")
        sys.exit(1)
    root = os.path.abspath(sys.argv[1])
    if not os.path.isdir(root):
        print(f"Error: {root} is not a directory")
        sys.exit(1)

    findings = audit(root)
    fails = [finding for finding in findings if finding[3] == "FAIL"]
    warns = [finding for finding in findings if finding[3] == "WARN"]
    if fails:
        print("=== CLAIM AUDIT: HARD FAILURES ===")
        for filepath, line_num, phrase, severity in fails:
            print(f'  {severity}: {filepath}:{line_num} — "{phrase}"')
        print()
    if warns:
        print("=== CLAIM AUDIT: WARNINGS ===")
        for filepath, line_num, phrase, severity in warns:
            print(f'  {severity}: {filepath}:{line_num} — "{phrase}"')
        print()
    print(f"Claim audit complete: {len(fails)} FAIL, {len(warns)} WARN")
    if fails:
        print("RESULT: FAIL — hard claim violations found")
        sys.exit(1)
    print("RESULT: PASS — no hard claim violations")


if __name__ == "__main__":
    main()
