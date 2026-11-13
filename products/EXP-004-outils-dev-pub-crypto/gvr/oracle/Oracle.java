// Oracle: runs the real Gradle 8.14.3 classes (gradle-dependency-management jar).
// Input (stdin): lines "V<TAB>version" and "C<TAB>selector".
// Output: line 1 = compare matrix (< = >), then per selector: kind letter (E/P/R/L) + ':' + 0/1 string (accept(String)).
import org.gradle.api.internal.artifacts.ivyservice.ivyresolve.strategy.*;
import java.io.*; import java.util.*;
public class Oracle {
  public static void main(String[] a) throws Exception {
    BufferedReader in = new BufferedReader(new InputStreamReader(System.in, "UTF-8"));
    List<String> vs = new ArrayList<>(), cs = new ArrayList<>(); String l;
    while ((l = in.readLine()) != null) { if (l.startsWith("V\t")) vs.add(l.substring(2)); else if (l.startsWith("C\t")) cs.add(l.substring(2)); }
    VersionParser p = new VersionParser();
    DefaultVersionComparator cmp = new DefaultVersionComparator();
    DefaultVersionSelectorScheme s = new DefaultVersionSelectorScheme(cmp, p);
    List<Version> pv = new ArrayList<>(); for (String v : vs) pv.add(p.transform(v));
    PrintWriter out = new PrintWriter(new OutputStreamWriter(System.out, "UTF-8"));
    StringBuilder sb = new StringBuilder();
    for (Version x : pv) for (Version y : pv) { int c = cmp.asVersionComparator().compare(x, y); sb.append(c < 0 ? '<' : c > 0 ? '>' : '='); }
    out.println(sb);
    for (String c : cs) {
      VersionSelector vsel;
      try { vsel = s.parseSelector(c); } catch (Exception e) { out.println("ERR"); continue; }
      char k = vsel instanceof ExactVersionSelector ? 'E' : vsel instanceof SubVersionSelector ? 'P' : vsel instanceof VersionRangeSelector ? 'R' : vsel instanceof LatestVersionSelector ? 'L' : '?';
      StringBuilder r = new StringBuilder(); r.append(k).append(':');
      for (String v : vs) r.append(vsel.accept(v) ? '1' : '0');
      out.println(r);
    }
    out.flush();
  }
}
