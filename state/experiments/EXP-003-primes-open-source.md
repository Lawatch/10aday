---
id: EXP-003
titre: Primes pour corriger des bugs de logiciels libres
categorie: Primes et concours
en_clair: Être payé pour corriger des bugs sur des projets open source qui offrent une récompense.
deja_fait: Rien : arrêtée avant de commencer.
resultat: —
bloque_par: —
prochaine_etape: —
on_arrete_si: —
statut: tuee
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
verdict: Arrêtée le 12/11 : ces sites paient par virement (compte à créer) et chaque correction aurait dû être envoyée depuis ton compte GitHub. Pas faisable seuls.
---
# EXP-003 — Primes open source (bounties)

- **Statut** : 🔴 tuée le 2026-11-12 (stratège)
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
- 2026-11-12 ~11:00 strategist : **tuée** (encaissement Stripe + PR au nom de l'humain, incompatibles avec les consignes du jour).

## Verdict
**Tuée le 2026-11-12 par le stratège, avant tout passage de scout.** Nouvelles consignes de l'humain (pas de compte vendeur, encaissement
uniquement vers une adresse crypto Kraken) :
- Algora paie via **Stripe Connect** (docs officielles : https://docs.algora.io/bounties/payments — carte/ACH/SEPA, aucune mention de crypto) ;
  les payouts stablecoin de Stripe sont réservés aux entreprises US. IssueHunt : même schéma (compte + Stripe).
- Soumettre une PR sur un dépôt tiers = agir au nom de l'humain sur son compte GitHub → chaque bounty demanderait une intervention humaine.
- Marché saturé de PR générées par IA, de plus en plus refusées par les mainteneurs.
**Enseignement** : écarter d'emblée les paris dont l'encaissement ou la livraison passe par un compte de l'humain ; ID-004 reste au backlog
« suspendue » tant qu'un canal de prime payée en crypto, sans compte, n'est pas identifié.
