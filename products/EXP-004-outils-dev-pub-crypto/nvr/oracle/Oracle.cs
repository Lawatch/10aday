// Oracle: reads cases (JSON array of {r, v:[...]}) on stdin, prints results computed by the real NuGet.Versioning.
using System; using System.Linq; using System.Text.Json; using System.Collections.Generic; using NuGet.Versioning;
var cases = JsonSerializer.Deserialize<List<Case>>(Console.In.ReadToEnd())!;
var outp = new List<object>();
foreach (var c in cases) {
  var vs = c.v.Select(s => NuGetVersion.TryParse(s, out var x) ? x : null).ToList();
  var vinfo = vs.Select(x => x == null ? null : new { n = x.ToNormalizedString(), f = x.ToFullString() }).ToList();
  string? err = null; object? res = null;
  try {
    if (VersionRange.TryParse(c.r, true, out var r)) {
      var ok = vs.Where(x => x != null).ToList();
      var best = r.FindBestMatch(ok);
      res = new {
        n = r.ToNormalizedString(), a = r.ToShortString(), p = r.PrettyPrint(), F = r.ToString("F", VersionRangeFormatter.Instance),
        fl = r.IsFloating,
        sat = vs.Select(x => x == null ? (bool?)null : r.Satisfies(x)).ToList(),
        cand = vs.Select(x => x == null ? (bool?)null : r.IsBetter(null, x)).ToList(),
        best = best == null ? -1 : vs.FindIndex(x => ReferenceEquals(x, best))
      };
    }
  } catch (Exception e) { err = e.GetType().Name; }
  outp.Add(new { r = res, v = vinfo, err });
}
Console.Out.Write(JsonSerializer.Serialize(outp));
record Case(string r, List<string> v);
