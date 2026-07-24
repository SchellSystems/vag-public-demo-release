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

    def test_semver_lock_version_passes(self):
        lock = {
            "lockfileVersion": 3,
            "packages": {"node_modules/pkg": {"version": "1.2.3"}},
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

    def test_private_git_lock_version_fails(self):
        source = "git+ssh:" + "//git@github.com/SchellSystems/private-repo.git"
        lock = {"lockfileVersion": 3, "packages": {"pkg": {"version": source}}}
        self.assert_fails({"package-lock.json": json.dumps(lock)})

    def test_private_git_dependency_specifier_fails(self):
        source = "git+https:" + "//github.com/SchellSystems/private-repo.git"
        lock = {
            "lockfileVersion": 3,
            "packages": {"": {"dependencies": {"private-pkg": source}}},
        }
        self.assert_fails({"package-lock.json": json.dumps(lock)})

    def test_git_source_in_dev_dependency_still_fails(self):
        # A git/ssh source inside a dev-flagged package MUST still be reported.
        # This proves devDependencies are not blanket-skipped.
        source = "git+ssh:" + "//git@github.com/attacker/evil.git#deadbeef"
        lock = {
            "lockfileVersion": 3,
            "packages": {
                "node_modules/evil-tool": {"dev": True, "resolved": source},
            },
        }
        self.assert_fails({"package-lock.json": json.dumps(lock)})

    def test_foreign_ssh_source_still_fails(self):
        # A plain ssh:// source for an arbitrary package must be reported.
        source = "ssh:" + "//git@gitlab.example.com/team/pkg.git"
        lock = {
            "lockfileVersion": 3,
            "packages": {"node_modules/pkg": {"resolved": source}},
        }
        self.assert_fails({"package-lock.json": json.dumps(lock)})

    def test_allowlisted_electron_node_gyp_source_passes(self):
        # The pinned Electron build-tooling source is narrowly exempted.
        base = "git+ssh:" + "//git@github.com/electron/node-gyp.git"
        lock = {
            "lockfileVersion": 3,
            "packages": {
                "node_modules/@electron/node-gyp": {
                    "dev": True,
                    "resolved": base + "#06b29aafb7708acef8b3669835c8a7857ebc92d2",
                },
            },
        }
        self.assert_passes({"package-lock.json": json.dumps(lock)})

    def test_allowlist_is_exact_wrong_package_name_still_fails(self):
        # Same Electron URL under a DIFFERENT package name must still fail:
        # the allowlist is an exact (package, source) pair, not a host pass.
        base = "git+ssh:" + "//git@github.com/electron/node-gyp.git"
        lock = {
            "lockfileVersion": 3,
            "packages": {
                "node_modules/not-node-gyp": {
                    "dev": True,
                    "resolved": base + "#06b29aafb7708acef8b3669835c8a7857ebc92d2",
                },
            },
        }
        self.assert_fails({"package-lock.json": json.dumps(lock)})

    def test_allowlist_is_exact_wrong_host_still_fails(self):
        # The allowlisted package name pointed at a FOREIGN host must fail:
        # the source base must match exactly, not just the package name.
        source = "git+ssh:" + "//git@github.com/attacker/node-gyp.git#deadbeef"
        lock = {
            "lockfileVersion": 3,
            "packages": {
                "node_modules/@electron/node-gyp": {
                    "dev": True,
                    "resolved": source,
                },
            },
        }
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
