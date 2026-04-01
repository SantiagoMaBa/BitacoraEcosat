import "server-only";

import { structureFromText, type StructuredReport } from "@/lib/ai/structure";
import { structureWithOpenAI } from "@/lib/ai/openai-structure";

export async function structureReport(rawText: string): Promise<StructuredReport> {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  if (hasKey) {
    const primary = process.env.OPENAI_MODEL || "gpt-4o";
    const fallback = process.env.OPENAI_MODEL_FALLBACK || "gpt-4o-mini";

    try {
      const structured = await structureWithOpenAI(rawText, primary);
      if (structured) return structured;
    } catch {
      // ignore and try fallback
    }

    try {
      const structured = await structureWithOpenAI(rawText, fallback);
      if (structured) return structured;
    } catch {
      // ignore and fallback below
    }
  }

  return structureFromText(rawText);
}
