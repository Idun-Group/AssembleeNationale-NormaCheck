import { NextRequest, NextResponse } from "next/server";
import { ReponseLlmSchema } from "@/lib/llm/schema";
import { construirePrompt } from "@/lib/llm/prompt";
import { executerLlm } from "@/lib/llm/executer";
import { extraireJson } from "@/lib/llm/extraire-json";
import { convertirFindingsLlm } from "@/lib/llm/convertir";

export const runtime = "nodejs";
// La couche IA repose sur la CLI `claude` locale : elle ne tourne PAS en
// serverless (Vercel). Le vrai timeout d'un appel local est dans
// lib/llm/executer.ts (300 s). Ici on reste sous le plafond de tous les plans
// Vercel : la démo publique désactive de toute façon cette route.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Démo publique : analyse approfondie désactivée (drapeau de build).
  if (process.env.NEXT_PUBLIC_NORMACHECK_LLM_DISABLED === "1") {
    return NextResponse.json({ erreur: "desactivee" }, { status: 503 });
  }
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
