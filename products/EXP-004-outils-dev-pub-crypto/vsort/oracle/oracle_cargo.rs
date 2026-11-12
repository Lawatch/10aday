// Cargo — crate semver 1.x: Version::parse + cmp_precedence (build metadata ignored).
// Build: cargo project with semver = "1", serde_json = "1"; run: cargo-sort-oracle < inputs.json
use std::io::Read; use semver::Version;
fn main() {
    let mut s = String::new(); std::io::stdin().read_to_string(&mut s).unwrap();
    let j: serde_json::Value = serde_json::from_str(&s).unwrap();
    let vs: Vec<Option<Version>> = j["versions"].as_array().unwrap().iter().map(|v| Version::parse(v.as_str().unwrap()).ok()).collect();
    let canon: Vec<serde_json::Value> = vs.iter().map(|v| match v { Some(v) => serde_json::json!(v.to_string()), None => serde_json::Value::Null }).collect();
    let cmp: Vec<serde_json::Value> = vs.iter().map(|a| match a {
        None => serde_json::Value::Null,
        Some(a) => serde_json::json!(vs.iter().map(|b| match b { None => serde_json::Value::Null, Some(b) => serde_json::json!(a.cmp_precedence(b) as i8) }).collect::<Vec<_>>()),
    }).collect();
    println!("{}", serde_json::json!({"tool": "semver 1.x", "canon": canon, "cmp": cmp}));
}
