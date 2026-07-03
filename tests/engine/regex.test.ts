import { describe, it, expect } from "vitest";
import { detecteurRegex } from "@/lib/engine/regex";

describe("detecteurRegex", () => {
  it("trouve toutes les occurrences avec spans exacts", () => {
    const d = detecteurRegex(/et\/ou/g, { message: "« et/ou » est proscrit", suggestion: "ou" });
    const r = d("choix et/ou option, encore et/ou");
    expect(r).toHaveLength(2);
    expect(r[0].span).toEqual({ start: 6, end: 11 });
    expect(r[0].extrait).toBe("et/ou");
    expect(r[0].suggestion).toBe("ou");
  });
  it("supporte message et suggestion dynamiques", () => {
    const d = detecteurRegex(/visé(e?s?) (à|au|aux)/g, {
      suggestion: (m) => `mentionné${m[1]} ${m[2]}`,
    });
    expect(d("visée à l'article")[0].suggestion).toBe("mentionnée à");
  });
  it("retourne [] si aucune occurrence", () => {
    expect(detecteurRegex(/xyz/g, {})("rien")).toEqual([]);
  });
});
