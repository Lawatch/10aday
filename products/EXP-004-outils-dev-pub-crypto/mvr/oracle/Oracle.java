// Oracle: runs the real Maven Resolver 1.9.24 classes.
// Input (stdin): lines "V<TAB>version" and "C<TAB>constraint".
// Output: line 1 = compare matrix of versions (chars < = >), then one line per constraint: "ERR" or a 0/1 string.
import org.eclipse.aether.util.version.GenericVersionScheme;
import org.eclipse.aether.version.*;
import java.io.*; import java.util.*;
public class Oracle {
  public static void main(String[] a) throws Exception {
    BufferedReader in = new BufferedReader(new InputStreamReader(System.in, "UTF-8"));
    List<String> vs = new ArrayList<>(), cs = new ArrayList<>(); String l;
    while ((l = in.readLine()) != null) { if (l.startsWith("V\t")) vs.add(l.substring(2)); else if (l.startsWith("C\t")) cs.add(l.substring(2)); }
    GenericVersionScheme s = new GenericVersionScheme();
    List<Version> pv = new ArrayList<>(); for (String v : vs) pv.add(s.parseVersion(v));
    PrintWriter out = new PrintWriter(new OutputStreamWriter(System.out, "UTF-8"));
    StringBuilder sb = new StringBuilder();
    for (Version x : pv) for (Version y : pv) { int c = x.compareTo(y); sb.append(c < 0 ? '<' : c > 0 ? '>' : '='); }
    out.println(sb);
    for (String c : cs) {
      VersionConstraint vc;
      try { vc = s.parseVersionConstraint(c); } catch (Exception e) { out.println("ERR"); continue; }
      StringBuilder r = new StringBuilder(); for (Version v : pv) r.append(vc.containsVersion(v) ? '1' : '0'); out.println(r);
    }
    out.flush();
  }
}
