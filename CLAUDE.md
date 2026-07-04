# CLAUDE.md — NormaCheck

Vérificateur de légistique (hackathon Assemblée nationale) : colle/importe un texte
législatif → détection des règles du [guide de légistique](./GUIDE_LEGISTIQUE.md)
enfreintes, corrections en 1 clic, score de conformité, glossaire.

## Commandes

```bash
npm run dev          # serveur de dev (localhost:3000)
npm run test         # suite Vitest complète (obligatoire avant commit)
npm run test -- tests/rules/typographie.test.ts   # un seul fichier
npm run build        # build production (doit rester vert)
npm run e2e          # Playwright (npx playwright install chromium la 1re fois)
npm run lint
```

## Architecture — le catalogue est la source unique de vérité

```
lib/rules/     LE CATALOGUE. Chaque règle = 1 objet Regle {id, famille, ref, titre,
               explication, exempleOk, exempleKo, severite, detecteur?, llm?}.
               Il alimente À LA FOIS : le moteur (detecteur), le glossaire (tous les
               champs) et le prompt IA (champ llm). Ne JAMAIS dupliquer une règle
               ailleurs — on modifie l'objet, tout suit.
lib/engine/    analyser(texte) exécute tous les detecteurs → Finding[] (spans absolus).
               fusion.ts : fusionner(det, llm) — le déterministe gagne en cas de
               chevauchement ; ancrer(citation, texte) pour les findings IA.
               corrections.ts : application FIN→DÉBUT (offsets stables). score.ts.
               structure.ts : parseur de lignes (I. – / A. / 1° / a) / blocs « rédigés »).
lib/llm/       executer.ts = SEUL point de contact LLM (spawn de la CLI claude locale).
               prompt.ts (généré du catalogue), extraire-json.ts, convertir.ts, schema.ts.
app/api/       analyze-llm (texte → findings IA), extract (.docx/.pdf/.txt → texte).
components/    analyseur.tsx = état racine (déterministe en useMemo, IA fetchée puis
               ré-ancrée à chaque édition). vue-resultat / texte-annote /
               panneau-findings / jauge-score / zone-saisie / glossaire-*.
data/exemples/ les 3 textes de démo, verrouillés par tests/exemples.test.ts.
```

## Couche LLM — CLI locale, PAS d'API

- L'analyse IA passe par la CLI `claude` installée localement (plan Claude de
  l'utilisateur). **Aucune clé API, aucune dépendance `@anthropic-ai/sdk` — n'en ajoute
  pas.** Une future bascule vers l'API Anthropic ne doit réécrire QUE
  `lib/llm/executer.ts` (même signature `executerLlm(prompt): Promise<string>`).
- Le texte utilisateur passe par **stdin uniquement** (jamais en argument de commande) —
  invariant de sécurité à préserver.
- Les findings IA ne sont JAMAIS `severite: "enfreinte"` (réservée au déterministe) et
  un finding dont la citation est introuvable garde `span: null` (listé, pas surligné).
- Tout échec CLI → 503 → l'UI affiche « analyse approfondie indisponible » et continue
  en déterministe seul. Ne casse jamais ce chemin de dégradation.

## Ajouter / modifier une règle (le cas de contribution le plus courant)

1. Choisir le fichier de famille dans `lib/rules/` (formules-standard, typographie,
   references, structurelles — ou llm.ts si indétectable par regex).
2. Écrire d'abord les tests dans `tests/rules/<famille>.test.ts` : un cas fautif détecté
   (+ suggestion), un cas correct ignoré, et le faux positif plausible le plus proche.
3. Implémenter avec `detecteurRegex(regex, {message, suggestion})` (`lib/engine/regex.ts`)
   ou un `Detecteur` manuel pour la logique à état. Id = `R<section>-<n>` (ex `R9.2-07`),
   `ref` commence par `§`.
4. `npm run test` : `registre.test.ts` impose les invariants (ids uniques, textes non
   vides, règle sans `detecteur` ⇒ champ `llm` obligatoire) et `exemples.test.ts` (golden)
   protège la démo — si un exemple casse, ajuster le TEXTE de l'exemple, pas la règle,
   sauf vrai bug de règle.

## Pièges spécifiques à ce repo (appris à la dure)

- **Frontières de mots FR** : jamais `\b` (casse sur les accents). Utiliser
  `(?<![A-Za-zÀ-ÿ])` … `(?![A-Za-zÀ-ÿ])` (constantes `G`/`D` dans les fichiers de règles).
- **Regex multi-mots** : ne jamais laisser un « écart » traverser une frontière de phrase
  — voir `SEPARATEUR` dans `references.ts` (autorise `.` sauf si suivi
  d'espace + majuscule). Un sur-match inter-phrases = surlignage faux en démo.
- **shadcn ici = @base-ui/react, PAS Radix** : pas de `asChild`. Pour faire d'un élément
  le trigger d'un Popover/Tooltip : prop `render={<el/>}` + `nativeButton={false}`
  (exemples dans `texte-annote.tsx` et `ui/select.tsx`).
- **pdf-parse est en v2** (API classe : `new PDFParse({data}).getText()`), importé
  dynamiquement dans la route ; `next.config.ts` le liste dans `serverExternalPackages`.
- **Corrections & offsets** : toute application de suggestions se fait fin→début
  (`appliquerToutes`). Les spans sont des offsets absolus dans le texte courant ; après
  édition, le déterministe recalcule et les findings IA sont ré-ancrés par leur `extrait`.
- **E2E** : les tests Playwright ne doivent JAMAIS dépendre de la couche IA (elle peut
  être indisponible en CI). Ils s'appuient sur les `data-testid` existants
  (`zone-texte`, `bouton-analyser`, `exemple-<id>`, `surlignage`, `bouton-appliquer`,
  `jauge-score`+`data-score`, `bouton-tout-corriger`, `badge-llm`) — contrat à maintenir.
- `.superpowers/` = notes de travail locales, gitignoré — ne pas s'y fier ni le committer.

## Conventions

- Identifiants, messages, UI : **en français** (`analyser`, `Regle`, `severite`,
  `findings`…). Messages de commit en anglais.
- Sévérités : `"enfreinte"` (rouge, certain) | `"a_revoir"` (orange, jugement) |
  `"suggestion"` (bleu). Couleurs via les tokens CSS `--sev-*` (light + dark définis
  dans `app/globals.css` — DA du site du hackathon, Lora/Lato + bleu AN `#233f6b`).
- TDD : test rouge d'abord, implémentation ensuite. `npm run test && npm run build`
  verts avant tout commit ; `npm run e2e` avant un merge.
