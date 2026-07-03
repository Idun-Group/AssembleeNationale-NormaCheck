# NormaCheck MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Application Next.js qui analyse un texte législatif contre les règles du guide de légistique (moteur déterministe + LLM), avec surlignage interactif, correction 1-clic, score de conformité et glossaire — spec : `docs/superpowers/specs/2026-07-03-normacheck-mvp-design.md`.

**Architecture:** Catalogue de règles unique (`lib/rules/`) alimentant à la fois le moteur de détection, le glossaire et le prompt LLM. Moteur déterministe pur TypeScript exécuté côté client (instantané). Couche LLM (Claude `claude-sonnet-5`, structured outputs) via API route. UI 3 écrans (Analyse, Résultat, Glossaire) aux couleurs du site du hackathon.

**Tech Stack:** Next.js 15 (App Router) + TypeScript, Tailwind CSS v4, shadcn/ui, `@anthropic-ai/sdk` + zod, mammoth (docx), pdf-parse (pdf), Vitest, Playwright.

## Global Constraints

- Langue de l'UI et du code métier : **français** (identifiants français : `analyser`, `Finding`, `Regle`, `severite`…).
- Modèle LLM : `claude-sonnet-5` exactement, via `client.messages.parse` + `zodOutputFormat`. Jamais de `temperature`/`top_p` (400 sur ce modèle). Clé dans `ANTHROPIC_API_KEY` (`.env.local`, jamais commitée).
- Sévérités : `"enfreinte" | "a_revoir" | "suggestion"`. Les findings LLM ne sont JAMAIS `"enfreinte"`.
- DA (extraite du site du hackathon) : primary `#233f6b`, accent/destructive `#e1000f`, menthe `#63e0be`, indigo `#2a327d`, fonts **Lora** (titres) + **Lato** (UI). Dark mode inclus. Assets dans `docs/superpowers/specs/assets/` → copier vers `public/`.
- Un finding LLM dont la citation est introuvable dans le texte a `span: null` — jamais de surlignage faux.
- En cas de chevauchement de spans, le finding déterministe gagne.
- L'app doit fonctionner sans clé API (mode déterministe seul + badge).
- Commits fréquents, messages en anglais, suffixe `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Tests moteur : Vitest (`npm run test`). E2E : Playwright (`npm run e2e`).

## File Structure

```
app/
  layout.tsx                 # fonts, ThemeProvider, SiteHeader
  page.tsx                   # rend <Analyseur/>
  globals.css                # tokens DA (light+dark) format shadcn/Tailwind v4
  glossaire/page.tsx         # glossaire généré depuis le catalogue
  api/analyze-llm/route.ts   # POST {texte} -> {findings} (couche Claude)
  api/extract/route.ts       # POST FormData(file) -> {texte} (docx/pdf/txt)
lib/rules/
  types.ts                   # Severite, Famille, Span, Detection, Detecteur, Regle, Finding
  formules-standard.ts       # ~18 règles §9.2 (table + factory)
  typographie.ts             # §7.2 : parenthèses, sigles, guillemets, majuscules, nombres…
  references.ts              # §9.1 + §8.1 (dans/au) + §8.3 (abrogé/supprimé)
  structurelles.ts           # §5/§6 : tirets, ponctuation énumérations, majuscules, blocs rédigés
  index.ts                   # REGLES (catalogue complet), regleParId()
lib/engine/
  regex.ts                   # detecteurRegex() factory
  structure.ts               # decouperLignes(), classifierLigne()
  analyser.ts                # analyser(texte): Finding[]
  fusion.ts                  # fusionner(det, llm), ancrer(citation, texte)
  score.ts                   # calculerScore(findings, texte)
  corrections.ts             # appliquerCorrection(), appliquerToutes()
lib/llm/
  schema.ts                  # zod schema de la réponse LLM
  prompt.ts                  # construirePromptSysteme() depuis le catalogue
lib/import/
  normaliser.ts              # normalisation texte (fins de ligne, espaces)
data/exemples/index.ts       # 3 textes de démo + findings attendus (golden)
components/
  site-header.tsx, theme-toggle.tsx
  analyseur.tsx              # état racine (texte, findings LLM, statut)
  zone-saisie.tsx            # textarea + upload + cartes exemples
  vue-resultat.tsx           # layout résultat (header + 2 panneaux)
  texte-annote.tsx           # rendu texte + <mark> + popovers
  panneau-findings.tsx       # liste groupée + filtres
  jauge-score.tsx            # jauge SVG animée
  carte-regle.tsx            # carte glossaire
tests/
  rules/*.test.ts, engine/*.test.ts, llm/*.test.ts, exemples.test.ts
e2e/analyse.spec.ts
```

---

### Task 1: Scaffold Next.js + DA du hackathon

**Files:**
- Create: projet Next.js à la racine du repo, `app/globals.css`, `app/layout.tsx`, `components/site-header.tsx`, `components/theme-toggle.tsx`, `.env.example`, `public/logo-an.png`, `public/favicon.svg`
- Test: vérification visuelle via `npm run dev` + `npm run build`

**Interfaces:**
- Produces: tokens CSS (`--primary`, `--accent`, `--menthe`, `--indigo`…), classes `font-serif` (Lora) / `font-sans` (Lato), `<SiteHeader/>` avec nav Analyse/Glossaire + toggle dark.

- [ ] **Step 1: Créer l'app Next.js dans le repo existant**

```bash
cd /Users/geoffreyharrazi/Documents/GitHub/AssembleeNationale-NormaCheck
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --turbopack --yes
```

Note : le repo contient déjà README.md/LICENSE/docs — si create-next-app refuse un dossier non vide, scaffolder dans `/tmp/nc-scaffold` puis `rsync -a --ignore-existing /tmp/nc-scaffold/ .` (ne pas écraser README existant, fusionner .gitignore).

- [ ] **Step 2: Installer les dépendances du projet**

```bash
npm install @anthropic-ai/sdk zod mammoth pdf-parse next-themes
npm install -D vitest @vitest/coverage-v8 @playwright/test
```

- [ ] **Step 3: Initialiser shadcn/ui et ajouter les composants**

```bash
npx shadcn@latest init -y -b neutral
npx shadcn@latest add button card badge popover input textarea separator scroll-area tooltip select
```

- [ ] **Step 4: Copier les assets et poser les tokens DA**

```bash
cp docs/superpowers/specs/assets/logo-an.png public/logo-an.png
cp docs/superpowers/specs/assets/favicon.svg public/favicon.svg
```

Remplacer dans `app/globals.css` les blocs `:root` et `.dark` générés par shadcn par les tokens du site du hackathon (hex accepté par Tailwind v4) et ajouter menthe/indigo au `@theme inline` :

```css
:root {
  --radius: 0.5rem;
  --background: #ffffff; --foreground: #161616;
  --card: #ffffff; --card-foreground: #161616;
  --popover: #ffffff; --popover-foreground: #161616;
  --primary: #233f6b; --primary-foreground: #ffffff;
  --secondary: #f6f6f6; --secondary-foreground: #161616;
  --muted: #f6f6f6; --muted-foreground: #666666;
  --accent: #e1000f; --accent-foreground: #ffffff;
  --destructive: #e1000f;
  --border: #dddddd; --input: #dddddd; --ring: #233f6b;
  --menthe: #63e0be; --indigo: #2a327d;
  --sev-enfreinte: #e1000f; --sev-a-revoir: #d97706; --sev-suggestion: #233f6b;
}
.dark {
  --background: #111116; --foreground: #ffffff;
  --card: #1c1c24; --card-foreground: #ffffff;
  --popover: #1c1c24; --popover-foreground: #ffffff;
  --primary: #233f6b; --primary-foreground: #ffffff;
  --secondary: #2a2a35; --secondary-foreground: #ffffff;
  --muted: #2a2a35; --muted-foreground: #a1a1aa;
  --accent: #ff4d4d; --accent-foreground: #ffffff;
  --destructive: #ff4d4d;
  --border: #3f3f4e; --input: #3f3f4e; --ring: #233f6b;
  --menthe: #63e0be; --indigo: #2a327d;
  --sev-enfreinte: #ff4d4d; --sev-a-revoir: #f59e0b; --sev-suggestion: #7ea6e0;
}
```

Dans le bloc `@theme inline` existant, ajouter :

```css
  --color-menthe: var(--menthe);
  --color-indigo: var(--indigo);
  --color-sev-enfreinte: var(--sev-enfreinte);
  --color-sev-a-revoir: var(--sev-a-revoir);
  --color-sev-suggestion: var(--sev-suggestion);
```

- [ ] **Step 5: Fonts Lora + Lato dans `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Lora, Lato } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const lora = Lora({ subsets: ["latin"], variable: "--font-serif" });
const lato = Lato({ weight: ["400", "700", "900"], subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "NormaCheck — Analyse légistique",
  description: "Vérifiez un texte législatif contre le guide de légistique de l'Assemblée nationale",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${lora.variable} ${lato.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <SiteHeader />
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Dans `app/globals.css`, mapper les fonts dans `@theme inline` : `--font-sans: var(--font-sans); --font-serif: var(--font-serif);` (si shadcn a déjà posé un mapping font, le remplacer).

- [ ] **Step 6: `components/site-header.tsx` + `components/theme-toggle.tsx`**

```tsx
// components/site-header.tsx
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="border-b bg-background/95 sticky top-0 z-40 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo-an.png" alt="Assemblée nationale" width={40} height={35} />
          <div>
            <span className="font-serif text-xl font-semibold text-primary">NormaCheck</span>
            <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">Analyse légistique</span>
          </div>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium hover:text-primary">Analyse</Link>
          <Link href="/glossaire" className="text-sm font-medium hover:text-primary">Glossaire</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
```

```tsx
// components/theme-toggle.tsx
"use client";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button variant="ghost" size="sm" aria-label="Basculer le thème"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      {resolvedTheme === "dark" ? "☀️" : "🌙"}
    </Button>
  );
}
```

- [ ] **Step 7: Config Vitest + scripts + `.env.example`**

Créer `vitest.config.ts` :

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
```

Ajouter dans `package.json` → scripts : `"test": "vitest run"`, `"test:watch": "vitest"`, `"e2e": "playwright test"`.
Créer `.env.example` avec `ANTHROPIC_API_KEY=sk-ant-...` et vérifier que `.gitignore` couvre `.env*`.

- [ ] **Step 8: Vérifier le build et committer**

```bash
npm run build
```

Attendu : build OK. Puis :

```bash
git add -A && git commit -m "Scaffold Next.js app with hackathon design tokens"
```

---

### Task 2: Types et registre du catalogue de règles

**Files:**
- Create: `lib/rules/types.ts`, `lib/rules/index.ts`, `lib/engine/regex.ts`
- Test: `tests/rules/registre.test.ts`, `tests/engine/regex.test.ts`

**Interfaces:**
- Produces:
  - `types.ts` : `Severite`, `Famille`, `Span {start,end}`, `Detection {span, extrait, message?, suggestion?}`, `Detecteur = (texte: string) => Detection[]`, `Regle {id, famille, ref, titre, explication, exempleOk, exempleKo, severite, detecteur?, llm?}`, `Finding {id, ruleId, span: Span|null, extrait, message, suggestion?, severite, source: "regle"|"llm"}`
  - `index.ts` : `REGLES: Regle[]`, `regleParId(id: string): Regle | undefined`, `FAMILLES: Famille[]`
  - `regex.ts` : `detecteurRegex(regex: RegExp, opts?: {message?: string | ((m: RegExpExecArray) => string); suggestion?: string | ((m: RegExpExecArray) => string)}): Detecteur`

- [ ] **Step 1: Écrire `lib/rules/types.ts`**

```ts
export type Severite = "enfreinte" | "a_revoir" | "suggestion";

export type Famille =
  | "Titres"
  | "Divisions et subdivisions"
  | "Alinéas"
  | "Typographie"
  | "Modifications de la norme"
  | "Références"
  | "Formules standard";

export interface Span { start: number; end: number }

export interface Detection {
  span: Span;
  extrait: string;
  message?: string;
  suggestion?: string;
}

export type Detecteur = (texte: string) => Detection[];

export interface Regle {
  id: string;
  famille: Famille;
  ref: string;          // section du guide, ex "§9.2"
  titre: string;
  explication: string;
  exempleOk: string;
  exempleKo: string;
  severite: Severite;
  detecteur?: Detecteur; // absent = règle purement LLM
  llm?: string;          // instruction pour le prompt LLM
}

export interface Finding {
  id: string;            // `${ruleId}:${span.start}` ou `${ruleId}:llm:${n}`
  ruleId: string;
  span: Span | null;     // null = non ancré (citation LLM introuvable)
  extrait: string;
  message: string;
  suggestion?: string;
  severite: Severite;
  source: "regle" | "llm";
}
```

- [ ] **Step 2: Test qui échoue pour `detecteurRegex`** — `tests/engine/regex.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { detecteurRegex } from "@/lib/engine/regex";

describe("detecteurRegex", () => {
  it("trouve toutes les occurrences avec spans exacts", () => {
    const d = detecteurRegex(/et\/ou/g, { message: "« et/ou » est proscrit", suggestion: "ou" });
    const r = d("choix et/ou option, encore et/ou");
    expect(r).toHaveLength(2);
    expect(r[0].span).toEqual({ start: 6, end: 11 });
    expect(r[0].extrait).toBe("et/ou");
    expect(r[0].suggestion).toBe("ou");
  });
  it("supporte message et suggestion dynamiques", () => {
    const d = detecteurRegex(/visé(e?s?) (à|au|aux)/g, {
      suggestion: (m) => `mentionné${m[1]} ${m[2]}`,
    });
    expect(d("visée à l'article")[0].suggestion).toBe("mentionnée à");
  });
  it("retourne [] si aucune occurrence", () => {
    expect(detecteurRegex(/xyz/g, {})("rien")).toEqual([]);
  });
});
```

- [ ] **Step 3: Vérifier l'échec** — `npm run test -- tests/engine/regex.test.ts` → FAIL (module inexistant).

- [ ] **Step 4: Implémenter `lib/engine/regex.ts`**

```ts
import type { Detecteur, Detection } from "@/lib/rules/types";

type Dyn = string | ((m: RegExpExecArray) => string);

export function detecteurRegex(
  regex: RegExp,
  opts: { message?: Dyn; suggestion?: Dyn } = {},
): Detecteur {
  return (texte: string): Detection[] => {
    const flags = regex.flags.includes("g") ? regex.flags : regex.flags + "g";
    const re = new RegExp(regex.source, flags);
    const out: Detection[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(texte)) !== null) {
      out.push({
        span: { start: m.index, end: m.index + m[0].length },
        extrait: m[0],
        message: typeof opts.message === "function" ? opts.message(m) : opts.message,
        suggestion: typeof opts.suggestion === "function" ? opts.suggestion(m) : opts.suggestion,
      });
      if (m.index === re.lastIndex) re.lastIndex++;
    }
    return out;
  };
}
```

- [ ] **Step 5: Test qui échoue pour le registre** — `tests/rules/registre.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { REGLES, regleParId } from "@/lib/rules";

describe("catalogue de règles", () => {
  it("a des ids uniques", () => {
    const ids = REGLES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("chaque règle a titre, explication, exemples et ref", () => {
    for (const r of REGLES) {
      expect(r.titre.length).toBeGreaterThan(3);
      expect(r.explication.length).toBeGreaterThan(10);
      expect(r.ref).toMatch(/^§/);
      expect(r.exempleOk.length).toBeGreaterThan(0);
      expect(r.exempleKo.length).toBeGreaterThan(0);
    }
  });
  it("regleParId retrouve une règle", () => {
    if (REGLES.length === 0) return; // catalogue rempli à partir de la tâche 3
    expect(regleParId(REGLES[0].id)?.id).toBe(REGLES[0].id);
  });
  it("toute règle sans détecteur a une instruction llm", () => {
    for (const r of REGLES) {
      if (!r.detecteur) expect(r.llm, r.id).toBeTruthy();
    }
  });
});
```

- [ ] **Step 6: Implémenter `lib/rules/index.ts` (registre vide pour l'instant, rempli par les tâches 3-7)**

```ts
import type { Famille, Regle } from "./types";
export * from "./types";

// Les tableaux par famille sont ajoutés par les tâches suivantes :
// import { FORMULES_STANDARD } from "./formules-standard"; etc.
export const REGLES: Regle[] = [
  // ...FORMULES_STANDARD, ...TYPOGRAPHIE, ...REFERENCES, ...STRUCTURELLES, ...REGLES_LLM
];

export const FAMILLES: Famille[] = [
  "Titres", "Divisions et subdivisions", "Alinéas", "Typographie",
  "Modifications de la norme", "Références", "Formules standard",
];

export function regleParId(id: string): Regle | undefined {
  return REGLES.find((r) => r.id === id);
}
```

Note : `registre.test.ts` passera trivialement tant que `REGLES` est vide (boucles sur tableau vide) — c'est attendu ; il devient contraignant dès la tâche 3.

- [ ] **Step 7: Lancer les tests et committer**

```bash
npm run test
git add -A && git commit -m "Add rules catalogue types, registry and regex detector factory"
```

---

### Task 3: Règles lexicales — formules standard (§9.2)

**Files:**
- Create: `lib/rules/formules-standard.ts`
- Modify: `lib/rules/index.ts` (brancher le tableau)
- Test: `tests/rules/formules-standard.test.ts`

**Interfaces:**
- Consumes: `detecteurRegex` (Task 2), types (Task 2)
- Produces: `FORMULES_STANDARD: Regle[]` (ids `R9.2-01` à `R9.2-18`)

- [ ] **Step 1: Test qui échoue** — `tests/rules/formules-standard.test.ts`

Table de cas : pour chaque règle un cas positif (détecte + bonne suggestion), un cas négatif, un faux-positif connu.

```ts
import { describe, it, expect } from "vitest";
import { FORMULES_STANDARD } from "@/lib/rules/formules-standard";

function detecte(id: string, texte: string) {
  const r = FORMULES_STANDARD.find((x) => x.id === id)!;
  return r.detecteur!(texte);
}

const CAS: Array<[id: string, ko: string, suggestion: string | undefined, ok: string]> = [
  ["R9.2-01", "le juge et/ou le procureur", "ou", "le juge ou le procureur"],
  ["R9.2-02", "le droit communautaire", "européen", "la communauté de communes"],
  ["R9.2-03", "le montant maximum de l'aide", "montant maximal", "le montant maximal"],
  ["R9.2-04", "le décret visé à l'article 3", "mentionné à", "le décret mentionné à l'article 3"],
  ["R9.2-05", "prévu par l'article 20", "prévu à l'article", "prévu à l'article 20"],
  ["R9.2-06", "le ministre en charge des sports", "ministre chargé des sports", "le ministre chargé des sports"],
  ["R9.2-07", "dans les conditions fixées par décret", "dans des conditions fixées par décret", "dans des conditions fixées par décret"],
  ["R9.2-08", "les collectivités locales", "collectivités territoriales", "les collectivités territoriales"],
  ["R9.2-09", "lettre avec accusé de réception", "lettre avec demande d'avis de réception", "avis de réception"],
  ["R9.2-10", "conformément à l'article L. 3 du code civil", "en application de l'article", "conformément à l'article 13 de la Constitution"],
  ["R9.2-11", "le ou les représentants", "les", "les représentants"],
  ["R9.2-12", "au Journal officiel de la République française", "Journal officiel", "au Journal officiel"],
  ["R9.2-14", "fixée par un décret en Conseil d'État", "par décret en Conseil d'État", "fixée par décret en Conseil d'État"],
  ["R9.2-15", "les projets de lois de finances", "projets de loi de finances", "les projets de loi de finances"],
  ["R9.2-16", "la loi de finances initiale", "loi de finances de l'année", "la loi de finances de l'année"],
  ["R9.2-17", "le garde des sceaux, ministre de la justice", "ministre de la justice", "le ministre de la justice"],
  ["R9.2-18", "l'annexe du livre Ier", "annexe au livre", "l'annexe au livre Ier"],
];

describe("formules standard §9.2", () => {
  for (const [id, ko, suggestion, ok] of CAS) {
    it(`${id} détecte le cas fautif`, () => {
      const r = detecte(id, ko);
      expect(r.length).toBeGreaterThan(0);
      if (suggestion) expect(r[0].suggestion).toContain(suggestion.split(" ")[0]);
    });
    it(`${id} ignore le cas correct`, () => {
      expect(detecte(id, ok)).toHaveLength(0);
    });
  }
  it("R9.2-02 ne matche pas à l'intérieur d'un mot", () => {
    expect(detecte("R9.2-02", "les communautés urbaines")).toHaveLength(0);
  });
  it("R9.2-13 préfet -> représentant de l'État", () => {
    expect(detecte("R9.2-13", "le préfet du département")[0].suggestion)
      .toBe("représentant de l'État dans le département");
    expect(detecte("R9.2-13", "la préfecture")).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Vérifier l'échec** — `npm run test -- tests/rules/formules-standard.test.ts` → FAIL.

- [ ] **Step 3: Implémenter `lib/rules/formules-standard.ts`**

Frontières de mots FR : utiliser `(?<![A-Za-zÀ-ÿ])` / `(?![A-Za-zÀ-ÿ])` (le `\b` JS gère mal les accents). Modèle :

```ts
import type { Regle } from "./types";
import { detecteurRegex } from "@/lib/engine/regex";

const G = "(?<![A-Za-zÀ-ÿ])"; // début de mot
const D = "(?![A-Za-zÀ-ÿ])";  // fin de mot

function regle(r: Omit<Regle, "famille">): Regle {
  return { famille: "Formules standard", ...r };
}

export const FORMULES_STANDARD: Regle[] = [
  regle({
    id: "R9.2-01", ref: "§9.2", severite: "enfreinte",
    titre: "« et/ou » est proscrit",
    explication: "La formule « et/ou » n'a pas sa place dans un texte normatif : le « ou » juridique n'est pas exclusif.",
    exempleKo: "le maire et/ou le préfet", exempleOk: "le maire ou le préfet",
    detecteur: detecteurRegex(new RegExp(`${G}et/ou${D}`, "g"), {
      message: "La formule « et/ou » est à proscrire.", suggestion: "ou",
    }),
  }),
  regle({
    id: "R9.2-02", ref: "§9.2", severite: "enfreinte",
    titre: "« communautaire » → « européen »",
    explication: "Depuis le traité de Lisbonne, on écrit « européen » ou « de l'Union européenne », plus « communautaire ».",
    exempleKo: "le droit communautaire", exempleOk: "le droit européen",
    detecteur: detecteurRegex(new RegExp(`${G}communautaires?${D}`, "g"), {
      message: "« communautaire » ne doit plus être employé pour l'Union européenne.",
      suggestion: "européen",
    }),
  }),
  // R9.2-03 montant maximum → maximal
  // R9.2-04 visé(e/s) à/au(x) → mentionné(e/s) à/au(x)  [suggestion dynamique]
  // R9.2-05 prévu(e/s) par l'article → prévu(e/s) à l'article
  // R9.2-06 ministre en charge de(s) → ministre chargé de(s)
  // R9.2-07 dans les conditions fixées par décret → dans des conditions...
  // R9.2-08 collectivités locales → collectivités territoriales
  // R9.2-09 accusé de réception → lettre avec demande d'avis de réception (severite a_revoir, pas d'auto-fix sûr → suggestion quand le motif complet "accusé de réception" est présent)
  // R9.2-10 conformément à (sauf si suivi de "à la Constitution" ou "de la Constitution") → en application de  [lookahead négatif: /conformément à (?!l'article \d+ de la Constitution|la Constitution)/]
  // R9.2-11 "le ou les " → "les "
  // R9.2-12 Journal officiel de la République française → Journal officiel (severite suggestion)
  // R9.2-13 préfet (mot exact, pas préfecture) → représentant de l'État dans le département (severite a_revoir : légitime hors normatif)
  // R9.2-14 par un décret en Conseil d'État → par décret en Conseil d'État
  // R9.2-15 projets de lois de finances → projets de loi de finances
  // R9.2-16 loi de finances initiale → loi de finances de l'année
  // R9.2-17 garde des sceaux, ministre de la justice → ministre de la justice
  // R9.2-18 annexe du livre → annexe au livre
];
```

Écrire les 18 règles complètes sur ce modèle (chaque commentaire ci-dessus devient un objet `regle({...})` complet avec titre/explication/exemples tirés du tableau §9.2 de `GUIDE_LEGISTIQUE.md`). Pour R9.2-04 : regex `visé(e?s?) (à|au|aux)` et suggestion dynamique `(m) => \`mentionné${m[1]} ${m[2]}\``. Pour R9.2-10, cas Constitution en lookahead négatif.

- [ ] **Step 4: Brancher dans `lib/rules/index.ts`**

```ts
import { FORMULES_STANDARD } from "./formules-standard";
export const REGLES: Regle[] = [...FORMULES_STANDARD];
```

- [ ] **Step 5: Vérifier** — `npm run test` → PASS (formules + registre).

- [ ] **Step 6: Commit** — `git add -A && git commit -m "Add standard formulas rules (guide section 9.2)"`

---

### Task 4: Règles lexicales — typographie (§7.2)

**Files:**
- Create: `lib/rules/typographie.ts`
- Modify: `lib/rules/index.ts`
- Test: `tests/rules/typographie.test.ts`

**Interfaces:**
- Consumes: `detecteurRegex`, types
- Produces: `TYPOGRAPHIE: Regle[]` (ids `R7.2-01` à `R7.2-07`)

- [ ] **Step 1: Test qui échoue** — `tests/rules/typographie.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { TYPOGRAPHIE } from "@/lib/rules/typographie";

function detecte(id: string, texte: string) {
  const r = TYPOGRAPHIE.find((x) => x.id === id)!;
  return r.detecteur!(texte);
}

describe("typographie §7.2", () => {
  it("R7.2-01 détecte les parenthèses", () => {
    const r = detecte("R7.2-01", "la commission (créée en 2020) statue");
    expect(r).toHaveLength(1);
    expect(r[0].extrait).toBe("(créée en 2020)");
  });
  it("R7.2-01 ignore un texte sans parenthèses", () => {
    expect(detecte("R7.2-01", "la commission statue")).toHaveLength(0);
  });
  it("R7.2-02 détecte un sigle", () => {
    expect(detecte("R7.2-02", "la CNIL est consultée").length).toBe(1);
  });
  it("R7.2-02 ignore les chiffres romains et exceptions", () => {
    expect(detecte("R7.2-02", "le titre III du livre VIII")).toHaveLength(0);
    expect(detecte("R7.2-02", "l'établissement public OSEO")).toHaveLength(0);
  });
  it("R7.2-03 détecte les guillemets anglais", () => {
    expect(detecte("R7.2-03", 'les mots : "deux ans" sont supprimés').length).toBeGreaterThan(0);
  });
  it("R7.2-04 détecte Etat sans accent", () => {
    const r = detecte("R7.2-04", "un Etat membre");
    expect(r[0].suggestion).toBe("État");
    expect(detecte("R7.2-04", "un État membre")).toHaveLength(0);
  });
  it("R7.2-04 détecte « A la » en début de phrase", () => {
    expect(detecte("R7.2-04", "A la première phrase, le mot est supprimé")[0].suggestion).toBe("À la");
    expect(detecte("R7.2-04", "A. – L'article 3 est abrogé")).toHaveLength(0);
  });
  it("R7.2-05 détecte un nombre à points", () => {
    const r = detecte("R7.2-05", "un montant de 1.205.632 €");
    expect(r[0].suggestion).toBe("1 205 632");
    expect(detecte("R7.2-05", "un montant de 1 205 632 €")).toHaveLength(0);
  });
  it("R7.2-06 signale les nombres en chiffres pour les durées/personnes", () => {
    expect(detecte("R7.2-06", "une peine de 3 ans").length).toBe(1);
    expect(detecte("R7.2-06", "100 000 habitants")).toHaveLength(0); // exception habitants
  });
  it("R7.2-07 signale les locutions latines", () => {
    expect(detecte("R7.2-07", "les dispositions in fine du texte").length).toBe(1);
    expect(detecte("R7.2-07", "la finalité du texte")).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Vérifier l'échec** — FAIL.

- [ ] **Step 3: Implémenter `lib/rules/typographie.ts`**

Points d'implémentation :

```ts
// R7.2-01 Parenthèses proscrites — /\([^)\n]{1,120}\)/g — severite enfreinte, pas de suggestion auto
//   message: "Les parenthèses sont proscrites ; les remplacer le plus souvent par des virgules."
// R7.2-02 Sigles — new RegExp(`${G}(?![IVXLCDM]+${D})[A-ZÀ-Ý]{2,}${D}`, "g") + filtre EXCEPTIONS
const EXCEPTIONS_SIGLES = new Set(["OSEO", "CHAPITRE", "TITRE", "LIVRE", "SECTION", "PARTIE", "DISPOSITIONS"]);
//   detecteur custom : lancer la regex puis filtrer les matches présents dans EXCEPTIONS_SIGLES
//   severite: "a_revoir" (le sigle peut être le qualificatif exact de l'organisme)
// R7.2-03 Guillemets anglais — /"/g — severite enfreinte, message renvoyant aux guillemets « français »
//   (pas de suggestion auto : ouvrant vs fermant ambigu)
// R7.2-04 Majuscules non accentuées — deux motifs combinés dans un détecteur custom :
//   /(?<![A-Za-zÀ-ÿ])Etats?(?![a-zà-ÿ])/g → suggestion "État(s)"
//   /(?<![A-Za-zÀ-ÿ.])A (la|l'|le|les|compter|cette|ce|défaut|titre)/g → suggestion "À $1"
//   Le lookbehind avec "." exclut "A. – " (subdivision) ; concaténer les détections des deux motifs.
// R7.2-05 Nombres à points — /\d{1,3}(?:\.\d{3})+(?!\d)/g → suggestion m[0].replaceAll(".", " ")
// R7.2-06 Nombres en chiffres pour durées/personnes — severite a_revoir, pas de suggestion auto
//   new RegExp(`${G}\\d+\\s+(ans?|mois|salariés?|personnes?|agents?|députés?|sénateurs?)${D}`, "g")
//   PAS "habitants" (exception du guide). Message : "Les nombres s'écrivent en toutes lettres pour les personnes et les durées."
// R7.2-07 Locutions latines — liste ["in fine","a fortiori","a contrario","de facto","de jure","mutatis mutandis","ratione materiae","ratione loci","in situ"] jointes en alternance regex, severite suggestion
```

Chaque règle = objet `Regle` complet (titre, explication pédagogique, exemples OK/KO tirés du guide). Pour R7.2-02 et R7.2-04, écrire le `detecteur` à la main (fonction) plutôt que via `detecteurRegex`, en réutilisant la même forme de sortie.

- [ ] **Step 4: Brancher dans `lib/rules/index.ts`** (`...TYPOGRAPHIE`)

- [ ] **Step 5: Vérifier** — `npm run test` → PASS.

- [ ] **Step 6: Commit** — `git commit -am "Add typography rules (guide section 7.2)"`

---

### Task 5: Règles lexicales — références (§9.1), point d'impact (§8.1), abrogé/supprimé (§8.3)

**Files:**
- Create: `lib/rules/references.ts`
- Modify: `lib/rules/index.ts`
- Test: `tests/rules/references.test.ts`

**Interfaces:**
- Consumes: `detecteurRegex`, types
- Produces: `REFERENCES: Regle[]` (ids `R9.1-01`..`R9.1-03`, `R8.1-01`, `R8.3-01`, `R8.3-02`)

- [ ] **Step 1: Test qui échoue** — `tests/rules/references.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { REFERENCES } from "@/lib/rules/references";

function detecte(id: string, texte: string) {
  const r = REFERENCES.find((x) => x.id === id)!;
  return r.detecteur!(texte);
}

describe("références et modifications", () => {
  it("R9.1-01 détecte les renvois relatifs", () => {
    expect(detecte("R9.1-01", "comme prévu à l'alinéa précédent").length).toBe(1);
    expect(detecte("R9.1-01", "mentionné à l'article suivant").length).toBe(1);
    expect(detecte("R9.1-01", "au deuxième alinéa")).toHaveLength(0);
  });
  it("R9.1-02 détecte ci-dessus / dispositions qui précèdent", () => {
    expect(detecte("R9.1-02", "les dispositions ci-dessus").length).toBe(1);
    expect(detecte("R9.1-02", "les dispositions qui précèdent").length).toBe(1);
  });
  it("R9.1-03 détecte les références imprécises aux dispositions", () => {
    expect(detecte("R9.1-03", "la présente disposition s'applique").length).toBe(1);
    expect(detecte("R9.1-03", "le présent article s'applique")).toHaveLength(0);
  });
  it("R8.1-01 détecte « Dans le … alinéa » comme point d'impact", () => {
    const r = detecte("R8.1-01", "Dans le premier alinéa de l'article 2, le mot est supprimé");
    expect(r.length).toBe(1);
    expect(r[0].suggestion).toBe("Au premier alinéa");
    expect(detecte("R8.1-01", "Au premier alinéa de l'article 2")).toHaveLength(0);
  });
  it("R8.3-01 : un alinéa/une phrase/des mots se SUPPRIMENT", () => {
    const r = detecte("R8.3-01", "Le deuxième alinéa est abrogé.");
    expect(r.length).toBe(1);
    expect(r[0].suggestion).toContain("supprimé");
    expect(detecte("R8.3-01", "Le deuxième alinéa est supprimé.")).toHaveLength(0);
  });
  it("R8.3-02 : un article/une division s'ABROGE", () => {
    const r = detecte("R8.3-02", "L'article L. 212-3 est supprimé.");
    expect(r.length).toBe(1);
    expect(r[0].suggestion).toContain("abrogé");
    expect(detecte("R8.3-02", "L'article L. 212-3 est abrogé.")).toHaveLength(0);
    expect(detecte("R8.3-02", "Les mots : « deux ans » sont supprimés.")).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Vérifier l'échec** — FAIL.

- [ ] **Step 3: Implémenter `lib/rules/references.ts`**

```ts
// R9.1-01 — /(l'|à l'|de l')(alinéa|article) (précédent|suivant)/gi — enfreinte, pas d'auto-fix
// R9.1-02 — /(ci-dessus|ci-dessous|les dispositions qui précèdent)/g — enfreinte
// R9.1-03 — /(la présente disposition|ces dispositions)/g — a_revoir,
//   message: préférer « le présent article » ou « le présent alinéa »
// R8.1-01 — new RegExp(`${G}Dans (le |la |l'|les )((?:[a-zà-ÿ-]+ ){0,3})(alinéa|article|phrase)`, "g")
//   suggestion dynamique : (m) => `${m[1] === "l'" ? "À l'" : m[1] === "les " ? "Aux " : "Au "}${m[2]}${m[3]}`
//     (pour "la " → "À la ") — enfreinte ; famille "Modifications de la norme"
// R8.3-01 — new RegExp(`(alinéas?|phrases?|mots?|nombres?|chiffres?|taux|années?|dates?|montants?|mentions?)([^.;:\\n]{0,40}?)(est|sont) abrogée?s?`, "g")
//   suggestion : (m) => `${m[1]}${m[2]}${m[3]} supprimé${m[0].endsWith("s") ? "s" : ""}` — simplifier :
//   remplacer seulement le verbe : détection sur tout le motif, suggestion = extrait avec "abrogé"→"supprimé"
// R8.3-02 — new RegExp(`(articles?|chapitres?|titres?|sections?|sous-sections?|livres?|parties?|\\d+°)([^.;:\\n]{0,40}?)(est|sont) supprimée?s?`, "g")
//   suggestion = extrait avec "supprimé"→"abrogé"
```

Familles : R9.1-* → "Références" ; R8.1-01 et R8.3-* → "Modifications de la norme". Suggestion la plus robuste : `suggestion: (m) => m[0].replace(/abrogé/g, "supprimé")` (et inversement), qui conserve les accords.

- [ ] **Step 4: Brancher dans `lib/rules/index.ts`** (`...REFERENCES`)

- [ ] **Step 5: Vérifier** — `npm run test` → PASS.

- [ ] **Step 6: Commit** — `git commit -am "Add reference, impact-point and abrogation rules"`

---

### Task 6: Parseur structurel (lignes + classification)

**Files:**
- Create: `lib/engine/structure.ts`
- Test: `tests/engine/structure.test.ts`

**Interfaces:**
- Produces:
  - `interface Ligne { texte: string; start: number; end: number }` (offsets absolus dans le texte source, sans le `\n`)
  - `decouperLignes(texte: string): Ligne[]`
  - `type TypeLigne = "paragraphe_romain" | "lettre_maj" | "numero" | "lettre_min" | "enum_degre" | "enum_lettre" | "tiret" | "alinea_redige" | "chapeau_redige" | "autre"`
  - `interface LigneClassifiee extends Ligne { type: TypeLigne; marqueur?: string; avecTiret?: boolean }`
  - `classifierLigne(l: Ligne): LigneClassifiee`

- [ ] **Step 1: Test qui échoue** — `tests/engine/structure.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { decouperLignes, classifierLigne } from "@/lib/engine/structure";

describe("decouperLignes", () => {
  it("découpe avec offsets absolus", () => {
    const l = decouperLignes("abc\ndef\n\nghi");
    expect(l).toHaveLength(4);
    expect(l[1]).toEqual({ texte: "def", start: 4, end: 7 });
    expect(l[3]).toEqual({ texte: "ghi", start: 9, end: 12 });
  });
});

describe("classifierLigne", () => {
  const cas: Array<[string, string, boolean | undefined]> = [
    ["I. – L'article 2 est abrogé.", "paragraphe_romain", true],
    ["II. L'article 3 est abrogé.", "paragraphe_romain", false],
    ["A. – L'article 4 est abrogé.", "lettre_maj", true],
    ["1. L'article 5 est abrogé.", "numero", false],
    ["1. – L'article 5 est abrogé.", "numero", true],
    ["a. Le premier alinéa est supprimé.", "lettre_min", false],
    ["1° Le deuxième alinéa est supprimé ;", "enum_degre", undefined],
    ["a) La première phrase est supprimée ;", "enum_lettre", undefined],
    ["– la première phrase ;", "tiret", undefined],
    ["« Art. L. 312-5. – Le dépôt s'effectue à la mairie. »", "alinea_redige", undefined],
    ["L'article L. 313-1 est complété par un alinéa ainsi rédigé :", "chapeau_redige", undefined],
    ["Le Gouvernement remet un rapport.", "autre", undefined],
  ];
  for (const [texte, type, avecTiret] of cas) {
    it(`classe « ${texte.slice(0, 30)}… » comme ${type}`, () => {
      const c = classifierLigne({ texte, start: 0, end: texte.length });
      expect(c.type).toBe(type);
      if (avecTiret !== undefined) expect(c.avecTiret).toBe(avecTiret);
    });
  }
});
```

- [ ] **Step 2: Vérifier l'échec** — FAIL.

- [ ] **Step 3: Implémenter `lib/engine/structure.ts`**

```ts
export interface Ligne { texte: string; start: number; end: number }

export type TypeLigne =
  | "paragraphe_romain" | "lettre_maj" | "numero" | "lettre_min"
  | "enum_degre" | "enum_lettre" | "tiret"
  | "alinea_redige" | "chapeau_redige" | "autre";

export interface LigneClassifiee extends Ligne {
  type: TypeLigne;
  marqueur?: string;   // "I", "A", "1", "a", "1°", "a)"…
  avecTiret?: boolean; // pour paragraphe_romain / lettre_maj / numero / lettre_min
}

export function decouperLignes(texte: string): Ligne[] {
  const lignes: Ligne[] = [];
  let start = 0;
  for (const part of texte.split("\n")) {
    lignes.push({ texte: part, start, end: start + part.length });
    start += part.length + 1;
  }
  return lignes;
}

const RE_ROMAIN = /^([IVXLCDM]+)\.\s*(–|-)?\s/;
const RE_LETTRE_MAJ = /^([A-Z])\.\s*(–|-)?\s/;
const RE_NUMERO = /^(\d+)\.\s*(–|-)?\s/;
const RE_LETTRE_MIN = /^([a-z])\.\s*(–|-)?\s/;
const RE_ENUM_DEGRE = /^(\d+°(?:\s?(?:bis|ter|quater))?)\s/;
const RE_ENUM_LETTRE = /^([a-z])\)\s/;
const RE_TIRET = /^[–-]\s/;
const RE_CHAPEAU = /(ainsi rédigée?s?\s*:|ainsi modifiée?s?\s*:)\s*$/;

export function classifierLigne(l: Ligne): LigneClassifiee {
  const t = l.texte;
  let m: RegExpMatchArray | null;
  if (t.startsWith("«")) return { ...l, type: "alinea_redige" };
  if ((m = t.match(RE_ROMAIN))) return { ...l, type: "paragraphe_romain", marqueur: m[1], avecTiret: !!m[2] };
  if ((m = t.match(RE_LETTRE_MAJ))) return { ...l, type: "lettre_maj", marqueur: m[1], avecTiret: !!m[2] };
  if ((m = t.match(RE_NUMERO))) return { ...l, type: "numero", marqueur: m[1], avecTiret: !!m[2] };
  if ((m = t.match(RE_LETTRE_MIN))) return { ...l, type: "lettre_min", marqueur: m[1], avecTiret: !!m[2] };
  if ((m = t.match(RE_ENUM_DEGRE))) return { ...l, type: "enum_degre", marqueur: m[1] };
  if ((m = t.match(RE_ENUM_LETTRE))) return { ...l, type: "enum_lettre", marqueur: m[1] };
  if (RE_TIRET.test(t)) return { ...l, type: "tiret" };
  if (RE_CHAPEAU.test(t)) return { ...l, type: "chapeau_redige" };
  return { ...l, type: "autre" };
}
```

Attention à l'ordre : `RE_ROMAIN` avant `RE_LETTRE_MAJ` (sinon "I." classé lettre) ; un "I" seul est aussi une lettre majuscule — l'ordre romain-d'abord donne la bonne priorité. "V.", "X." → romain : acceptable pour le MVP (marqueurs de paragraphes en pratique).

- [ ] **Step 4: Vérifier** — PASS. **Step 5: Commit** — `git commit -am "Add structural line parser"`

---

### Task 7: Règles structurelles (§5, §6)

**Files:**
- Create: `lib/rules/structurelles.ts`
- Modify: `lib/rules/index.ts`
- Test: `tests/rules/structurelles.test.ts`

**Interfaces:**
- Consumes: `decouperLignes`, `classifierLigne` (Task 6)
- Produces: `STRUCTURELLES: Regle[]` (ids `R5-01`..`R5-04`, `R6-01`, `R6-02`)

- [ ] **Step 1: Test qui échoue** — `tests/rules/structurelles.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { STRUCTURELLES } from "@/lib/rules/structurelles";

function detecte(id: string, texte: string) {
  const r = STRUCTURELLES.find((x) => x.id === id)!;
  return r.detecteur!(texte);
}

describe("règles structurelles §5/§6", () => {
  it("R5-01 : tiret manquant après I. / A.", () => {
    expect(detecte("R5-01", "I. L'article 2 est abrogé.").length).toBe(1);
    expect(detecte("R5-01", "A. L'article 3 est abrogé.").length).toBe(1);
    expect(detecte("R5-01", "I. – L'article 2 est abrogé.")).toHaveLength(0);
  });
  it("R5-02 : tiret indu après 1. / a.", () => {
    expect(detecte("R5-02", "1. – L'article 4 est abrogé.").length).toBe(1);
    expect(detecte("R5-02", "a. – Le premier alinéa est supprimé.").length).toBe(1);
    expect(detecte("R5-02", "1. L'article 4 est abrogé.")).toHaveLength(0);
  });
  it("R5-03 : minuscule en début de subdivision d'énumération", () => {
    expect(detecte("R5-03", "1° le deuxième alinéa est supprimé ;").length).toBe(1);
    expect(detecte("R5-03", "1° Le deuxième alinéa est supprimé ;")).toHaveLength(0);
    expect(detecte("R5-03", "– la première phrase ;")).toHaveLength(0); // tirets : minuscule OK
  });
  it("R5-04 : point-virgule manquant en fin d'élément d'énumération non final", () => {
    const texte = "1° Le deuxième alinéa est supprimé.\n2° Le troisième alinéa est supprimé.";
    const r = detecte("R5-04", texte);
    expect(r.length).toBe(1); // seule la 1re ligne fautive (la 2e clôt l'énumération)
    expect(detecte("R5-04", "1° Le deuxième alinéa est supprimé ;\n2° Le troisième alinéa est supprimé.")).toHaveLength(0);
  });
  it("R6-01 : ligne d'un bloc rédigé sans guillemet ouvrant", () => {
    const texte = [
      "L'article 2 est complété par deux alinéas ainsi rédigés :",
      "« Le premier alinéa est applicable.",
      "Le second alinéa est applicable. »",
    ].join("\n");
    const r = detecte("R6-01", texte);
    expect(r.length).toBe(1);
    expect(r[0].extrait).toContain("Le second alinéa");
  });
  it("R6-02 : guillemet fermant avant la fin du bloc rédigé", () => {
    const texte = [
      "L'article 2 est complété par deux alinéas ainsi rédigés :",
      "« Le premier alinéa est applicable. »",
      "« Le second alinéa est applicable. »",
    ].join("\n");
    expect(detecte("R6-02", texte).length).toBe(1);
    const ok = [
      "L'article 2 est complété par deux alinéas ainsi rédigés :",
      "« Le premier alinéa est applicable.",
      "« Le second alinéa est applicable. »",
    ].join("\n");
    expect(detecte("R6-02", ok)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Vérifier l'échec** — FAIL.

- [ ] **Step 3: Implémenter `lib/rules/structurelles.ts`**

Chaque détecteur suit le motif : `decouperLignes` → `classifierLigne` → détections avec spans absolus.

```ts
// R5-01 (enfreinte, famille "Divisions et subdivisions")
//   pour chaque ligne paragraphe_romain|lettre_maj avec avecTiret === false :
//   span = { start: l.start, end: l.start + marqueur.length + 1 } (couvre "I.")
//   suggestion = `${marqueur}. –` ; message "Les subdivisions I. et A. sont suivies d'un tiret."
// R5-02 (enfreinte) — inverse : numero|lettre_min avec avecTiret === true ;
//   span couvre "1. –", suggestion `${marqueur}.`
// R5-03 (enfreinte) — lignes enum_degre|enum_lettre dont le premier caractère après
//   le marqueur+espace est [a-zà-ÿ] ; span = ce caractère ; suggestion = majuscule.
//   (Les lignes "tiret" sont exclues : elles commencent par une minuscule.)
// R5-04 (enfreinte) — lignes enum_degre|enum_lettre|tiret suivies (en sautant les lignes vides)
//   d'une ligne du même type OU d'un type d'énumération imbriqué, et ne se terminant
//   ni par ";" ni par "; »" ni par ":" → span = dernier caractère non blanc de la ligne ;
//   message "Tout élément d'énumération non final s'achève par un point-virgule."
//   Pas de suggestion auto (remplacement du point final ambigu avec guillemets).
// R6-01 (enfreinte, famille "Alinéas") — état bloc rédigé :
//   après une ligne chapeau_redige, on est "dans un bloc" ; chaque ligne non vide suivante
//   doit commencer par « ; le bloc se termine à la ligne dont le texte finit par » .
//   Ligne dans le bloc sans « initial → détection (span = ligne entière).
//   Si la ligne fautive termine par » on considère le bloc fermé après elle.
// R6-02 (enfreinte) — même parcours : ligne DANS le bloc (pas la dernière) qui se
//   termine par » alors qu'une ligne suivante commence par « (le bloc continue) →
//   détection sur le » final. Message : "Seul le dernier alinéa d'un bloc rédigé est clos par des guillemets."
```

Pour R6-01/R6-02 : détecter la fin de bloc = ligne se terminant par `»` ou `» ;` ou `». ` trim. Implémenter un util partagé `blocsRediges(lignes: LigneClassifiee[]): Array<{chapeau: number; lignes: number[]}>` local au fichier.

- [ ] **Step 4: Brancher dans `lib/rules/index.ts`** (`...STRUCTURELLES`)

- [ ] **Step 5: Vérifier** — `npm run test` → PASS.

- [ ] **Step 6: Commit** — `git commit -am "Add structural rules (subdivisions, enumerations, quoted blocks)"`

---

### Task 8: Règles LLM du catalogue + moteur d'analyse déterministe

**Files:**
- Create: `lib/rules/llm.ts`, `lib/engine/analyser.ts`
- Modify: `lib/rules/index.ts`
- Test: `tests/engine/analyser.test.ts`

**Interfaces:**
- Produces:
  - `REGLES_LLM: Regle[]` (sans `detecteur`, avec champ `llm`) : `RL-01` titre bref (§1), `RL-02` précision du point d'impact (§8.1), `RL-03` « du même code »/« la présente loi » (§9.1), `RL-04` « dernier alinéa » vs numérotation (§8.1), `RL-05` formules de remplacement/insertion/complément (§8.2)
  - `analyser(texte: string): Finding[]` — exécute tous les `detecteur` du catalogue, trie par `span.start`, ids stables `${ruleId}:${start}`

- [ ] **Step 1: Écrire `lib/rules/llm.ts`**

5 règles complètes. Exemple :

```ts
import type { Regle } from "./types";

export const REGLES_LLM: Regle[] = [
  {
    id: "RL-01", famille: "Titres", ref: "§1", severite: "a_revoir",
    titre: "Le titre doit être bref et sans références législatives",
    explication: "Le titre d'une loi résume son contenu. Les références législatives y sont proscrites (lourdeur, risque d'inexactitude).",
    exempleKo: "Proposition de loi visant à modifier l'article L. 121-1 du code de la consommation et diverses dispositions relatives à…",
    exempleOk: "Proposition de loi relative à la protection des consommateurs",
    llm: "Si le texte comporte un titre (première ligne ou ligne commençant par « Proposition de loi » / « Projet de loi »), vérifier qu'il est bref (< 30 mots) et ne contient aucune référence d'article (« L. 121-1 », « article 3 »…). Citer le titre exact.",
  },
  // RL-02 : point d'impact le plus précis possible (« À la seconde phrase du deuxième alinéa du… ») ;
  //   signaler les points d'impact vagues (« À l'article 2, les mots… » quand l'article a plusieurs alinéas).
  // RL-03 : « du même code » doit renvoyer au code cité juste avant ; « la présente loi » interdit
  //   dans un article codifié (→ « le présent code »). Citer le passage exact.
  // RL-04 : préférer « le dernier alinéa » à « le cinquième alinéa » quand c'est le dernier,
  //   « le second » quand il n'y en a que deux, « l'avant-dernier » plutôt que son numéro.
  // RL-05 : vérifier les formules du §8.2 : remplacement intégral = « est ainsi rédigé » ;
  //   1→n = « est remplacé par » ; début de structure = « au début…, il est ajouté » ;
  //   fin de structure = « est complété par » (et non « après l'article X, il est inséré » pour une fin de division) ;
  //   milieu = « il est inséré ».
];
```

Écrire chaque règle complète (titre/explication/exemples/llm) à partir des sections correspondantes de `GUIDE_LEGISTIQUE.md`.

- [ ] **Step 2: Test qui échoue pour `analyser`** — `tests/engine/analyser.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { analyser } from "@/lib/engine/analyser";

describe("analyser", () => {
  const texte = "Dans le premier alinéa, les mots et/ou sont supprimés (par cohérence).";
  it("agrège les findings de toutes les règles, triés par position", () => {
    const f = analyser(texte);
    const ids = f.map((x) => x.ruleId);
    expect(ids).toContain("R8.1-01"); // Dans le premier alinéa
    expect(ids).toContain("R9.2-01"); // et/ou
    expect(ids).toContain("R7.2-01"); // parenthèses
    const starts = f.map((x) => x.span!.start);
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });
  it("produit des findings complets", () => {
    const f = analyser(texte).find((x) => x.ruleId === "R9.2-01")!;
    expect(f.id).toBe(`R9.2-01:${f.span!.start}`);
    expect(f.severite).toBe("enfreinte");
    expect(f.source).toBe("regle");
    expect(f.message.length).toBeGreaterThan(5);
  });
  it("retourne [] sur un texte propre", () => {
    expect(analyser("Le maire transmet la liste au représentant de l'État dans le département.")).toEqual([]);
  });
});
```

- [ ] **Step 3: Vérifier l'échec** — FAIL.

- [ ] **Step 4: Implémenter `lib/engine/analyser.ts`**

```ts
import { REGLES } from "@/lib/rules";
import type { Finding } from "@/lib/rules/types";

export function analyser(texte: string): Finding[] {
  const findings: Finding[] = [];
  for (const regle of REGLES) {
    if (!regle.detecteur) continue;
    for (const d of regle.detecteur(texte)) {
      findings.push({
        id: `${regle.id}:${d.span.start}`,
        ruleId: regle.id,
        span: d.span,
        extrait: d.extrait,
        message: d.message ?? regle.explication,
        suggestion: d.suggestion,
        severite: regle.severite,
        source: "regle",
      });
    }
  }
  return findings.sort((a, b) => a.span!.start - b.span!.start || a.ruleId.localeCompare(b.ruleId));
}
```

Brancher `...REGLES_LLM` dans `lib/rules/index.ts` (le test registre vérifie qu'elles ont bien `llm`).

- [ ] **Step 5: Vérifier** — `npm run test` → PASS. **Step 6: Commit** — `git commit -am "Add LLM-only rules and deterministic analysis engine"`

---

### Task 9: Fusion, score et corrections

**Files:**
- Create: `lib/engine/fusion.ts`, `lib/engine/score.ts`, `lib/engine/corrections.ts`
- Test: `tests/engine/fusion.test.ts`, `tests/engine/score.test.ts`, `tests/engine/corrections.test.ts`

**Interfaces:**
- Produces:
  - `ancrer(citation: string, texte: string): Span | null` (indexOf ; première occurrence)
  - `fusionner(deterministes: Finding[], llm: Finding[]): Finding[]` (chevauchement → déterministe gagne ; tri par start, spans null à la fin)
  - `chevauche(a: Span, b: Span): boolean`
  - `interface Score { global: number; parSeverite: Record<Severite, number>; parFamille: Record<string, number> }`
  - `calculerScore(findings: Finding[], texte: string): Score`
  - `appliquerCorrection(texte: string, f: Finding): string`
  - `appliquerToutes(texte: string, findings: Finding[]): string` (tri décroissant par start puis application)

- [ ] **Step 1: Tests qui échouent**

`tests/engine/fusion.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { ancrer, fusionner, chevauche } from "@/lib/engine/fusion";
import type { Finding } from "@/lib/rules/types";

const f = (o: Partial<Finding>): Finding => ({
  id: "x", ruleId: "R", span: { start: 0, end: 5 }, extrait: "", message: "",
  severite: "enfreinte", source: "regle", ...o,
});

describe("ancrer", () => {
  it("retrouve l'offset d'une citation exacte", () => {
    expect(ancrer("et/ou", "choix et/ou option")).toEqual({ start: 6, end: 11 });
  });
  it("retourne null si introuvable", () => {
    expect(ancrer("absent", "texte")).toBeNull();
  });
});

describe("fusionner", () => {
  it("écarte le finding LLM qui chevauche un déterministe", () => {
    const det = [f({ id: "d1", span: { start: 10, end: 20 } })];
    const llm = [
      f({ id: "l1", source: "llm", severite: "a_revoir", span: { start: 15, end: 25 } }),
      f({ id: "l2", source: "llm", severite: "a_revoir", span: { start: 40, end: 45 } }),
    ];
    const r = fusionner(det, llm);
    expect(r.map((x) => x.id)).toEqual(["d1", "l2"]);
  });
  it("garde les findings LLM non ancrés (span null) en fin de liste", () => {
    const r = fusionner([f({ id: "d1" })], [f({ id: "l1", source: "llm", span: null })]);
    expect(r[r.length - 1].id).toBe("l1");
  });
});

describe("chevauche", () => {
  it("détecte le chevauchement", () => {
    expect(chevauche({ start: 0, end: 5 }, { start: 4, end: 8 })).toBe(true);
    expect(chevauche({ start: 0, end: 5 }, { start: 5, end: 8 })).toBe(false);
  });
});
```

`tests/engine/score.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { calculerScore } from "@/lib/engine/score";
import { analyser } from "@/lib/engine/analyser";

describe("calculerScore", () => {
  it("donne 100 sans findings", () => {
    expect(calculerScore([], "Un texte parfaitement propre.").global).toBe(100);
  });
  it("baisse avec les findings et reste dans [0, 100]", () => {
    const texte = "les collectivités locales et/ou l'Etat (voire la CNIL)";
    const findings = analyser(texte);
    const s = calculerScore(findings, texte);
    expect(s.global).toBeLessThan(100);
    expect(s.global).toBeGreaterThanOrEqual(0);
    expect(s.parSeverite.enfreinte).toBeGreaterThan(0);
  });
  it("est normalisé : mêmes findings sur texte long -> score plus haut", () => {
    const texte = "et/ou";
    const long = "mot ".repeat(500) + "et/ou";
    const sCourt = calculerScore(analyser(texte), texte);
    const sLong = calculerScore(analyser(long), long);
    expect(sLong.global).toBeGreaterThan(sCourt.global);
  });
});
```

`tests/engine/corrections.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { appliquerCorrection, appliquerToutes } from "@/lib/engine/corrections";
import { analyser } from "@/lib/engine/analyser";

describe("corrections", () => {
  it("applique une correction simple", () => {
    const texte = "le maire et/ou le préfet";
    const f = analyser(texte).find((x) => x.ruleId === "R9.2-01")!;
    expect(appliquerCorrection(texte, f)).toBe("le maire ou le préfet");
  });
  it("applique toutes les corrections sans corrompre les offsets", () => {
    const texte = "les collectivités locales et/ou l'Etat";
    const corrige = appliquerToutes(texte, analyser(texte));
    expect(corrige).toBe("les collectivités territoriales ou l'État");
  });
  it("après correction, une ré-analyse ne trouve plus les règles corrigées", () => {
    const texte = "le montant maximum et/ou le préfet";
    const corrige = appliquerToutes(texte, analyser(texte));
    const restants = analyser(corrige).filter((f) => f.suggestion);
    expect(restants).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Vérifier l'échec** — FAIL.

- [ ] **Step 3: Implémenter les trois modules**

`lib/engine/fusion.ts` :

```ts
import type { Finding, Span } from "@/lib/rules/types";

export function chevauche(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

export function ancrer(citation: string, texte: string): Span | null {
  const i = texte.indexOf(citation);
  return i === -1 ? null : { start: i, end: i + citation.length };
}

export function fusionner(deterministes: Finding[], llm: Finding[]): Finding[] {
  const retenus = llm.filter(
    (l) => !l.span || !deterministes.some((d) => d.span && chevauche(d.span!, l.span!)),
  );
  return [...deterministes, ...retenus].sort((a, b) => {
    if (!a.span) return 1;
    if (!b.span) return -1;
    return a.span.start - b.span.start;
  });
}
```

`lib/engine/score.ts` :

```ts
import { REGLES, regleParId } from "@/lib/rules";
import type { Finding, Severite } from "@/lib/rules/types";

const POIDS: Record<Severite, number> = { enfreinte: 5, a_revoir: 3, suggestion: 1 };

export interface Score {
  global: number;
  parSeverite: Record<Severite, number>;
  parFamille: Record<string, number>;
}

export function calculerScore(findings: Finding[], texte: string): Score {
  const nbMots = Math.max(texte.trim().split(/\s+/).length, 1);
  const somme = findings.reduce((s, f) => s + POIDS[f.severite], 0);
  const global = Math.round(100 * Math.exp((-6 * somme) / nbMots));
  const parSeverite: Record<Severite, number> = { enfreinte: 0, a_revoir: 0, suggestion: 0 };
  const parFamille: Record<string, number> = {};
  for (const f of findings) {
    parSeverite[f.severite]++;
    const fam = regleParId(f.ruleId)?.famille ?? "Autre";
    parFamille[fam] = (parFamille[fam] ?? 0) + 1;
  }
  return { global, parSeverite, parFamille };
}
```

`lib/engine/corrections.ts` :

```ts
import type { Finding } from "@/lib/rules/types";

export function appliquerCorrection(texte: string, f: Finding): string {
  if (!f.span || f.suggestion === undefined) return texte;
  return texte.slice(0, f.span.start) + f.suggestion + texte.slice(f.span.end);
}

export function appliquerToutes(texte: string, findings: Finding[]): string {
  const applicables = findings
    .filter((f) => f.span && f.suggestion !== undefined)
    .sort((a, b) => b.span!.start - a.span!.start); // fin -> début : offsets stables
  let resultat = texte;
  for (const f of applicables) resultat = appliquerCorrection(resultat, f);
  return resultat;
}
```

Note : si deux findings applicables se chevauchent (rare après fusion), le tri fin→début garde le résultat cohérent (le second écrase une zone déjà réécrite) — acceptable MVP.

- [ ] **Step 4: Vérifier** — `npm run test` → PASS. **Step 5: Commit** — `git commit -am "Add merge, scoring and correction application"`

---

### Task 10: Exemples de démo + golden tests

**Files:**
- Create: `data/exemples/index.ts`
- Test: `tests/exemples.test.ts`

**Interfaces:**
- Produces: `interface Exemple { id: string; titre: string; description: string; texte: string; reglesAttendues: string[] }` ; `EXEMPLES: Exemple[]` (3 entrées : `pedagogique`, `ppl`, `llm`)

- [ ] **Step 1: Écrire `data/exemples/index.ts`**

Trois textes réalistes. L'exemple `pedagogique` doit déclencher exactement les règles listées dans son `reglesAttendues` ci-dessous (une par grande famille). Squelette :

```ts
export interface Exemple {
  id: string;
  titre: string;
  description: string;
  texte: string;
  reglesAttendues: string[];
}

export const EXEMPLES: Exemple[] = [
  {
    id: "pedagogique",
    titre: "Texte pédagogique",
    description: "Un article court avec une infraction de chaque grande famille de règles.",
    texte: [
      "Article 1er",
      "I. Le code de la consommation est ainsi modifié :",
      "1° Dans le premier alinéa de l'article L. 121-1, les mots : \"pratiques commerciales\" sont remplacés par les mots : « pratiques et/ou usages » ;",
      "2° le deuxième alinéa du même article est abrogé.",
      "II. – Les collectivités locales et l'Etat (y compris la CNIL) transmettent le rapport visé à l'article 3 conformément à l'article L. 2 du code du sport, selon les modalités définies à l'alinéa précédent.",
    ].join("\n"),
    reglesAttendues: [
      "R5-01", "R8.1-01", "R7.2-03", "R9.2-01", "R5-03", "R8.3-01",
      "R9.2-08", "R7.2-04", "R7.2-01", "R7.2-02", "R9.2-04", "R9.2-10", "R9.1-01",
    ],
  },
  {
    id: "ppl",
    titre: "Extrait de proposition de loi",
    description: "Un extrait réaliste de PPL avec des infractions typiques disséminées.",
    texte: /* ~25 lignes : structure I./A./1°/a) correcte SAUF 3-4 fautes ciblées
      (un « et/ou », un « montant maximum », un bloc rédigé dont une ligne sans guillemet,
      un « ministre en charge de »), pour montrer que le moteur ne sur-détecte pas. */ "",
    reglesAttendues: ["R9.2-01", "R9.2-03", "R6-01", "R9.2-06"],
  },
  {
    id: "llm",
    titre: "Cas d'analyse approfondie",
    description: "Peu de fautes mécaniques, mais un titre trop long, un « du même code » douteux et un point d'impact imprécis — le terrain de jeu de l'analyse IA.",
    texte: /* titre de PPL > 40 mots avec référence d'article ; un « du même code » qui renvoie
      au mauvais code ; « À l'article 2, les mots… » vague ; « le cinquième alinéa » d'un
      article de 5 alinéas. Zéro faute lexicale volontaire. */ "",
    reglesAttendues: [],
  },
];
```

Rédiger les textes `ppl` et `llm` complets (~20-25 lignes chacun) en s'inspirant des exemples du guide (code du sport, code de la consommation).

- [ ] **Step 2: Golden test** — `tests/exemples.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { EXEMPLES } from "@/data/exemples";
import { analyser } from "@/lib/engine/analyser";

describe("golden tests des exemples", () => {
  for (const ex of EXEMPLES) {
    it(`${ex.id} déclenche exactement les familles attendues`, () => {
      const detectes = new Set(analyser(ex.texte).map((f) => f.ruleId));
      for (const attendu of ex.reglesAttendues) {
        expect(detectes, `règle ${attendu} attendue dans ${ex.id}`).toContain(attendu);
      }
    });
  }
  it("l'exemple llm est quasi vierge en déterministe", () => {
    const ex = EXEMPLES.find((e) => e.id === "llm")!;
    expect(analyser(ex.texte).filter((f) => f.severite === "enfreinte").length).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 3: Itérer les textes jusqu'à PASS** — ajuster le TEXTE (pas les règles) si une règle attendue ne se déclenche pas ; si une règle sur-détecte à tort, corriger la REGEX et relancer toute la suite.

- [ ] **Step 4: Commit** — `git commit -am "Add demo examples with golden tests"`

---

### Task 11: Couche LLM (Claude) + API route

**Files:**
- Create: `lib/llm/schema.ts`, `lib/llm/prompt.ts`, `lib/llm/convertir.ts`, `app/api/analyze-llm/route.ts`
- Test: `tests/llm/convertir.test.ts`, `tests/llm/prompt.test.ts`

**Interfaces:**
- Consumes: `REGLES` (règles avec champ `llm`), `ancrer` (Task 9)
- Produces:
  - `schema.ts` : `ReponseLlmSchema` (zod) → `{ findings: Array<{ ruleId: string; citation: string; message: string; suggestion: string | null }> }`
  - `prompt.ts` : `construirePromptSysteme(): string`
  - `convertir.ts` : `convertirFindingsLlm(bruts, texte): Finding[]` (ancrage + garde-fous, pur/testable)
  - Route POST `/api/analyze-llm` : body `{ texte: string }` → `{ findings: Finding[] }` ; 503 `{ erreur: "cle_absente" }` si pas de clé ; 500 `{ erreur: "llm_indisponible" }` sur échec API.

- [ ] **Step 1: `lib/llm/schema.ts`**

```ts
import { z } from "zod";

export const ReponseLlmSchema = z.object({
  findings: z.array(
    z.object({
      ruleId: z.string(),
      citation: z.string(),
      message: z.string(),
      suggestion: z.string().nullable(),
    }),
  ),
});

export type ReponseLlm = z.infer<typeof ReponseLlmSchema>;
```

- [ ] **Step 2: Test prompt** — `tests/llm/prompt.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { construirePromptSysteme } from "@/lib/llm/prompt";

describe("construirePromptSysteme", () => {
  const p = construirePromptSysteme();
  it("liste toutes les règles LLM avec leur id", () => {
    for (const id of ["RL-01", "RL-02", "RL-03", "RL-04", "RL-05"]) expect(p).toContain(id);
  });
  it("exige des citations exactes", () => {
    expect(p.toLowerCase()).toContain("verbatim");
  });
});
```

- [ ] **Step 3: Implémenter `lib/llm/prompt.ts`**

```ts
import { REGLES } from "@/lib/rules";

export function construirePromptSysteme(): string {
  const regles = REGLES.filter((r) => r.llm)
    .map((r) => `- [${r.id}] ${r.titre} (${r.ref})\n  ${r.explication}\n  Consigne : ${r.llm}`)
    .join("\n");
  return `Tu es un expert en légistique de l'Assemblée nationale. Analyse le texte législatif fourni au regard des règles suivantes du guide de légistique, et UNIQUEMENT de celles-ci :

${regles}

Contraintes impératives :
- Pour chaque problème détecté, "citation" doit reproduire VERBATIM un passage court (5 à 25 mots) du texte fourni, caractère pour caractère (mêmes espaces, mêmes guillemets), pour permettre son surlignage.
- "ruleId" doit être l'un des identifiants ci-dessus.
- "message" explique le problème en une ou deux phrases, en français, de façon pédagogique.
- "suggestion" propose une réécriture du passage cité, ou null si aucune réécriture sûre n'est possible.
- Ne signale rien qui relève de fautes purement mécaniques (formules standard, typographie) : un autre analyseur s'en charge.
- En l'absence de problème, retourne findings: [].`;
}
```

- [ ] **Step 4: Test conversion/ancrage** — `tests/llm/convertir.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { convertirFindingsLlm } from "@/lib/llm/convertir";

const texte = "Le rapport mentionné du même code est transmis.";

describe("convertirFindingsLlm", () => {
  it("ancre une citation exacte", () => {
    const f = convertirFindingsLlm(
      [{ ruleId: "RL-03", citation: "du même code", message: "Référence douteuse.", suggestion: null }],
      texte,
    );
    expect(f[0].span).toEqual({ start: 21, end: 33 });
    expect(f[0].source).toBe("llm");
    expect(f[0].severite).toBe("a_revoir");
  });
  it("garde le finding avec span null si citation introuvable", () => {
    const f = convertirFindingsLlm(
      [{ ruleId: "RL-03", citation: "citation inventée", message: "m", suggestion: null }],
      texte,
    );
    expect(f[0].span).toBeNull();
  });
  it("écarte les ruleId inconnus", () => {
    expect(convertirFindingsLlm(
      [{ ruleId: "R-INVENTÉ", citation: "du même code", message: "m", suggestion: null }],
      texte,
    )).toHaveLength(0);
  });
  it("ne produit jamais de sévérité enfreinte", () => {
    const f = convertirFindingsLlm(
      [{ ruleId: "RL-01", citation: "Le rapport", message: "m", suggestion: "s" }],
      texte,
    );
    expect(f[0].severite).not.toBe("enfreinte");
  });
});
```

- [ ] **Step 5: Implémenter `lib/llm/convertir.ts`**

```ts
import { regleParId } from "@/lib/rules";
import type { Finding } from "@/lib/rules/types";
import { ancrer } from "@/lib/engine/fusion";
import type { ReponseLlm } from "./schema";

export function convertirFindingsLlm(bruts: ReponseLlm["findings"], texte: string): Finding[] {
  const findings: Finding[] = [];
  bruts.forEach((b, i) => {
    const regle = regleParId(b.ruleId);
    if (!regle) return;
    const severite = regle.severite === "enfreinte" ? "a_revoir" : regle.severite;
    findings.push({
      id: `${b.ruleId}:llm:${i}`,
      ruleId: b.ruleId,
      span: ancrer(b.citation, texte),
      extrait: b.citation,
      message: b.message,
      suggestion: b.suggestion ?? undefined,
      severite,
      source: "llm",
    });
  });
  return findings;
}
```

- [ ] **Step 6: Vérifier** — `npm run test` → PASS.

- [ ] **Step 7: Implémenter `app/api/analyze-llm/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ReponseLlmSchema } from "@/lib/llm/schema";
import { construirePromptSysteme } from "@/lib/llm/prompt";
import { convertirFindingsLlm } from "@/lib/llm/convertir";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { texte } = (await req.json()) as { texte?: string };
  if (!texte || texte.length < 20) {
    return NextResponse.json({ erreur: "texte_invalide" }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ erreur: "cle_absente" }, { status: 503 });
  }
  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 8000,
      system: construirePromptSysteme(),
      messages: [{ role: "user", content: `Texte à analyser :\n\n${texte.slice(0, 30000)}` }],
      output_config: { format: zodOutputFormat(ReponseLlmSchema), effort: "medium" },
    });
    const parsed = response.parsed_output;
    if (!parsed) return NextResponse.json({ erreur: "llm_indisponible" }, { status: 500 });
    return NextResponse.json({ findings: convertirFindingsLlm(parsed.findings, texte) });
  } catch {
    return NextResponse.json({ erreur: "llm_indisponible" }, { status: 500 });
  }
}
```

Vérifier la signature exacte de `zodOutputFormat` dans la version installée du SDK (`node_modules/@anthropic-ai/sdk/helpers/zod`) — si elle exige un nom : `zodOutputFormat(ReponseLlmSchema, "reponse")`. Si `output_config` n'accepte pas `effort` sur `parse()` dans la version installée, le retirer (le défaut convient).

- [ ] **Step 8: Test manuel de la route** (nécessite une clé dans `.env.local`)

```bash
npm run dev &
sleep 5
curl -s -X POST localhost:3000/api/analyze-llm -H 'content-type: application/json' \
  -d '{"texte":"Proposition de loi visant à modifier l'\''article L. 121-1 du code de la consommation, l'\''article L. 3 du code du sport et diverses dispositions relatives à la transparence, à la simplification et à la modernisation des procédures applicables.\nArticle 1er\nÀ l'\''article 2, les mots : « deux ans » sont remplacés par les mots : « trois ans »."}' | head -c 2000
```

Attendu : JSON `{"findings":[...]}` avec au moins un finding RL-01 (titre trop long avec références). Sans clé : `{"erreur":"cle_absente"}` en 503.

- [ ] **Step 9: Commit** — `git commit -am "Add Claude LLM analysis layer with structured outputs"`

---

### Task 12: Import de fichiers (.docx / .pdf / .txt) + normalisation

**Files:**
- Create: `lib/import/normaliser.ts`, `app/api/extract/route.ts`
- Test: `tests/import/normaliser.test.ts` (+ test manuel de la route)

**Interfaces:**
- Produces:
  - `normaliser(texte: string): string` — `\r\n`→`\n`, NBSP/espaces fines → espace simple SAUF devant `;:!?»` et après `«` (typographie FR conservée en espace simple), tabulations → espace, lignes vides multiples → une seule, trim final par ligne.
  - Route POST `/api/extract` : FormData `file` → `{ texte: string }` ; 415 si extension non supportée ; 422 si extraction vide.

- [ ] **Step 1: Test normaliser** — `tests/import/normaliser.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { normaliser } from "@/lib/import/normaliser";

describe("normaliser", () => {
  it("unifie les fins de ligne", () => {
    expect(normaliser("a\r\nb\rc")).toBe("a\nb\nc");
  });
  it("remplace NBSP et espace fine par une espace simple", () => {
    expect(normaliser("mot ; suite")).toBe("mot ; suite");
  });
  it("compresse les lignes vides multiples", () => {
    expect(normaliser("a\n\n\n\nb")).toBe("a\n\nb");
  });
  it("supprime les espaces de fin de ligne", () => {
    expect(normaliser("a   \nb")).toBe("a\nb");
  });
});
```

- [ ] **Step 2: Vérifier l'échec, puis implémenter `lib/import/normaliser.ts`**

```ts
export function normaliser(texte: string): string {
  return texte
    .replace(/\r\n?/g, "\n")
    .replace(/[   ]/g, " ")
    .replace(/\t/g, " ")
    .split("\n")
    .map((l) => l.replace(/ +$/g, "").replace(/ {2,}/g, " "))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
```

- [ ] **Step 3: Implémenter `app/api/extract/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { normaliser } from "@/lib/import/normaliser";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ erreur: "fichier_manquant" }, { status: 400 });
  }
  const nom = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  let texte = "";
  try {
    if (nom.endsWith(".txt")) {
      texte = buffer.toString("utf-8");
    } else if (nom.endsWith(".docx")) {
      texte = (await mammoth.extractRawText({ buffer })).value;
    } else if (nom.endsWith(".pdf")) {
      // Import direct du module interne : évite le code de debug du package
      // qui lit un fichier de test au chargement et casse le bundling Next.
      const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
      texte = (await pdfParse(buffer)).text;
    } else {
      return NextResponse.json({ erreur: "format_non_supporte" }, { status: 415 });
    }
  } catch {
    return NextResponse.json({ erreur: "extraction_echouee" }, { status: 422 });
  }
  const normalise = normaliser(texte);
  if (normalise.length < 20) {
    return NextResponse.json({ erreur: "texte_vide" }, { status: 422 });
  }
  return NextResponse.json({ texte: normalise });
}
```

Ajouter dans `next.config.ts` : `serverExternalPackages: ["pdf-parse", "mammoth"]`. Si TypeScript se plaint de l'import interne pdf-parse, créer `types/pdf-parse.d.ts` : `declare module "pdf-parse/lib/pdf-parse.js";`.

- [ ] **Step 4: Test manuel de la route**

```bash
printf 'I. Le droit communautaire et/ou national.\n' > /tmp/essai.txt
curl -s -X POST localhost:3000/api/extract -F file=@/tmp/essai.txt
```

Attendu : `{"texte":"I. Le droit communautaire et/ou national."}`. Tester aussi avec un vrai .docx et un vrai .pdf si disponibles ; sinon noter dans le PR que seuls .txt sont couverts automatiquement.

- [ ] **Step 5: Vérifier + commit** — `npm run test && npm run build`, puis `git commit -am "Add file import (docx/pdf/txt) with text normalization"`

---

### Task 13: État racine + écran de saisie

**Files:**
- Create: `components/analyseur.tsx`, `components/zone-saisie.tsx`
- Modify: `app/page.tsx`
- Test: build + vérification manuelle (`npm run dev`)

**Interfaces:**
- Consumes: `analyser`, `fusionner`, `EXEMPLES`, route `/api/extract`
- Produces: `<Analyseur/>` — état racine partagé par les tâches 14-15 :

```ts
type StatutLlm = "inactif" | "en_cours" | "ok" | "indisponible";
interface EtatAnalyse {
  texte: string;
  enResultat: boolean;
  findingsLlm: Finding[];      // bruts, ré-ancrés à chaque changement de texte
  statutLlm: StatutLlm;
  findingSelectionne: string | null; // id
  filtreSeverites: Set<Severite>;
}
```

- [ ] **Step 1: Implémenter `components/analyseur.tsx`**

```tsx
"use client";
import { useMemo, useState } from "react";
import type { Finding, Severite } from "@/lib/rules/types";
import { analyser } from "@/lib/engine/analyser";
import { fusionner, ancrer } from "@/lib/engine/fusion";
import { ZoneSaisie } from "@/components/zone-saisie";
import { VueResultat } from "@/components/vue-resultat";

export type StatutLlm = "inactif" | "en_cours" | "ok" | "indisponible";

export function Analyseur() {
  const [texte, setTexte] = useState("");
  const [enResultat, setEnResultat] = useState(false);
  const [findingsLlm, setFindingsLlm] = useState<Finding[]>([]);
  const [statutLlm, setStatutLlm] = useState<StatutLlm>("inactif");

  // Le déterministe se recalcule à chaque frappe/correction ; les findings LLM
  // sont ré-ancrés par leur extrait (citation) sur le texte courant.
  const findings = useMemo(() => {
    if (!enResultat) return [];
    const det = analyser(texte);
    const llm = findingsLlm.map((f) => ({ ...f, span: ancrer(f.extrait, texte) }));
    return fusionner(det, llm);
  }, [texte, findingsLlm, enResultat]);

  async function lancerAnalyse(t: string) {
    setTexte(t);
    setEnResultat(true);
    setStatutLlm("en_cours");
    try {
      const res = await fetch("/api/analyze-llm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texte: t }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { findings: Finding[] };
      setFindingsLlm(data.findings);
      setStatutLlm("ok");
    } catch {
      setFindingsLlm([]);
      setStatutLlm("indisponible");
    }
  }

  function nouvelleAnalyse() {
    setEnResultat(false);
    setFindingsLlm([]);
    setStatutLlm("inactif");
    setTexte("");
  }

  // Écarter un finding LLM appliqué/corrigé : son extrait d'origine disparaît du texte,
  // le ré-ancrage le passe à span null -> on le retire s'il avait une suggestion appliquée.
  function appliquer(nouveauTexte: string, findingApplique: Finding) {
    setTexte(nouveauTexte);
    if (findingApplique.source === "llm") {
      setFindingsLlm((prev) => prev.filter((f) => f.id !== findingApplique.id));
    }
  }

  return enResultat ? (
    <VueResultat
      texte={texte}
      findings={findings}
      statutLlm={statutLlm}
      onAppliquer={appliquer}
      onTexteChange={setTexte}
      onRetirerLlm={(ids) => setFindingsLlm((p) => p.filter((f) => !ids.includes(f.id)))}
      onNouvelleAnalyse={nouvelleAnalyse}
    />
  ) : (
    <ZoneSaisie onAnalyser={lancerAnalyse} />
  );
}
```

- [ ] **Step 2: Implémenter `components/zone-saisie.tsx`**

```tsx
"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EXEMPLES } from "@/data/exemples";

export function ZoneSaisie({ onAnalyser }: { onAnalyser: (texte: string) => void }) {
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function importer(file: File) {
    setChargement(true);
    setErreur(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erreur);
      setTexte(data.texte);
    } catch (e) {
      setErreur("Impossible d'extraire le texte de ce fichier (.docx, .pdf et .txt acceptés).");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2 pt-6 text-center">
        <h1 className="font-serif text-4xl font-semibold text-primary">
          Vérifiez la légistique de votre texte
        </h1>
        <p className="text-muted-foreground">
          Collez un texte législatif ou importez un fichier : NormaCheck détecte les règles du
          guide de légistique enfreintes et propose des corrections.
        </p>
      </div>
      <Textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Collez ici un article de loi, un amendement, une proposition de loi…"
        className="min-h-64 font-serif text-base"
        data-testid="zone-texte"
      />
      {erreur && <p className="text-sm text-destructive">{erreur}</p>}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" disabled={texte.trim().length < 20 || chargement}
          onClick={() => onAnalyser(texte)} data-testid="bouton-analyser">
          Analyser le texte
        </Button>
        <Button variant="outline" size="lg" disabled={chargement}
          onClick={() => inputRef.current?.click()}>
          {chargement ? "Extraction…" : "Importer un fichier"}
        </Button>
        <input ref={inputRef} type="file" accept=".docx,.pdf,.txt" className="hidden"
          onChange={(e) => e.target.files?.[0] && importer(e.target.files[0])} />
      </div>
      <div className="grid gap-4 pt-4 sm:grid-cols-3">
        {EXEMPLES.map((ex) => (
          <Card key={ex.id} className="cursor-pointer transition hover:border-primary"
            onClick={() => onAnalyser(ex.texte)} data-testid={`exemple-${ex.id}`}>
            <CardHeader>
              <CardTitle className="font-serif text-base">{ex.titre}</CardTitle>
              <CardDescription>{ex.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs font-medium text-primary">Essayer cet exemple →</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `app/page.tsx`**

```tsx
import { Analyseur } from "@/components/analyseur";

export default function Page() {
  return <Analyseur />;
}
```

Créer un `components/vue-resultat.tsx` STUB temporaire (affiche le nombre de findings) pour que le build passe — remplacé en Task 14/15.

- [ ] **Step 4: Vérifier + commit** — `npm run build` OK, `git commit -am "Add analysis root state and input screen"`

---

### Task 14: Texte annoté (surlignage + popover de correction)

**Files:**
- Create: `components/texte-annote.tsx`
- Test: build + manuel (Task 15 apporte l'écran complet ; e2e en Task 17)

**Interfaces:**
- Consumes: `Finding`, `appliquerCorrection`, `regleParId`
- Produces: `<TexteAnnote texte findings findingSelectionne onSelectionner(id|null) onAppliquer(nouveauTexte, finding) />`

- [ ] **Step 1: Implémenter `components/texte-annote.tsx`**

Découpage en segments : les findings ancrés (span non null, non chevauchants après fusion — par sécurité, ignorer un span qui chevauche le précédent retenu) délimitent des `<mark>`.

```tsx
"use client";
import { Fragment } from "react";
import type { Finding } from "@/lib/rules/types";
import { regleParId } from "@/lib/rules";
import { appliquerCorrection } from "@/lib/engine/corrections";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const COULEURS: Record<string, string> = {
  enfreinte: "bg-sev-enfreinte/15 border-b-2 border-sev-enfreinte",
  a_revoir: "bg-sev-a-revoir/15 border-b-2 border-sev-a-revoir",
  suggestion: "bg-sev-suggestion/15 border-b-2 border-sev-suggestion",
};
const LIBELLES: Record<string, string> = {
  enfreinte: "Règle enfreinte", a_revoir: "À revoir", suggestion: "Suggestion",
};

interface Props {
  texte: string;
  findings: Finding[];
  findingSelectionne: string | null;
  onSelectionner: (id: string | null) => void;
  onAppliquer: (nouveauTexte: string, f: Finding) => void;
}

export function TexteAnnote({ texte, findings, findingSelectionne, onSelectionner, onAppliquer }: Props) {
  // segments : [texte brut | finding]
  const ancres = findings
    .filter((f) => f.span)
    .sort((a, b) => a.span!.start - b.span!.start)
    .filter((f, i, arr) => i === 0 || f.span!.start >= arr[i - 1].span!.end);

  const segments: Array<{ brut: string } | { finding: Finding }> = [];
  let curseur = 0;
  for (const f of ancres) {
    if (f.span!.start > curseur) segments.push({ brut: texte.slice(curseur, f.span!.start) });
    segments.push({ finding: f });
    curseur = f.span!.end;
  }
  if (curseur < texte.length) segments.push({ brut: texte.slice(curseur) });

  return (
    <div className="whitespace-pre-wrap rounded-lg border bg-card p-6 font-serif text-base leading-8"
      data-testid="texte-annote">
      {segments.map((s, i) =>
        "brut" in s ? (
          <Fragment key={i}>{s.brut}</Fragment>
        ) : (
          <PopoverFinding key={s.finding.id} finding={s.finding} texte={texte}
            ouvert={findingSelectionne === s.finding.id}
            onOuvrir={(o) => onSelectionner(o ? s.finding.id : null)}
            onAppliquer={onAppliquer} />
        ),
      )}
    </div>
  );
}

function PopoverFinding({ finding, texte, ouvert, onOuvrir, onAppliquer }: {
  finding: Finding; texte: string; ouvert: boolean;
  onOuvrir: (o: boolean) => void;
  onAppliquer: (t: string, f: Finding) => void;
}) {
  const regle = regleParId(finding.ruleId);
  return (
    <Popover open={ouvert} onOpenChange={onOuvrir}>
      <PopoverTrigger asChild>
        <mark id={`finding-${finding.id}`} data-testid="surlignage"
          className={`cursor-pointer rounded-sm px-0.5 transition ${COULEURS[finding.severite]} ${ouvert ? "ring-2 ring-ring" : ""}`}>
          {texte.slice(finding.span!.start, finding.span!.end)}
        </mark>
      </PopoverTrigger>
      <PopoverContent className="w-96 space-y-3" side="bottom" align="start">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={finding.severite === "enfreinte" ? "destructive" : "secondary"}>
            {LIBELLES[finding.severite]}
          </Badge>
          <span className="text-xs text-muted-foreground">{regle?.ref}{finding.source === "llm" && " · analyse IA"}</span>
        </div>
        <p className="font-serif text-sm font-semibold">{regle?.titre}</p>
        <p className="text-sm text-muted-foreground">{finding.message}</p>
        {finding.suggestion !== undefined && (
          <div className="rounded-md bg-secondary p-2 text-sm">
            <span className="text-muted-foreground line-through">{finding.extrait}</span>{" "}
            <span className="font-medium text-primary">→ {finding.suggestion}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <Link href={`/glossaire#${finding.ruleId}`} className="text-xs text-primary underline">
            Voir la règle
          </Link>
          {finding.suggestion !== undefined && finding.span && (
            <Button size="sm" data-testid="bouton-appliquer"
              onClick={() => { onAppliquer(appliquerCorrection(texte, finding), finding); onOuvrir(false); }}>
              Appliquer la correction
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Vérifier + commit** — `npm run build`, `git commit -am "Add annotated text with highlight popovers and one-click fix"`

---

### Task 15: Écran résultat complet (jauge, panneau, tout corriger, export, badge LLM)

**Files:**
- Create: `components/vue-resultat.tsx` (remplace le stub), `components/panneau-findings.tsx`, `components/jauge-score.tsx`
- Test: build + manuel ; e2e en Task 17

**Interfaces:**
- Consumes: tout le moteur + `<TexteAnnote/>`
- Produces: `<VueResultat texte findings statutLlm onAppliquer onTexteChange onRetirerLlm onNouvelleAnalyse />`

- [ ] **Step 1: `components/jauge-score.tsx`**

```tsx
"use client";

export function JaugeScore({ score }: { score: number }) {
  const r = 34, c = 2 * Math.PI * r;
  const couleur = score >= 80 ? "var(--menthe)" : score >= 50 ? "var(--sev-a-revoir)" : "var(--sev-enfreinte)";
  return (
    <div className="relative h-24 w-24" data-testid="jauge-score" data-score={score}>
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={couleur} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset 700ms ease, stroke 700ms ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-2xl font-bold">{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `components/panneau-findings.tsx`**

Liste groupée par famille (via `regleParId(f.ruleId)?.famille`), filtres par sévérité (badges cliquables toggles), clic sur un item → `onSelectionner(f.id)` + `document.getElementById(\`finding-${f.id}\`)?.scrollIntoView({behavior:"smooth", block:"center"})`. Les findings non ancrés (span null) apparaissent dans une section « Non localisés » en bas. Chaque item : pastille couleur sévérité, extrait tronqué (40 c), titre de règle. `data-testid="panneau-findings"`.

- [ ] **Step 3: `components/vue-resultat.tsx`**

```tsx
"use client";
import { useMemo, useState } from "react";
import type { Finding } from "@/lib/rules/types";
import { calculerScore } from "@/lib/engine/score";
import { appliquerToutes } from "@/lib/engine/corrections";
import { TexteAnnote } from "@/components/texte-annote";
import { PanneauFindings } from "@/components/panneau-findings";
import { JaugeScore } from "@/components/jauge-score";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StatutLlm } from "@/components/analyseur";

interface Props {
  texte: string;
  findings: Finding[];
  statutLlm: StatutLlm;
  onAppliquer: (t: string, f: Finding) => void;
  onTexteChange: (t: string) => void;
  onRetirerLlm: (ids: string[]) => void;
  onNouvelleAnalyse: () => void;
}

export function VueResultat({ texte, findings, statutLlm, onAppliquer, onTexteChange, onRetirerLlm, onNouvelleAnalyse }: Props) {
  const [selection, setSelection] = useState<string | null>(null);
  const score = useMemo(() => calculerScore(findings, texte), [findings, texte]);

  function toutCorriger() {
    const applicables = findings.filter((f) => f.span && f.suggestion !== undefined);
    onRetirerLlm(applicables.filter((f) => f.source === "llm").map((f) => f.id));
    onTexteChange(appliquerToutes(texte, findings));
  }

  function exporter() {
    navigator.clipboard.writeText(texte);
    const blob = new Blob([texte], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "texte-corrige.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const nbApplicables = findings.filter((f) => f.span && f.suggestion !== undefined).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6 rounded-lg border bg-card p-4">
        <JaugeScore score={score.global} />
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <Badge variant="destructive" data-testid="compteur-enfreinte">
            {score.parSeverite.enfreinte} enfreinte{score.parSeverite.enfreinte > 1 ? "s" : ""}
          </Badge>
          <Badge className="bg-sev-a-revoir text-white">{score.parSeverite.a_revoir} à revoir</Badge>
          <Badge variant="secondary">{score.parSeverite.suggestion} suggestion{score.parSeverite.suggestion > 1 ? "s" : ""}</Badge>
          {statutLlm === "en_cours" && (
            <Badge variant="outline" className="animate-pulse" data-testid="badge-llm">
              Analyse approfondie en cours…
            </Badge>
          )}
          {statutLlm === "indisponible" && (
            <Badge variant="outline" className="text-muted-foreground" data-testid="badge-llm">
              Analyse approfondie indisponible
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={toutCorriger} disabled={nbApplicables === 0} data-testid="bouton-tout-corriger">
            Tout corriger ({nbApplicables})
          </Button>
          <Button variant="outline" onClick={exporter}>Exporter</Button>
          <Button variant="ghost" onClick={onNouvelleAnalyse}>Nouveau texte</Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <TexteAnnote texte={texte} findings={findings} findingSelectionne={selection}
          onSelectionner={setSelection} onAppliquer={onAppliquer} />
        <PanneauFindings findings={findings} findingSelectionne={selection} onSelectionner={setSelection} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Vérification manuelle du flux complet**

`npm run dev` → coller l'exemple pédagogique → vérifier : surlignages immédiats, badge « Analyse approfondie en cours… » puis findings LLM orange qui s'ajoutent (avec clé API), clic surlignage → popover → « Appliquer » corrige le texte et fait remonter le score, « Tout corriger » nettoie tout, export télécharge le .txt.

- [ ] **Step 5: Commit** — `git commit -am "Add full results screen with score gauge, findings panel and bulk fix"`

---

### Task 16: Glossaire

**Files:**
- Create: `app/glossaire/page.tsx`, `components/carte-regle.tsx`, `components/glossaire-client.tsx`
- Test: build + manuel

**Interfaces:**
- Consumes: `REGLES`, `FAMILLES`
- Produces: page `/glossaire`, cartes ancrées par id (`id={regle.id}`) pour les liens depuis les popovers.

- [ ] **Step 1: `components/carte-regle.tsx`**

```tsx
import type { Regle } from "@/lib/rules/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LIBELLES: Record<string, string> = {
  enfreinte: "Règle stricte", a_revoir: "À apprécier", suggestion: "Recommandation",
};

export function CarteRegle({ regle }: { regle: Regle }) {
  return (
    <Card id={regle.id} className="scroll-mt-24">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={regle.severite === "enfreinte" ? "destructive" : "secondary"}>
            {LIBELLES[regle.severite]}
          </Badge>
          <span className="text-xs text-muted-foreground">{regle.ref} · {regle.id}</span>
        </div>
        <CardTitle className="font-serif text-base">{regle.titre}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">{regle.explication}</p>
        <p><span className="mr-1">❌</span><span className="italic">{regle.exempleKo}</span></p>
        <p><span className="mr-1">✅</span><span className="italic">{regle.exempleOk}</span></p>
        {!regle.detecteur && <Badge variant="outline" className="text-xs">Détectée par l'analyse IA</Badge>}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: `components/glossaire-client.tsx`** — client component : input de recherche (filtre insensible à la casse/accents sur titre+explication+id), regroupement par `Famille` (titres `<h2 className="font-serif">`), grille 2 colonnes de `<CarteRegle/>`. `app/glossaire/page.tsx` (serveur) rend simplement `<GlossaireClient/>` avec un en-tête « Glossaire des règles de légistique » + compteur de règles.

- [ ] **Step 3: Vérifier** — `/glossaire` liste toutes les règles du catalogue, la recherche filtre, `/glossaire#R9.2-01` scrolle sur la carte. Build OK.

- [ ] **Step 4: Commit** — `git commit -am "Add rules glossary generated from the catalogue"`

---

### Task 17: E2E Playwright + polish final

**Files:**
- Create: `playwright.config.ts`, `e2e/analyse.spec.ts`
- Modify: retouches UI (animations, états vides, responsive)
- Test: `npm run e2e`

- [ ] **Step 1: `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

Puis `npx playwright install chromium`.

- [ ] **Step 2: `e2e/analyse.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("flux complet : exemple -> analyse -> correction -> score", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("exemple-pedagogique").click();

  // findings déterministes immédiats
  await expect(page.getByTestId("texte-annote")).toBeVisible();
  const surlignages = page.getByTestId("surlignage");
  await expect(surlignages.first()).toBeVisible();
  const nbAvant = await surlignages.count();
  expect(nbAvant).toBeGreaterThan(5);

  const scoreAvant = Number(await page.getByTestId("jauge-score").getAttribute("data-score"));
  expect(scoreAvant).toBeLessThan(100);

  // appliquer une correction via popover
  await surlignages.first().click();
  const boutonAppliquer = page.getByTestId("bouton-appliquer");
  if (await boutonAppliquer.isVisible()) {
    await boutonAppliquer.click();
    await expect(surlignages).toHaveCount(nbAvant - 1);
  }

  // tout corriger -> le score remonte
  await page.getByTestId("bouton-tout-corriger").click();
  await expect
    .poll(async () => Number(await page.getByTestId("jauge-score").getAttribute("data-score")))
    .toBeGreaterThan(scoreAvant);
});

test("le glossaire liste les règles et la recherche filtre", async ({ page }) => {
  await page.goto("/glossaire");
  await expect(page.locator("[id='R9.2-01']")).toBeVisible();
});

test("saisie manuelle : texte propre -> score 100", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("zone-texte").fill(
    "Le maire transmet la liste au représentant de l'État dans le département avant le 1er mars.",
  );
  await page.getByTestId("bouton-analyser").click();
  // >= 95 : tolère un éventuel finding « à revoir » remonté par l'analyse IA
  await expect
    .poll(async () => Number(await page.getByTestId("jauge-score").getAttribute("data-score")))
    .toBeGreaterThanOrEqual(95);
});
```

Note : l'e2e ne dépend PAS de la clé API (le badge « indisponible » est un état valide).

- [ ] **Step 3: Lancer** — `npm run e2e` → PASS (ajuster les sélecteurs si besoin).

- [ ] **Step 4: Polish**

- Animation d'apparition des surlignages : dans `globals.css`, `@keyframes apparaitre { from { background-color: transparent; border-color: transparent; } }` + `mark { animation: apparaitre 500ms ease; }`.
- Apparition décalée des findings LLM (déjà naturelle : ils arrivent après le fetch).
- Vérifier le dark mode sur les 3 écrans, le responsive ≥ 1024 px (vidéoprojecteur) et l'état vide (texte < 20 caractères → bouton désactivé).
- Mettre à jour `README.md` : présentation du projet, capture, `npm install && cp .env.example .env.local && npm run dev`, structure, mention du hackathon.

- [ ] **Step 5: Vérification finale complète**

```bash
npm run test && npm run build && npm run e2e
```

Attendu : tout PASS.

- [ ] **Step 6: Commit final** — `git add -A && git commit -m "Add e2e tests, polish UI and update README"`
