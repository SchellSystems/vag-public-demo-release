import tempfile
import unittest
from pathlib import Path

from tools import check_claims


REPO_ROOT = Path(__file__).resolve().parents[2]


class ClaimAuditTests(unittest.TestCase):
    def audit_files(self, files):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for relative, content in files.items():
                path = root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding="utf-8")
            return check_claims.audit(root)

    def assert_fails(self, files):
        findings = self.audit_files(files)
        self.assertTrue(any(item[3] == "FAIL" for item in findings), findings)

    def assert_passes(self, files):
        findings = self.audit_files(files)
        self.assertFalse(any(item[3] == "FAIL" for item in findings), findings)

    def test_positive_claim_families_fail(self):
        claims = [
            "This demo is production" + "-ready.",
            "This system is compliance" + " certified.",
            "This product provides a security" + " guarantee.",
            "The gateway provides a sand" + "box.",
            "The runtime ensures network " + "isolation.",
            "This is an enterprise " + "security platform.",
            "The demo is externally " + "integrated.",
            "It provides system-wide " + "enforcement.",
            "A ToolGrant " + "subsystem is active.",
            "The gateway observes external " + "execution.",
            "Commit binds what was " + "executed.",
            "Verify " + "approves the action.",
            "Evidence proves " + "compliance.",
        ]
        for index, claim in enumerate(claims):
            with self.subTest(claim=index):
                self.assert_fails({"claim.md": claim})

    def test_same_line_and_structured_non_claims_pass(self):
        term = "production" + "-ready"
        files = {
            "README.md": f"This demo is not {term}.\n",
            "evidence.json": '{"non_claims": ["' + term + '"]}\n',
        }
        self.assert_passes(files)

    def test_named_platform_integration_claim_and_non_claim(self):
        claim = "The demo is integrated with " + "AWS."
        non_claim = "The demo is not integrated with " + "AWS."
        self.assert_fails({"claim.md": claim})
        self.assert_passes({"non-claim.md": non_claim})

    def test_direct_security_claim_and_non_claim(self):
        claim = "The public demo is " + "secure."
        non_claim = "The public demo is not " + "secure."
        self.assert_fails({"claim.md": claim})
        self.assert_passes({"non-claim.md": non_claim})

    def test_positive_sentence_inside_non_claim_section_fails(self):
        claim = "This demo is production" + "-ready."
        self.assert_fails({"README.md": "## Non-Claims\n\n" + claim + "\n"})

    def test_positive_bullet_inside_non_claim_section_fails(self):
        claim = "- This demo is production" + "-ready\n"
        self.assert_fails({"README.md": "## Non-Claims\n\n" + claim})

    def test_bare_term_inside_non_claim_section_passes(self):
        claim = "production" + "-ready"
        self.assert_passes({"README.md": "## Non-Claims\n\n- " + claim + "\n"})

    def test_prior_negation_does_not_mask_later_claim(self):
        claim = "This demo is production" + "-ready."
        content = "This is not a broad claim.\n" + claim + "\n"
        self.assert_fails({"README.md": content})

    def test_github_is_scanned(self):
        claim = "Verify " + "authorizes actions."
        self.assert_fails({".github/workflows/audit.yml": "name: " + claim + "\n"})

    def test_docs_internal_is_structurally_forbidden(self):
        self.assert_fails({"docs/internal/review.md": "private review\n"})

    def test_current_repository_is_a_regression_fixture(self):
        findings = check_claims.audit(REPO_ROOT)
        fails = [item for item in findings if item[3] == "FAIL"]
        self.assertEqual([], fails)


if __name__ == "__main__":
    unittest.main()
