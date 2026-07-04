import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { normaliser } from "@/lib/import/normaliser";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ erreur: "fichier_manquant" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ erreur: "fichier_manquant" }, { status: 400 });
  }
  const nom = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  let texte = "";
  try {
    if (nom.endsWith(".txt")) {
      texte = buffer.toString("utf-8");
    } else if (nom.endsWith(".docx")) {
      texte = (await mammoth.extractRawText({ buffer })).value;
    } else if (nom.endsWith(".pdf")) {
      // Import dynamique : la lib pdf-parse (v2, classe PDFParse) embarque
      // pdfjs-dist ; on isole son chargement pour ne pas peser sur les
      // routes qui n'importent pas de PDF.
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        texte = (await parser.getText()).text;
        // pdf-parse v2 insère des séparateurs de page ("-- 1 of 1 --") dans le
        // texte extrait : on les retire avant normalisation, propre à ce format.
        texte = texte.replace(/^\s*-{2,}\s*\d+\s+of\s+\d+\s*-{2,}\s*$/gm, "");
      } finally {
        await parser.destroy();
      }
    } else {
      return NextResponse.json({ erreur: "format_non_supporte" }, { status: 415 });
    }
  } catch {
    return NextResponse.json({ erreur: "extraction_echouee" }, { status: 422 });
  }
  const normalise = normaliser(texte);
  if (normalise.length < 20) {
    return NextResponse.json({ erreur: "texte_vide" }, { status: 422 });
  }
  return NextResponse.json({ texte: normalise });
}
