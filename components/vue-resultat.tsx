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
import { StatutAnalyseApprofondie } from "@/components/statut-llm";
import type { StatutLlm } from "@/components/analyseur";

// Le contrat de props ci-dessous est celui consommé par <Analyseur/> (Task 13) :
// ne pas renommer sans mettre à jour components/analyseur.tsx.
interface Props {
  texte: string;
  findings: Finding[];
  statutLlm: StatutLlm;
  onAppliquer: (nouveauTexte: string, findingApplique: Finding) => void;
  onTexteChange: (texte: string) => void;
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
          <Badge className="bg-sev-a-revoir text-white">
            {score.parSeverite.a_revoir} à revoir
          </Badge>
          <Badge variant="secondary">
            {score.parSeverite.suggestion} suggestion{score.parSeverite.suggestion > 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={toutCorriger} disabled={nbApplicables === 0} data-testid="bouton-tout-corriger">
            Tout corriger ({nbApplicables})
          </Button>
          <Button variant="outline" onClick={exporter}>
            Exporter
          </Button>
          <Button variant="ghost" onClick={onNouvelleAnalyse} data-testid="bouton-nouvelle-analyse">
            Nouveau texte
          </Button>
        </div>
      </div>
      <StatutAnalyseApprofondie statut={statutLlm} />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <TexteAnnote
          texte={texte}
          findings={findings}
          findingSelectionne={selection}
          onSelectionner={setSelection}
          onAppliquer={onAppliquer}
        />
        <PanneauFindings findings={findings} findingSelectionne={selection} onSelectionner={setSelection} />
      </div>
    </div>
  );
}
