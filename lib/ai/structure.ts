export type StructuredReport = {
  transcripcion_original: string;
  meta?: {
    cliente: string | null;
    sucursal: string | null;
    tipo_servicio: string | null;
    fecha: string | null; // YYYY-MM-DD
    hora_inicio: string | null; // HH:MM (24h)
    hora_fin: string | null; // HH:MM (24h)
  };
  resumen: string;
  actividades: string[];
  hallazgos: string[];
  pendientes: string[];
  compras: string[];
  recomendaciones: string[];
};

function splitSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/[.?!]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function addIfMeaningful(list: string[], value: string) {
  const trimmed = value.trim();
  if (!trimmed) return;
  if (trimmed.length < 4) return;
  list.push(trimmed);
}

export function structureFromText(rawText: string): StructuredReport {
  const sentences = splitSentences(rawText);
  const actividades: string[] = [];
  const hallazgos: string[] = [];
  const pendientes: string[] = [];
  const compras: string[] = [];
  const recomendaciones: string[] = [];

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();

    if (/(pendiente|por hacer|falta|queda)/.test(lower)) {
      addIfMeaningful(pendientes, sentence);
      continue;
    }

    if (/(compr(e|é)|compre|se compr(o|ó)|refaccion|refacción|repuesto)/.test(lower)) {
      addIfMeaningful(compras, sentence);
      continue;
    }

    if (/(falla|fallo|error|intermit|degrad|voltaje|inestable|humedad|dañad)/.test(lower)) {
      addIfMeaningful(hallazgos, sentence);
      continue;
    }

    if (/(se requiere|recomiendo|recomendacion|recomendación|sugiero|conviene)/.test(lower)) {
      addIfMeaningful(recomendaciones, sentence);
      continue;
    }

    addIfMeaningful(actividades, sentence);
  }

  const resumen =
    sentences[0]?.slice(0, 220) ??
    "Servicio registrado. Revisar actividades, hallazgos y pendientes.";

  return {
    transcripcion_original: rawText.trim(),
    meta: {
      cliente: null,
      sucursal: null,
      tipo_servicio: null,
      fecha: null,
      hora_inicio: null,
      hora_fin: null,
    },
    resumen,
    actividades,
    hallazgos,
    pendientes,
    compras,
    recomendaciones,
  };
}
