// Cargo — semver crate (the crate Cargo uses), VersionReq::matches
use semver::{Version, VersionReq};
fn main() {
    let path = std::env::args().nth(1).unwrap();
    let inp: serde_json::Value = serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap();
    let mut results = serde_json::Map::new();
    for c in inp["constraints"].as_array().unwrap() {
        let c = c.as_str().unwrap();
        match VersionReq::parse(c) {
            Err(_) => { results.insert(c.into(), serde_json::json!({"valid": false})); }
            Ok(r) => {
                let mut m = serde_json::Map::new();
                for v in inp["versions"].as_array().unwrap() {
                    let v = v.as_str().unwrap();
                    m.insert(v.into(), match Version::parse(v) { Ok(pv) => serde_json::Value::Bool(r.matches(&pv)), Err(_) => serde_json::Value::Null });
                }
                results.insert(c.into(), serde_json::json!({"valid": true, "range": r.to_string(), "matches": m}));
            }
        }
    }
    println!("{}", serde_json::to_string_pretty(&serde_json::json!({"tool": "rust crate semver 1.x", "results": results})).unwrap());
}
