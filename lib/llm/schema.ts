import { z } from "zod";

export const ReponseLlmSchema = z.object({
  findings: z.array(
    z.object({
      ruleId: z.string(),
      citation: z.string(),
      message: z.string(),
      suggestion: z.string().nullable(),
    }),
  ),
});

export type ReponseLlm = z.infer<typeof ReponseLlmSchema>;
