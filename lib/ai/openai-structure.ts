import "server-only";

import OpenAI from "openai";
import { z } from "zod";
import type { StructuredReport } from "@/lib/ai/structure";

const StructuredReportSchema = z
  .object({
    meta: z
      .object({
        cliente: z.string().trim().min(1).nullable().optional(),
        sucursal: z.string().trim().min(1).nullable().optional(),
        tipo_servicio: z.string().trim().min(1).nullable().optional(),
        fecha: z
          .string()
          .trim()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha invalido")
          .nullable()
          .optional(),
        hora_inicio: z
          .string()
          .trim()
          .regex(/^\d{2}:\d{2}$/, "Formato de hora invalido")
          .nullable()
          .optional(),
        hora_fin: z
          .string()
          .trim()
          .regex(/^\d{2}:\d{2}$/, "Formato de hora invalido")
          .nullable()
          .optional(),
      })
      .optional(),
    resumen: z.string(),
    actividades: z.array(z.string()),
    hallazgos: z.array(z.string()),
    pendientes: z.array(z.string()),
    compras: z.array(z.string()),
    recomendaciones: z.array(z.string()),
  })
  .passthrough();

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
    "meta (objeto), resumen (string), actividades (string[]), hallazgos (string[]), pendientes (string[]), compras (string[]), recomendaciones (string[]).",
    "meta debe incluir (si se menciona, si no null): cliente, sucursal, tipo_servicio, fecha (YYYY-MM-DD), hora_inicio (HH:MM), hora_fin (HH:MM).",
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

  const metaRaw: any = (validated.data as any).meta ?? {};
  const meta = {
    cliente: typeof metaRaw?.cliente === "string" ? metaRaw.cliente.trim() || null : null,
    sucursal: typeof metaRaw?.sucursal === "string" ? metaRaw.sucursal.trim() || null : null,
    tipo_servicio:
      typeof metaRaw?.tipo_servicio === "string" ? metaRaw.tipo_servicio.trim() || null : null,
    fecha: typeof metaRaw?.fecha === "string" ? metaRaw.fecha.trim() || null : null,
    hora_inicio: typeof metaRaw?.hora_inicio === "string" ? metaRaw.hora_inicio.trim() || null : null,
    hora_fin: typeof metaRaw?.hora_fin === "string" ? metaRaw.hora_fin.trim() || null : null,
  };

  return {
    meta,
    resumen: validated.data.resumen,
    actividades: validated.data.actividades,
    hallazgos: validated.data.hallazgos,
    pendientes: validated.data.pendientes,
    compras: validated.data.compras,
    recomendaciones: validated.data.recomendaciones,
    transcripcion_original: rawText.trim(),
  };
}
