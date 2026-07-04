"use client";
import { useMemo, useState } from "react";
import type { Finding, Severite } from "@/lib/rules/types";
import { regleParId } from "@/lib/rules";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PASTILLES: Record<Severite, string> = {
  enfreinte: "bg-sev-enfreinte",
  a_revoir: "bg-sev-a-revoir",
  suggestion: "bg-sev-suggestion",
};
const LIBELLES: Record<Severite, string> = {
  enfreinte: "Enfreinte",
  a_revoir: "À revoir",
  suggestion: "Suggestion",
};
const SEVERITES: Severite[] = ["enfreinte", "a_revoir", "suggestion"];

function tronquer(s: string, n: number): string {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

interface Props {
  findings: Finding[];
  findingSelectionne: string | null;
  onSelectionner: (id: string | null) => void;
}

export function PanneauFindings({ findings, findingSelectionne, onSelectionner }: Props) {
  const [filtres, setFiltres] = useState<Set<Severite>>(new Set());

  function basculerFiltre(s: Severite) {
    setFiltres((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(s)) suivant.delete(s);
      else suivant.add(s);
      return suivant;
    });
  }

  const visibles = useMemo(
    () => (filtres.size === 0 ? findings : findings.filter((f) => filtres.has(f.severite))),
    [findings, filtres],
  );

  const localises = visibles.filter((f) => f.span);
  const nonLocalises = visibles.filter((f) => !f.span);

  const groupes = useMemo(() => {
    const parFamille = new Map<string, Finding[]>();
    for (const f of localises) {
      const fam = regleParId(f.ruleId)?.famille ?? "Autre";
      if (!parFamille.has(fam)) parFamille.set(fam, []);
      parFamille.get(fam)!.push(f);
    }
    for (const liste of parFamille.values()) {
      liste.sort((a, b) => a.span!.start - b.span!.start);
    }
    return parFamille;
  }, [localises]);

  function selectionner(f: Finding) {
    onSelectionner(f.id);
    document.getElementById(`finding-${f.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="flex max-h-[calc(100vh-12rem)] flex-col gap-3 rounded-lg border bg-card p-4" data-testid="panneau-findings">
      <div className="flex flex-wrap gap-1.5">
        {SEVERITES.map((s) => (
          <Badge
            key={s}
            variant={filtres.has(s) ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => basculerFiltre(s)}
            data-testid={`filtre-${s}`}
          >
            <span className={cn("mr-1 inline-block size-1.5 rounded-full", PASTILLES[s])} />
            {LIBELLES[s]}
          </Badge>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {groupes.size === 0 && nonLocalises.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun signalement.</p>
        )}
        {Array.from(groupes.entries()).map(([famille, items]) => (
          <div key={famille} className="space-y-1.5">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{famille}</h3>
            <ul className="space-y-1">
              {items.map((f) => (
                <ItemFinding key={f.id} finding={f} selectionne={findingSelectionne === f.id} onClick={() => selectionner(f)} />
              ))}
            </ul>
          </div>
        ))}
        {nonLocalises.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Non localisés</h3>
            <ul className="space-y-1">
              {nonLocalises.map((f) => (
                <ItemFinding key={f.id} finding={f} selectionne={findingSelectionne === f.id} onClick={() => onSelectionner(f.id)} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ItemFinding({ finding, selectionne, onClick }: { finding: Finding; selectionne: boolean; onClick: () => void }) {
  const regle = regleParId(finding.ruleId);
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        data-testid="item-finding"
        className={cn(
          "flex w-full items-start gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition hover:bg-muted",
          selectionne ? "border-ring bg-muted" : "border-transparent",
        )}
      >
        <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", PASTILLES[finding.severite])} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-muted-foreground italic">« {tronquer(finding.extrait, 40)} »</span>
          <span className="block font-medium">{regle?.titre ?? finding.ruleId}</span>
        </span>
      </button>
    </li>
  );
}
