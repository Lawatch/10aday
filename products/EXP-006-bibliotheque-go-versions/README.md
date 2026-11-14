# EXP-006 — outils de développement du module Go `verrange/`

Le module publié est à la racine du dépôt : `verrange/` (rien d'autre que du code dedans).
Ici : ce qui sert à le tester, sans être publié avec lui.

- `gen_nuget_oracle.js OUT.json.gz N graine...` : génère des cas et les réponses du **vrai** NuGet.Versioning 8.0.0
  (oracle `../EXP-004-outils-dev-pub-crypto/nvr/oracle`, construit par `dotnet build -c Release -o /tmp/claude-0/nu/obin`,
  SDK installé par `apt-get install -y dotnet-sdk-8.0`).
- Échantillon livré : `node gen_nuget_oracle.js ../../verrange/nuget/testdata/oracle.json.gz 4000 1 2 3` (12 033 cas).
- Grand test : `node gen_nuget_oracle.js /tmp/big.json.gz 20000 1 2 3 4 5 6 7 8` puis
  `cd verrange && NUGET_ORACLE=/tmp/big.json.gz go test ./nuget -run Against -v` → 2 705 885 vérifications, 0 écart (13/11).

## Maven (14/11)
- `gen_maven_oracle.js OUT.json.gz NV NC graine...` : cas + réponses du **vrai** Maven Resolver 1.9.24
  (`javac -cp "/opt/maven/lib/*" -d DIR ../EXP-004-outils-dev-pub-crypto/mvr/oracle/Oracle.java`, puis `MVN_CP="/opt/maven/lib/*:DIR"`).
- Échantillon livré : `node gen_maven_oracle.js ../../verrange/maven/testdata/oracle.json.gz 120 300 1 2 3` (197 886 vérifications).
- Grand test : `... big.json.gz 300 400 $(seq 10 49)` puis `MAVEN_ORACLE=big.json.gz go test ./maven -run Against` → 8 456 138, 0 écart.
- Vrais builds : `./real_mvn.sh DIR > ../../verrange/maven/testdata/real_mvn.txt` (33 cas, ~3 min).
- Trouvé par l'oracle : Maven lit les chiffres non latins (`١.٠` = `1.0`), et `İ` minuscule fait 2 caractères en Java.
  Trouvé par le vrai Maven : `[3.0]` et `1.7` ne lisent pas la liste publiée, Maven demande ce texte exact.
