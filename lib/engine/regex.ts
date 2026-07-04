import type { Detecteur, Detection } from "@/lib/rules/types";

type Dyn = string | ((m: RegExpExecArray) => string);

export function detecteurRegex(
  regex: RegExp,
  opts: { message?: Dyn; suggestion?: Dyn } = {},
): Detecteur {
  return (texte: string): Detection[] => {
    const flags = regex.flags.includes("g") ? regex.flags : regex.flags + "g";
    const re = new RegExp(regex.source, flags);
    const out: Detection[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(texte)) !== null) {
      out.push({
        span: { start: m.index, end: m.index + m[0].length },
        extrait: m[0],
        message: typeof opts.message === "function" ? opts.message(m) : opts.message,
        suggestion: typeof opts.suggestion === "function" ? opts.suggestion(m) : opts.suggestion,
      });
      if (m.index === re.lastIndex) re.lastIndex++;
    }
    return out;
  };
}
