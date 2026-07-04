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
        {!regle.detecteur && <Badge variant="outline" className="text-xs">Détectée par l&apos;analyse IA</Badge>}
      </CardContent>
    </Card>
  );
}
