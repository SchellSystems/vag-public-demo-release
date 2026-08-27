import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
WORKFLOW_DIR = ROOT / ".github" / "workflows"
AUDIT_WORKFLOW = WORKFLOW_DIR / "audit.yml"
ALLOWED_CONTROL_BYTES = {0x09, 0x0A, 0x0D}


class WorkflowHygieneTests(unittest.TestCase):
    def workflow_paths(self):
        paths = sorted(
            path
            for pattern in ("*.yml", "*.yaml")
            for path in WORKFLOW_DIR.glob(pattern)
        )
        self.assertTrue(paths, "at least one GitHub Actions workflow must exist")
        return paths

    def test_workflows_are_strict_utf8_without_forbidden_control_bytes(self):
        for path in self.workflow_paths():
            with self.subTest(path=path.relative_to(ROOT)):
                raw = path.read_bytes()
                try:
                    raw.decode("utf-8", errors="strict")
                except UnicodeDecodeError as error:
                    self.fail(f"{path.relative_to(ROOT)} is not strict UTF-8: {error}")

                forbidden = [
                    (offset, byte)
                    for offset, byte in enumerate(raw)
                    if (byte < 0x20 and byte not in ALLOWED_CONTROL_BYTES)
                    or byte == 0x7F
                ]
                self.assertEqual(
                    forbidden,
                    [],
                    f"{path.relative_to(ROOT)} contains forbidden control bytes",
                )

    def test_full_tree_audit_is_a_blocking_normal_ci_gate(self):
        workflow = AUDIT_WORKFLOW.read_text(encoding="utf-8", errors="strict")
        match = re.search(
            r"(?ms)^\s*- name: Audit build supply chain\s*$"
            r"(?P<body>.*?)(?=^\s*- name:|\Z)",
            workflow,
        )
        self.assertIsNotNone(match, "normal CI must contain the full-tree audit step")
        step = match.group(0)
        self.assertIn("run: npm audit --audit-level=high", step)
        self.assertNotIn("continue-on-error", step)


if __name__ == "__main__":
    unittest.main()
