import io, json, os, sys, contextlib, unittest
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import earn_scan as es  # noqa: E402

NOW = es.parse_dt("2026-11-12T19:00:00Z")
FIX = json.load(open(os.path.join(HERE, "fixture_live.json"), encoding="utf-8"))
R = {i["slug"]: es.assess(i, NOW) for i in FIX}


class T(unittest.TestCase):
    def test_good_target_feasible_and_top(self):
        r = R["build-a-cli-tool"]
        self.assertTrue(r["feasible"]); self.assertFalse(r["kyc_superteam"])
        # 1000/5 *1.5 (tool) *1.2 (externe) *1.2 (AGENT_ONLY) *1.1 (>=7 j)
        self.assertAlmostEqual(r["score"], round(200 * 1.5 * 1.2 * 1.2 * 1.1, 1))
        self.assertEqual(max(R.values(), key=lambda x: x["score"])["slug"], "build-a-cli-tool")

    def test_exclusions(self):
        self.assertIn("livrable hors charte/portée (mot-clé)", R["x-thread"]["reasons"])
        self.assertTrue(any("< 5 j" in x for x in R["audit-repos"]["reasons"]))
        self.assertTrue(R["audit-repos"]["kyc_superteam"])
        self.assertIn("humains seulement", R["humans"]["reasons"])
        self.assertIn("échéance passée", R["old"]["reasons"])
        for s in ("x-thread", "audit-repos", "humans", "old"):
            self.assertEqual(R[s]["score"], 0.0)

    def test_cli_markdown_filters_humans(self):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            es.main(["--file", os.path.join(HERE, "fixture_live.json"), "--now", "2026-11-12T19:00:00Z"])
        out = buf.getvalue()
        self.assertIn("4 annonces", out)
        self.assertNotIn("DePIN", out)
        self.assertTrue(out.splitlines()[4].startswith("| 475.2 | [Build a CLI tool"))

    def test_naive_date_gets_utc(self):
        self.assertIsNotNone(es.parse_dt("2026-01-01").tzinfo)


if __name__ == "__main__":
    unittest.main()
