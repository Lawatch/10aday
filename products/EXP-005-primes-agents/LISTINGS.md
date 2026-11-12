# EXP-005 — Inventaire des annonces Superteam Earn ouvertes aux agents

> Tenu par le couloir `exp-EXP-005`. Faits sourcés ≠ suppositions (marquées **[supposition]**).

## Scan 2026-11-12 19:40 UTC (builder) — **indirect, aucune annonce ouverte confirmée**

**Accès** : `superteam.fun` est refusé par le proxy (curl : CONNECT 403 ; WebFetch : ENOTFOUND). Ce scan repose sur
WebSearch (pages indexées, souvent anciennes) et sur des sources GitHub publiques. **Il ne peut pas voir les annonces
`AGENT_ONLY`** : elles sont masquées des flux publics et n'apparaissent que via l'API agents avec une clé
(`agentListingVisibilityWhere`, code source SuperteamDAO/earn).

| Annonce (indexée) | Sponsor | Dotation | Soum. | Accès | État constaté | Faisable ? |
|---|---|---|---:|---|---|---|
| [Audit & Fix Open-Source Solana Repositories](https://superteam.fun/earn/listing/fix-open-source-solana-repos-agents) | Superteam (KYC) | 3 000 USDG (1 500/1 000/500) | 116 | AGENT_ONLY | **terminée** (gagnants annoncés 2026-03-09) | — |
| [Open Innovation Track: Build Anything on Solana](https://superteam.fun/earn/listing/open-innovation-track-agents/) | Superteam (KYC) | 5 000 USDG | 122 | AGENT_ONLY | **terminée** (annonce 2026-03-09) | — |
| [RaptorX Research Challenge](https://superteam.fun/earn/listing/raptorx-research-challenge-ask-better-questions-find-better-alpha/) | RaptorX Labs | 125 USDC | ? | AGENT_ALLOWED | **échue** (2026-11-02, d'après un digest tiers) | — |
| [MultiHopper Build & Route Challenge](https://superteam.fun/earn/listing/multihopper-build-and-route-challenge-up-to-dollar50000-revenue-share-1/) | MultiHopper | « jusqu'à 50 000 $ de partage de revenus » | ? | non confirmé | ouverte ? (validité 2026-12-14, annonce 2026-12-28) | ❌ probablement : routage on-chain + partage de revenus (≠ prime au mérite) **[à vérifier]** |
| [Trading Tools and Agents](https://superteam.fun/earn/listing/trading-tools-and-agents/) (TxODDS) | TxODDS | ? | ? | AGENT_ALLOWED | non daté | ❌ thème trading (règle 3) |
| [Ship useful agent skills for Solana AI Kit](https://superteam.fun/earn/listing/skills/), [Zeroclaw plugins](https://superteam.fun/earn/listing/zeroclaw/), [Mermail agent skill](https://superteam.fun/earn/listing/build-and-demo-a-mermail-agent-skill) | Superteam Brasil / Mermail | ? | ? | ouvertes aux agents | non daté (statut inconnu) | ✅ type de livrable idéal (code + démo) si encore ouvertes |

Signal tiers : un digest automatique public (dépôt `airdropia/earn-ops`, désormais inaccessible) indiquait
**« agent eligible listings (0) »** les 2026-10-29, 11-02 et 11-03 — mais il lisait vraisemblablement le flux public,
donc **sans** les `AGENT_ONLY` **[supposition]**. Un autre scanner public (`smile-sk/bounty-hunter`, 2026-11-05) a mis
sa participation en pause : « l'espérance de gain paie rarement ».

**Conclusion du scan** : impossible de choisir une cible honnêtement sans l'API agents. Les seules annonces agents
connues et à forte dotation sont **terminées**. Aucune cible retenue à ce passage.

## Pour le prochain scan (dès que l'hôte est autorisé)
```bash
cd products/EXP-005-primes-agents
python3 earn_scan.py --public            # sans clé : AGENT_ALLOWED seulement
python3 earn_scan.py --api               # clé injectée par le proxy : AGENT_ALLOWED + AGENT_ONLY
```
Coller la sortie ici (nouvelle section datée), choisir **une** cible (✅, score max, échéance ≥ 7 j, sponsor externe de préférence).
