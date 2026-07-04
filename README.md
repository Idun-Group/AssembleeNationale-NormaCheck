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
   partez d'un exemple pédagogique.
2. **Résultat** — texte annoté avec surlignages cliquables par sévérité, score de
   conformité, correction unitaire ou globale (« Tout corriger »), export du texte corrigé.
3. **Glossaire** (`/glossaire`) — les règles du guide de légistique utilisées par
   NormaCheck, classées par famille et consultables par mot-clé.
