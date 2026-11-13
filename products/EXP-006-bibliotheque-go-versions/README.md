# EXP-006 — outils de développement du module Go `verrange/`

Le module publié est à la racine du dépôt : `verrange/` (rien d'autre que du code dedans).
Ici : ce qui sert à le tester, sans être publié avec lui.

- `gen_nuget_oracle.js OUT.json.gz N graine...` : génère des cas et les réponses du **vrai** NuGet.Versioning 8.0.0
  (oracle `../EXP-004-outils-dev-pub-crypto/nvr/oracle`, construit par `dotnet build -c Release -o /tmp/claude-0/nu/obin`,
  SDK installé par `apt-get install -y dotnet-sdk-8.0`).
- Échantillon livré : `node gen_nuget_oracle.js ../../verrange/nuget/testdata/oracle.json.gz 4000 1 2 3` (12 033 cas).
- Grand test : `node gen_nuget_oracle.js /tmp/big.json.gz 20000 1 2 3 4 5 6 7 8` puis
  `cd verrange && NUGET_ORACLE=/tmp/big.json.gz go test ./nuget -run Against -v` → 2 705 885 vérifications, 0 écart (13/11).
