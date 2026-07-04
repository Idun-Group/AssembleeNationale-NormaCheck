"use client";
import { Loader2, AlertTriangle, Lock, CheckCircle2, Mail } from "lucide-react";
import type { StatutLlm } from "@/components/analyseur";

const CONTACT = "h.geoffrey@idun-group.com";

/**
 * Bandeau d'état de l'analyse approfondie (couche LLM), rendu visible au-dessus
 * des résultats. Couvre les quatre états parlants :
 *  - en_cours     : indicateur de chargement (spinner) bien visible ;
 *  - desactivee   : démo publique, IA coupée + lien de contact ;
 *  - indisponible : l'appel a échoué (CLI Claude absente/expirée) → erreur ;
 *  - ok           : succès discret.
 * `inactif` ne rend rien. `data-testid="badge-llm"` est conservé (contrat e2e).
 */
export function StatutAnalyseApprofondie({ statut }: { statut: StatutLlm }) {
  if (statut === "inactif") return null;

  if (statut === "en_cours") {
    return (
      <div
        data-testid="badge-llm"
        data-statut="en_cours"
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
      >
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden />
        <div>
          <p className="font-medium text-primary">Analyse approfondie en cours…</p>
          <p className="text-muted-foreground">
            L&apos;IA vérifie les règles de fond (références, formules, point d&apos;impact). Cela peut
            prendre jusqu&apos;à quelques minutes ; l&apos;analyse déterministe ci-dessous est déjà complète.
          </p>
        </div>
      </div>
    );
  }

  if (statut === "ok") {
    return (
      <div
        data-testid="badge-llm"
        data-statut="ok"
        className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-400"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        <span>Analyse approfondie terminée.</span>
      </div>
    );
  }

  if (statut === "desactivee") {
    return (
      <div
        data-testid="badge-llm"
        data-statut="desactivee"
        className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg border bg-muted/40 px-4 py-3 text-sm"
      >
        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="font-medium">Analyse approfondie (IA) désactivée pour cette démo.</span>
        <span className="text-muted-foreground">
          L&apos;analyse déterministe reste entièrement fonctionnelle. Pour l&apos;activer sur vos textes,
        </span>
        <a
          href={`mailto:${CONTACT}?subject=${encodeURIComponent("NormaCheck — activer l'analyse approfondie")}`}
          className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-2"
        >
          <Mail className="h-3.5 w-3.5" aria-hidden />
          contactez-nous
        </a>
        <span className="text-muted-foreground">({CONTACT}).</span>
      </div>
    );
  }

  // indisponible
  return (
    <div
      data-testid="badge-llm"
      data-statut="indisponible"
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
      <div>
        <p className="font-medium text-destructive">L&apos;analyse approfondie a échoué.</p>
        <p className="text-muted-foreground">
          La CLI Claude est indisponible (non installée, non authentifiée, ou expirée sur ce poste).
          L&apos;analyse déterministe ci-dessous reste complète. Pour une analyse IA gérée, écrivez à{" "}
          <a className="font-medium text-primary underline underline-offset-2" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
