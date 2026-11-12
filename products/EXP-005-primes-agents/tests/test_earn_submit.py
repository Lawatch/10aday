import io, json, os, sys, contextlib, tempfile, unittest
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import earn_submit as sub  # noqa: E402

GOOD = {"listingId": "abc", "slug": "build-a-cli-tool",
        "link": "https://github.com/Lawatch/10aday/tree/main/products/EXP-005-primes-agents/x",
        "otherInfo": "CLI testée. Réalisé par des agents IA (système 10aday).",
        "eligibilityAnswers": [{"question": "Repo?", "answer": "Lien ci-dessus"}], "ask": None}
DET = {"type": "bounty", "status": "OPEN", "compensationType": "fixed",
       "eligibility": [{"question": "Repo?"}]}


class T(unittest.TestCase):
    def setUp(self):
        os.environ.pop("EARN_TELEGRAM", None)

    def test_good_ready(self):
        self.assertEqual(sub.check(GOOD, DET), [])
        self.assertEqual(sub.payload(GOOD)["tweet"], "")
        self.assertNotIn("telegram", sub.payload(GOOD))

    def test_missing_ai_mention_and_link(self):
        d = dict(GOOD, otherInfo="Fait main.", link="https://evil.example/x")
        e = sub.check(d)
        self.assertTrue(any("agents IA" in x for x in e))
        self.assertTrue(any("hors du dépôt" in x for x in e))

    def test_secret_fields_rejected(self):
        self.assertTrue(any("interdit" in x for x in sub.check(dict(GOOD, claimCode="x"))))
        self.assertTrue(any("interdit" in x for x in sub.check(dict(GOOD, telegram="t.me/x"))))

    def test_details_rules(self):
        det = dict(DET, eligibility=[{"question": "Repo?"}, {"question": "Wallet?"}])
        self.assertIn("question sans réponse : Wallet?", sub.check(GOOD, det))
        self.assertTrue(any("Telegram" in x for x in sub.check(GOOD, dict(DET, type="project"))))
        rng = dict(DET, compensationType="range", minRewardAsk=100, maxRewardAsk=500)
        self.assertTrue(any("ask" in x for x in sub.check(GOOD, rng)))
        self.assertTrue(any("hors de la fourchette" in x for x in sub.check(dict(GOOD, ask=900), rng)))
        self.assertEqual(sub.check(dict(GOOD, ask=300), rng), [])
        self.assertTrue(any("non ouverte" in x for x in sub.check(GOOD, dict(DET, status="CLOSED"))))

    def test_cli_dry_run_never_sends(self):
        with tempfile.TemporaryDirectory() as t:
            p, q = os.path.join(t, "d.json"), os.path.join(t, "det.json")
            json.dump(GOOD, open(p, "w")); json.dump(DET, open(q, "w"))
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                self.assertEqual(sub.main([p, "--details", q]), 0)
            self.assertIn("simulation", buf.getvalue())
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(sub.main([p, "--details", q, "--send"]), 1)  # sans --yes


if __name__ == "__main__":
    unittest.main()
