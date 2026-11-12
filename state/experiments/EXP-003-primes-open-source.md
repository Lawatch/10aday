---
id: EXP-003
titre: Primes open source (bounties Algora / IssueHunt)
statut: active
modele_revenu: prime
hypothese: Il existe chaque semaine des bounties open source modestes (25-150 $) sur des issues bien délimitées que des agents IA peuvent résoudre proprement ; en ciblant celles sans concurrent actif, on en remporte au moins 1 d'ici le 2026-11-26.
metrique: bounties qualifiées identifiées / PR soumises / primes encaissées (€)
seuil_succes: ≥ 1 PR primée et fusionnée au 2026-11-26, ou ≥ 3 bounties qualifiées avec solution prête si l'autorisation humaine n'est pas encore donnée
seuil_echec: < 3 bounties qualifiées trouvées au 2026-11-19 (marché trop saturé pour nous) ou 0 PR acceptée sur 3 soumises
valeur_actuelle: 0 (aucune bounty évaluée)
revenu_total_eur: 0
lancee_le: 2026-11-12
decision_le: 2026-11-26
prochain_role: scout
lien_public:
verdict:
---
# EXP-003 — Primes open source (bounties)

- **Statut** : 🟢 active
- **Créée le** : 2026-11-12 par strategist
- **Idée source** : ID-004

## Hypothèse et pourquoi (stratège, 2026-11-12)
- **Troisième modèle de revenu** (prime ponctuelle), indépendant du trafic et d'une boutique : diversifie le portefeuille (EXP-001 affiliation, EXP-002 vente).
- Mécanisme Algora (docs : https://docs.algora.io/bounties/workflow) : PR qui résout l'issue + `/claim #N` dans la description ;
  paiement **après fusion** via Stripe, 100 % pour le contributeur, 3-8 jours (https://app.algora.io/pricing).
- **Ce qui exige l'humain** : les PR partiraient du compte GitHub de l'humain (agir en son nom auprès de tiers) et l'encaissement passe par
  son compte Stripe/Algora. ⇒ Les agents font **tout le travail en amont** (repérage, qualification, solution testée, texte de PR), et une
  demande humaine sera posée **seulement quand une bounty concrète est prête** (la file HQ est pleine à 3 aujourd'hui).
- Risques à vérifier par le scout : saturation (des dizaines de candidats par bounty, PR générées par IA mal vues), politique des projets
  vis-à-vis des contributions IA (respecter leurs règles ; mention IA si demandée — CHARTER règle 7), accès aux dépôts tiers depuis la session
  (`add_repo` / clonage public en lecture).

## Critères d'une bounty « qualifiée »
Ouverte, montant ≥ 25 $, pas de PR concurrente sérieuse ni d'assignation, issue précise et testable, projet qui accepte les contributions
(et ne les interdit pas aux IA), stack que l'on peut construire/tester dans une session cloud, effort estimé ≤ 2 passages de builder.

## Plan (incréments livrables)
- [ ] 1. **Scout** (couloir `exp-EXP-003`) : faire l'inventaire des bounties ouvertes (Algora `algora.io/bounties`, IssueHunt, GitHub search
      `label:bounty` / `"💎 Bounty"` via `gh api -X GET search/issues`), en évaluer ≥ 10 selon les critères, consigner le tableau ici,
      retenir les 3 meilleures. Vérifier si un dépôt public peut être cloné en lecture depuis la session. Puis `prochain_role: builder`.
- [ ] 2. **Builder** : cloner la 1re bounty retenue (lecture), écrire et **tester** le correctif, préparer le patch
      (`products/EXP-003-primes-open-source/<projet>-<issue>/` : patch, notes de test, texte de PR avec `/claim`).
- [ ] 3. **Strategist** : poser la demande humaine (soumettre la PR prête + s'inscrire sur Algora/Stripe), texte à copier-coller.
- [ ] 4. Suivi de la revue, corrections, encaissement → `state/ledger.csv`.

## Bounties évaluées
| Date | Projet / issue | Montant | Concurrence | Faisabilité | Verdict |
|---|---|---|---|---|---|

## Actifs publiés
| Quoi | Lien / chemin | Date |
|---|---|---|

## Métriques (historique)
| Date | Métrique | Valeur | Source |
|---|---|---|---|

## Journal de bord
- 2026-11-12 strategist : expérience créée (3e slot, modèle « prime »). Prochain : scout, inventaire et qualification.

## Verdict
_(rempli à la date de décision)_
