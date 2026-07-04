import { NextRequest, NextResponse } from "next/server";
import { ReponseLlmSchema } from "@/lib/llm/schema";
import { construirePrompt } from "@/lib/llm/prompt";
import { executerLlm } from "@/lib/llm/executer";
import { extraireJson } from "@/lib/llm/extraire-json";
import { convertirFindingsLlm } from "@/lib/llm/convertir";

export const runtime = "nodejs";
// Les textes longs demandent jusqu'à ~250 s d'analyse LLM (cf. lib/llm/executer.ts,
// timeout par défaut 300 s) : la route doit laisser au moins autant de marge.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { texte } = (await req.json()) as { texte?: string };
  if (!texte || texte.length < 20) {
    return NextResponse.json({ erreur: "texte_invalide" }, { status: 400 });
  }
  let brut: string;
  try {
    brut = await executerLlm(construirePrompt(texte.slice(0, 30000)));
  } catch {
    // CLI absente (ENOENT), non authentifiée, timeout… -> mode dégradé côté client
    return NextResponse.json({ erreur: "cli_indisponible" }, { status: 503 });
  }
  try {
    const parsed = ReponseLlmSchema.parse(extraireJson(brut));
    return NextResponse.json({ findings: convertirFindingsLlm(parsed.findings, texte) });
  } catch {
    return NextResponse.json({ erreur: "reponse_invalide" }, { status: 502 });
  }
}
