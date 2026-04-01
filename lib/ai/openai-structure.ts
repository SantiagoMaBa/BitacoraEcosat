import "server-only";

import OpenAI from "openai";
import { z } from "zod";
import type { StructuredReport } from "@/lib/ai/structure";

const StructuredReportSchema = z
  .object({
  resumen: z.string(),
  actividades: z.array(z.string()),
  hallazgos: z.array(z.string()),
  pendientes: z.array(z.string()),
  compras: z.array(z.string()),
  recomendaciones: z.array(z.string()),
  })
  .strict();

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function resolveModel(input: string | undefined) {
  const v = (input ?? "").trim();
  if (!v) return null;

  // User-friendly aliases requested: 4 / 4o / 4mini
  if (v === "4") return "gpt-4";
  if (v === "4o") return "gpt-4o";
  if (v === "4mini") return "gpt-4o-mini";

  return v;
}

export async function structureWithOpenAI(
  rawText: string,
  modelOverride?: string,
): Promise<StructuredReport | null> {
  const client = getClient();
  if (!client) return null;

  const model =
    resolveModel(modelOverride) ??
    resolveModel(process.env.OPENAI_MODEL) ??
    "gpt-4o";

  const prompt = [
    "Convierte una bitacora de trabajo de un tecnico a JSON estructurado.",
    "Devuelve SOLO JSON valido (sin markdown, sin texto extra) con estas llaves:",
    "resumen (string), actividades (string[]), hallazgos (string[]), pendientes (string[]), compras (string[]), recomendaciones (string[]).",
    "Reglas:",
    "- resumen siempre presente (1-3 frases).",
    "- Si no hay elementos para un arreglo, devuelve [].",
    "- Usa oraciones cortas (<= 140 chars) en cada item.",
    "- Maximo 12 items por arreglo (prioriza lo mas importante).",
  ].join("\n");

  const temperatureRaw = (process.env.OPENAI_TEMPERATURE ?? "").trim();
  const temperatureParsed = Number(temperatureRaw);
  const temperature =
    Number.isFinite(temperatureParsed) && temperatureParsed >= 0 && temperatureParsed <= 1
      ? temperatureParsed
      : 0.1;

  const maxTokensRaw = (process.env.OPENAI_MAX_TOKENS ?? "").trim();
  const maxTokensParsed = Number(maxTokensRaw);
  const max_tokens =
    Number.isFinite(maxTokensParsed) && maxTokensParsed >= 128 && maxTokensParsed <= 4096
      ? Math.floor(maxTokensParsed)
      : 900;

  const response = await client.chat.completions.create({
    model,
    temperature,
    max_tokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: rawText },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";
  if (!content) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  const validated = StructuredReportSchema.safeParse(parsed);
  if (!validated.success) return null;

  return {
    ...validated.data,
    transcripcion_original: rawText.trim(),
  };
}
