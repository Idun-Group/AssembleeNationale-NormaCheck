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
      <PopoverTrigger
        nativeButton={false}
        render={
          <mark id={`finding-${finding.id}`} data-testid="surlignage"
            className={`cursor-pointer rounded-sm px-0.5 transition ${COULEURS[finding.severite]} ${ouvert ? "ring-2 ring-ring" : ""}`} />
        }>
        {texte.slice(finding.span!.start, finding.span!.end)}
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
