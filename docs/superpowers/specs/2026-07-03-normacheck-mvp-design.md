# NormaCheck — Design MVP (hackathon Assemblée nationale 2026)

**Date** : 2026-07-03
**Statut** : validé (brainstorm du 2026-07-03)
**Contexte** : hackathon de l'Assemblée nationale, restitution devant jury dans ~1 semaine.

## 1. Objectif

Application web qui analyse un texte législatif (collé ou importé) contre les règles du
[guide de légistique](../../../GUIDE_LEGISTIQUE.md) et restitue :

- le texte annoté avec les passages fautifs surlignés (règle enfreinte + explication + proposition de correction) ;
- une correction applicable en un clic, passage par passage ou globalement ;
- un score de conformité qui évolue en direct ;
- un glossaire pédagogique des règles du guide.

Critère de succès : une démo fluide, visuelle et compréhensible en quelques minutes devant un jury non technique.

## 2. Stack

- **Next.js** (App Router) + TypeScript, une seule app full-stack.
- **Tailwind CSS + shadcn/ui** pour l'UI.
- **Claude API** (`claude-sonnet-5`) pour la couche d'analyse sémantique, clé côté serveur (API route).
- Aucune base de données : pas de comptes, pas de persistance. Un onglet = un texte analysé.
- Tests : Vitest (moteur de règles) + un test e2e Playwright sur le flux principal.

## 3. Sévérités

| Sévérité | Source | Couleur | Sens |
| --- | --- | --- | --- |
| 🔴 **Enfreinte** | moteur déterministe | rouge marianne `#e1000f` | infraction certaine à une règle du guide |
| 🟠 **À revoir** | LLM | orange | jugement sémantique, à valider par l'humain |
| 🔵 **Suggestion** | déterministe ou LLM | bleu/menthe | amélioration stylistique non bloquante |

## 4. Le catalogue de règles — source unique de vérité

Chaque règle du guide est encodée **une seule fois** dans `lib/rules/` :

```ts
type Rule = {
  id: string;            // ex : "R9.2-07"
  famille: string;       // ex : "Formules standard"
  ref: string;           // ex : "§9.2" — renvoi au guide
  titre: string;         // ex : « mentionné à » et non « visé à »
  explication: string;   // formulation pédagogique pour le glossaire
  exempleOk: string;
  exempleKo: string;
  severite: "enfreinte" | "a_revoir" | "suggestion";
  detecteur?: Detecteur; // absent pour les règles purement LLM
  correcteur?: Correcteur; // correction automatique quand elle est sûre
};
```

Ce catalogue alimente **à la fois** le moteur de détection **et** le glossaire (généré
automatiquement depuis les mêmes objets). Zéro duplication ; argument jury : « le glossaire EST le moteur ».
Les règles purement LLM figurent aussi au catalogue (sans `detecteur`) : le prompt LLM est
généré à partir de leurs champs.

## 5. Moteur hybride — deux étages

### 5.1 Étage déterministe (instantané, ~35 règles)

**Détecteurs lexicaux** (regex avec frontières de mots, gestion de la casse) :

- toute la table des formules standard du §9.2 : « et/ou » → « ou », « visé à » → « mentionné à »,
  « communautaire » → « européen », « montant maximum » → « montant maximal »,
  « ministre en charge de » → « ministre chargé de », « prévu par l'article » → « prévu à l'article »,
  « dans les conditions fixées par décret » → « dans des conditions fixées par décret »,
  « collectivités locales » → « collectivités territoriales », « accusé de réception » →
  « lettre avec demande d'avis de réception », etc. ;
- parenthèses proscrites (§7.2) ;
- sigles en majuscules (§7.2), avec liste d'exceptions (OSEO, Unédic…) ;
- guillemets anglais hors imbrication (§7.2) ;
- majuscules non accentuées : « Etat » → « État », « A la » → « À la » (§7.2) ;
- nombres contenant des points (§7.2) ;
- références imprécises : « l'alinéa précédent », « ci-dessus », « la présente disposition »,
  « l'article suivant » (§9.1) ;
- point d'impact introduit par « dans » : « Dans le premier alinéa » → « Au premier alinéa » (§8.1).

**Détecteurs structurels** (parseur léger de la structure I. – / A. – / 1° / a) / alinéas / blocs rédigés) :

- tiret après « I. » et « A. » mais pas après « 1. » ni « a. » (§5) ;
- ponctuation des énumérations : point-virgule sauf dernier élément (§5, §6) ;
- majuscule en début de subdivision, sauf après tiret (§5, §6) ;
- « abrogé » vs « supprimé » selon l'objet — division/article/subdivision = abrogé,
  alinéa/phrase/mots = supprimé (§8.3) ;
- guillemets ouvrants des alinéas rédigés, guillemet fermant sur le seul dernier alinéa du bloc (§6).

Sortie : `Finding { ruleId, span: {start, end}, extrait, message, suggestion?, severite, source: "regle" }`.

### 5.2 Étage LLM (Claude, quelques secondes, streaming)

Règles sémantiques hors de portée des regex :

- titre bref et sans références législatives (§1) ;
- précision du point d'impact (§8.1) ;
- « du même code » / « la présente loi » utilisés à bon escient (§9.1) ;
- « dernier alinéa » plutôt que « cinquième alinéa », « avant-dernier » etc. (§8.1) ;
- formules de remplacement / insertion / complément appropriées (« ainsi rédigé » vs
  « remplacé par », « ajouté » vs « inséré » vs « complété ») (§8.2).

Contraintes :

- sortie JSON structurée (tool use / structured output) ;
- **ancrage par citation exacte** : le LLM cite le passage fautif verbatim, le serveur
  retrouve l'offset dans le texte ; si la citation est introuvable, le finding est affiché
  dans la liste latérale **sans surlignage** — jamais de surlignage faux ;
- fusion/déduplication : en cas de chevauchement de spans, le finding déterministe gagne ;
- sévérité des findings LLM : « à revoir » ou « suggestion », jamais « enfreinte » (réservée au déterministe).

### 5.3 Flux et dégradation

- Les findings déterministes s'affichent **immédiatement** ; les findings LLM arrivent en
  streaming quelques secondes après — l'analyse « se complète sous les yeux du jury ».
- Si le LLM est indisponible (réseau, quota), l'app fonctionne en mode déterministe seul,
  avec un badge discret « analyse approfondie indisponible ». La démo ne peut pas planter.

## 6. Écrans

### 6.1 Accueil / Analyse

- Grande zone de collage de texte + drag-and-drop de fichier (**.docx** via mammoth,
  **.pdf** via pdf-parse, **.txt**) ;
- **3 exemples préchargés** en un clic :
  1. texte court « pédagogique » — une infraction de chaque famille ;
  2. extrait réaliste de PPL ;
  3. exemple conçu pour briller sur la couche LLM (point d'impact imprécis, « du même code » erroné…).

### 6.2 Résultat — cœur de la démo

- **Panneau central** : le texte, surligné par sévérité. Clic sur un surlignage → popover :
  règle, explication, référence (§ du guide, lien vers la fiche glossaire), proposition,
  bouton **« Appliquer »** — le texte se corrige en direct (style Grammarly).
- **Panneau latéral** : findings groupés par famille de règles, filtres par sévérité et
  famille, clic → scroll vers le passage.
- **Header** : jauge de **score de conformité** + compteurs par sévérité. Le score
  **remonte en direct** à chaque correction appliquée → avant/après chiffré.
- **« Tout corriger »** : applique en une fois toutes les corrections déterministes sûres ;
- **Export** : texte corrigé en .txt (copie presse-papier incluse) ; export .docx seulement
  si le temps le permet — le rapport PDF est hors scope MVP.

Score : `100 − Σ(poids par sévérité) / normalisation par longueur du texte` (les textes longs
ne sont pas défavorisés) ; répartition par famille affichée en tooltip ou mini-graphe.

**Application des corrections et offsets** : chaque correction appliquée modifie le texte ;
les spans des findings restants sont réindexés (décalage par delta de longueur). Les
corrections sont appliquées de la fin du texte vers le début pour éviter les invalidations.

### 6.3 Glossaire

- Cartes par famille de règles, générées depuis le catalogue : titre clair, explication
  simple, exemple ✅/❌, référence au guide ;
- recherche plein texte ;
- chaque annotation de l'écran Résultat est cliquable vers sa fiche.

## 7. Direction artistique — alignée sur le site du hackathon

Source : `https://hackathon2026.assemblee-nationale.fr/` (tokens extraits de leur CSS le 2026-07-03).

- **Typographies** : **Lora** (serif — titres, registre parlementaire) + **Lato** (sans-serif — corps et UI),
  chargées via `next/font`.
- **Tokens light** : `--background:#fff`, `--foreground:#161616`, `--primary:#233f6b` (bleu AN),
  `--accent/--destructive:#e1000f` (rouge marianne), `--secondary/--muted:#f6f6f6`,
  `--muted-foreground:#666`, `--border:#ddd`, `--radius:.5rem`.
- **Tokens dark** (le site en a un complet) : `--background:#111116`, `--card:#1c1c24`,
  `--secondary:#2a2a35`, `--accent:#ff4d4d`, `--border:#3f3f4e`. Toggle dark mode inclus.
- **Couleurs hero du site** réutilisables en touches : indigo `#2a327d`, menthe `#63e0be`.
- **Assets** : logo officiel AN (`docs/superpowers/specs/assets/logo-an.png`) et favicon
  « burst » indigo (`docs/superpowers/specs/assets/favicon.svg`), à copier dans `public/`.
- Effet recherché : NormaCheck ressemble à une **extension naturelle du site du hackathon**.
- Polish : micro-animations sobres (apparition des surlignages, jauge de score animée,
  transitions des popovers), états vides soignés, responsive suffisant pour un vidéoprojecteur.

## 8. Structure du code

```
lib/rules/        catalogue des règles (source unique : moteur + glossaire + prompt LLM)
lib/engine/       détecteurs lexicaux et structurels, fusion/dédup, score
lib/llm/          client Claude, prompt, parsing/ancrage des findings
lib/import/       extraction .docx/.pdf/.txt + normalisation du texte
app/              pages (accueil, résultat, glossaire) + API routes (analyze, analyze-llm)
components/       UI (surligneur, popover, panneau findings, jauge, cartes glossaire)
data/exemples/    les 3 textes de démo
```

Chaque unité est testable indépendamment ; le moteur ne dépend pas de React, l'UI ne
dépend pas de Claude.

## 9. Hors scope (assumé)

Comptes utilisateurs, persistance/historique, intégration Légifrance, collaboration temps
réel, rapport PDF, i18n. Une seule page = un texte analysé.

## 10. Tests

- **Unitaires (Vitest)** : chaque règle déterministe a au minimum un cas positif, un cas
  négatif et un faux-positif connu (ex : « ou » dans un mot, sigle de la liste d'exceptions) ;
- **Golden tests** : les 3 exemples préchargés ont des findings attendus figés — la démo
  est verrouillée par les tests ;
- **E2E (Playwright)** : coller → analyser → cliquer un finding → appliquer → score qui monte ;
- la couche LLM est testée avec des réponses mockées (ancrage, citation introuvable, fusion).
