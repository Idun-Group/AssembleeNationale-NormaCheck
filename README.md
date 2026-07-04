# NormaCheck

NormaCheck est un vérificateur de légistique pour les textes législatifs, conçu pour le
hackathon de l'Assemblée nationale. Collez ou importez un article de loi, un amendement ou
une proposition de loi : l'outil détecte les règles du
[guide de légistique](./GUIDE_LEGISTIQUE.md) enfreintes, explique pourquoi, et propose des
corrections applicables en un clic.

## Le moteur hybride

NormaCheck combine deux couches d'analyse :

- **Couche déterministe** (instantanée) : un moteur de règles/regex (`lib/rules`,
  `lib/engine`) détecte les infractions mécaniques — typographie, structure, formules
  standard, références — et calcule un score de conformité sur 100.
- **Couche IA locale** (asynchrone) : une analyse plus fine (formulations ambiguës,
  imprécisions, lourdeurs rédactionnelles) est déléguée à la CLI `claude` en local
  (`lib/llm/executer.ts`), authentifiée via le plan Claude de l'utilisateur — **aucune clé
  API requise**. Si la CLI est indisponible ou échoue, l'interface l'indique
  (badge « analyse approfondie indisponible ») et se rabat proprement sur la seule couche
  déterministe : l'application reste pleinement utilisable.

Les résultats des deux couches sont fusionnés et ré-ancrés sur le texte au fil des
corrections (`lib/engine/fusion.ts`).

## Démarrage rapide

```bash
npm install
npm run dev
```

Puis ouvrez [http://localhost:3000](http://localhost:3000).

Aucune variable d'environnement n'est nécessaire (voir `.env.example`) : l'analyse IA
utilise l'authentification locale de la CLI `claude`, pas une clé API.

## Tests

```bash
npm run test    # suite Vitest (moteur de règles, engine, import, LLM)
npm run build   # build de production Next.js
npm run e2e     # scénarios Playwright (nécessite npx playwright install chromium)
```

Le parcours e2e (`e2e/analyse.spec.ts`) verrouille le flux de démonstration sans dépendre de
la CLI `claude` : il n'exerce que la couche déterministe (surlignages immédiats,
corrections, score), qui reste vraie même si l'analyse IA est indisponible.

## Les trois écrans

1. **Saisie** (`/`) — collez un texte, importez un fichier (`.docx`, `.pdf`, `.txt`) ou
   partez d'un des trois exemples préchargés (texte pédagogique, extrait de PPL, cas
   d'analyse approfondie conçu pour la couche IA).
2. **Résultat** — texte annoté avec surlignages cliquables par sévérité
   (🔴 enfreinte · 🟠 à revoir · 🔵 suggestion), score de conformité qui remonte en direct,
   correction unitaire ou globale (« Tout corriger »), export du texte corrigé.
3. **Glossaire** (`/glossaire`) — les ~50 règles du guide de légistique utilisées par
   NormaCheck, classées par famille et consultables par mot-clé. Chaque surlignage de
   l'écran Résultat renvoie vers sa fiche : le glossaire et le moteur partagent le même
   catalogue de règles.

## Carte du code

```
lib/rules/       le catalogue de règles — source unique alimentant moteur, glossaire et prompt IA
lib/engine/      analyse, fusion déterministe/IA, score, application des corrections, parseur structurel
lib/llm/         couche IA : executer.ts (spawn CLI claude — seul point de contact LLM), prompt, validation
lib/import/      normalisation du texte importé
app/api/         analyze-llm (analyse IA) · extract (.docx/.pdf/.txt → texte)
components/      UI (analyseur, texte annoté, panneau de findings, jauge, glossaire)
data/exemples/   les 3 textes de démo, verrouillés par des golden tests
tests/ · e2e/    Vitest (135 tests) · Playwright (flux de démo complet)
```

## Contribuer

Le fichier [CLAUDE.md](./CLAUDE.md) documente l'architecture, les conventions et les
pièges du repo (frontières de mots françaises, Base UI vs Radix, ajout d'une règle…) —
il sert de guide d'embarquement, que vous travailliez avec Claude Code ou non. Le cas de
contribution le plus courant — ajouter une règle de légistique — y est décrit pas à pas.

## Crédits

Projet développé pour le hackathon 2026 de l'Assemblée nationale. Design aligné sur la
charte du hackathon (Lora/Lato, bleu Assemblée `#233f6b`). Les règles implémentées sont
tirées du guide pour la rédaction des textes législatifs ([GUIDE_LEGISTIQUE.md](./GUIDE_LEGISTIQUE.md)).
