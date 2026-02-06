

# Ajout de toutes les fonctionnalites ShopOpti au tableau comparatif

## Constat actuel
Le tableau comparatif de la page `/choose-plan` ne contient que **13 fonctionnalites** alors que ShopOpti en propose plus de **30**. Cela sous-vend considerablement la plateforme.

## Nouvelles fonctionnalites a ajouter (17 lignes supplementaires)

Le fichier `plans-data.ts` sera enrichi avec les fonctionnalites suivantes, organisees par categorie :

### Sourcing et Recherche
| Fonctionnalite | Standard | Pro | Ultra Pro |
|---|---|---|---|
| Produits Gagnants (Winning Products) | x | check | check |
| Veille Concurrentielle (Ads Spy) | x | check | check |
| Recherche Fournisseurs | Basique | Avancee | Illimitee |

### Catalogue et Produits
| Fonctionnalite | Standard | Pro | Ultra Pro |
|---|---|---|---|
| Gestionnaire de Brouillons (Backlog) | check | check | check |
| Gestion des Variantes | check | check | check |
| Editeur d'Images et Medias | Basique | IA incluse | IA Premium |
| Attributs et Enrichissement | x | check | check |
| Categories et Marques | check | check | check |
| Score de Sante Catalogue | x | check | check |

### Ventes et Automatisation
| Fonctionnalite | Standard | Pro | Ultra Pro |
|---|---|---|---|
| Suivi Automatique (Tracking) | Manuel | Auto | Temps reel |
| Gestion du Stock | Alertes | Auto-restock | Predictif |
| CRM et Pipeline | x | check | check |
| Feeds Multi-canaux (Google, Meta) | 1 feed | 5 feeds | Illimite |

### Marketing et Performance
| Fonctionnalite | Standard | Pro | Ultra Pro |
|---|---|---|---|
| Marketing Automation | x | check | check |
| SEO Optimisation | Basique | Avancee | IA Premium |

### Configuration et Extras
| Fonctionnalite | Standard | Pro | Ultra Pro |
|---|---|---|---|
| Extension Copier/Coller Adresses | x | check | check |
| ShopOpti Academy | Videos | + Certifications | + Coaching |

## Total final : 30 fonctionnalites comparees

Passe de 13 a 30 lignes dans le tableau, refletant la vraie valeur de ShopOpti.

## Modifications techniques

### Fichier modifie : `src/components/subscription/plans-data.ts`

- Ajout de 17 nouvelles entrees dans le tableau `FEATURE_ROWS`
- Chaque entree inclut `labelFr`, `labelEn`, `tooltip` et les valeurs par plan
- Les valeurs respectent la hierarchie de plans definie dans `MODULE_REGISTRY` (minPlan)
- Organisation par sections thematiques via des separateurs visuels (lignes de categorie)

### Fichier modifie : `src/components/subscription/ChoosePlanPage.tsx`

- Ajout de sous-titres de section dans le tableau (Sourcing, Catalogue, Ventes, Marketing, Extras)
- Les sous-titres sont rendus comme des lignes `<tr>` avec un `colspan=4` et un style de separateur
- Introduction d'un champ optionnel `section` dans `PlanFeatureRow` pour grouper les lignes

### Aucun nouveau fichier cree

Toutes les modifications se font dans les 2 fichiers existants.

