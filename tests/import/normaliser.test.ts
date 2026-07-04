import { describe, it, expect } from "vitest";
import { normaliser } from "@/lib/import/normaliser";

describe("normaliser", () => {
  it("unifie les fins de ligne", () => {
    expect(normaliser("a\r\nb\rc")).toBe("a\nb\nc");
  });
  it("remplace NBSP et espace fine par une espace simple", () => {
    expect(normaliser("mot ; suite")).toBe("mot ; suite");
  });
  it("compresse les lignes vides multiples", () => {
    expect(normaliser("a\n\n\n\nb")).toBe("a\n\nb");
  });
  it("supprime les espaces de fin de ligne", () => {
    expect(normaliser("a   \nb")).toBe("a\nb");
  });
});
