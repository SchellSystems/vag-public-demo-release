import json
import tempfile
import unittest
from pathlib import Path

from tools import export_audit


REPO_ROOT = Path(__file__).resolve().parents[2]


class ExportAuditTests(unittest.TestCase):
    def audit_files(self, files):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for relative, content in files.items():
                path = root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding="utf-8")
            return export_audit.audit(root)

    def assert_fails(self, files):
        findings = self.audit_files(files)
        self.assertTrue(any(item[3] == "FAIL" for item in findings), findings)

    def assert_passes(self, files):
        findings = self.audit_files(files)
        self.assertFalse(any(item[3] == "FAIL" for item in findings), findings)

    def evidence(self):
        return {
            "synthetic": True,
            "conceptual_example": True,
            "runtime_replayable": False,
            "not_real_evidence": True,
            "not_from_private_runtime": True,
        }

    def test_generic_policy_words_and_placeholders_pass(self):
        content = "token key password are policy words\napi_key=<PLACEHOLDER>\n"
        self.assert_passes({"policy.md": content})

    def test_non_placeholder_secret_assignment_fails(self):
        value = "not" + "-a-placeholder-value"
        self.assert_fails({"config.yml": "client_secret: " + value + "\n"})

    def test_credential_bearing_url_fails(self):
        url = "https://user:" + "credential@example.test/package"
        self.assert_fails({"config.txt": url + "\n"})

    def test_github_is_scanned(self):
        value = "not" + "-a-placeholder-value"
        self.assert_fails({".github/workflows/audit.yml": "password: " + value + "\n"})

    def test_forbidden_paths_and_file_types_fail(self):
        cases = [
            "docs/internal/review.md", "logs/runtime.txt", "private/data.txt",
            ".env", "artifact.pem", "trace.log", "capture.har", "state.db",
        ]
        for path in cases:
            with self.subTest(path=path):
                self.assert_fails({path: "fixture\n"})

    def test_absolute_local_path_fails(self):
        path = "/Users/" + "owner/private/file.txt"
        self.assert_fails({"notes.md": path + "\n"})

    def test_private_repository_url_fails(self):
        url = "https://github.com/SchellSystems/" + "VAG-v1-main"
        self.assert_fails({"notes.md": url + "\n"})

    def test_public_package_lock_passes(self):
        lock = {
            "name": "fixture",
            "lockfileVersion": 3,
            "packages": {
                "node_modules/pkg": {
                    "resolved": "https://registry.npmjs.org/pkg/-/pkg-1.0.0.tgz",
                    "integrity": "sha512-example",
                }
            },
        }
        self.assert_passes({"package-lock.json": json.dumps(lock)})

    def test_private_or_file_lock_source_fails(self):
        sources = [
            "file:" + "../private-package",
            "https://registry." + "example.com/pkg.tgz",
            "https://user:" + "credential@registry.npmjs.org/pkg.tgz",
        ]
        for source in sources:
            with self.subTest(source=source):
                lock = {"lockfileVersion": 3, "packages": {"pkg": {"resolved": source}}}
                self.assert_fails({"package-lock.json": json.dumps(lock)})

    def test_valid_conceptual_evidence_passes(self):
        self.assert_passes({
            "examples/evidence/example.public.json": json.dumps(self.evidence())
        })

    def test_missing_or_wrong_evidence_flags_fail(self):
        expected = self.evidence()
        for key, value in expected.items():
            with self.subTest(key=key):
                data = self.evidence()
                data[key] = not value
                self.assert_fails({
                    "examples/evidence/example.public.json": json.dumps(data)
                })

    def test_invalid_evidence_json_fails(self):
        self.assert_fails({"examples/evidence/example.public.json": "{invalid"})

    def test_runtime_like_evidence_semantics_fail(self):
        variants = [
            {"result": "VERIFY" + "_OK"},
            {"status": "completed"},
            {"execution": {"status": "done"}},
            {"record_hash": "a" * 64},
        ]
        for addition in variants:
            with self.subTest(addition=addition):
                data = self.evidence()
                data.update(addition)
                self.assert_fails({
                    "examples/evidence/example.public.json": json.dumps(data)
                })

    def test_non_public_evidence_filename_fails(self):
        self.assert_fails({"examples/evidence/runtime.json": "{}\n"})

    def test_current_repository_is_a_regression_fixture(self):
        findings = export_audit.audit(REPO_ROOT)
        fails = [item for item in findings if item[3] == "FAIL"]
        self.assertEqual([], fails)


if __name__ == "__main__":
    unittest.main()
