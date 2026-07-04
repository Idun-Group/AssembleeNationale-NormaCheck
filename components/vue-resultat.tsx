"use client";
import type { Finding } from "@/lib/rules/types";
import { Button } from "@/components/ui/button";
import type { StatutLlm } from "@/components/analyseur";

// STUB TEMPORAIRE (Task 13) — remplacé par les Tasks 14-15.
// Le contrat de props ci-dessous est celui consommé par <Analyseur/> :
// ne pas renommer sans mettre à jour components/analyseur.tsx.
interface VueResultatProps {
  texte: string;
  findings: Finding[];
  statutLlm: StatutLlm;
  onAppliquer: (nouveauTexte: string, findingApplique: Finding) => void;
  onTexteChange: (texte: string) => void;
  onRetirerLlm: (ids: string[]) => void;
  onNouvelleAnalyse: () => void;
}

export function VueResultat({
  texte,
  findings,
  statutLlm,
  onNouvelleAnalyse,
}: VueResultatProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 py-6">
      <p className="text-sm text-muted-foreground">
        {findings.length} signalement{findings.length > 1 ? "s" : ""} détecté
        {findings.length > 1 ? "s" : ""} · statut IA : {statutLlm} · {texte.length} caractères
      </p>
      <Button onClick={onNouvelleAnalyse} data-testid="bouton-nouvelle-analyse">
        Nouveau texte
      </Button>
    </div>
  );
}
