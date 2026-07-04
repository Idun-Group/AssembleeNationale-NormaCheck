import { REGLES } from "@/lib/rules";
import { GlossaireClient } from "@/components/glossaire-client";

export default function GlossairePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-semibold text-primary">
          Glossaire des règles de légistique
        </h1>
        <p className="text-sm text-muted-foreground">
          Les {REGLES.length} règles du guide de légistique de l&apos;Assemblée nationale utilisées par NormaCheck, classées par famille.
        </p>
      </div>
      <GlossaireClient />
    </div>
  );
}
