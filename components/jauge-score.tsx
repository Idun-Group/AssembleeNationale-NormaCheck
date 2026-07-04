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
