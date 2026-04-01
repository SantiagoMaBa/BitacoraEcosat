"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

type BranchOption = {
  id: string;
  name: string;
  location: string | null;
  client: { name: string };
};

type StructuredReport = {
  transcripcion_original: string;
  resumen: string;
  actividades: string[];
  hallazgos: string[];
  pendientes: string[];
  compras: string[];
  recomendaciones: string[];
};

function linesToList(text: string) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToLines(list: string[]) {
  return (list ?? []).join("\n");
}

export function CaptureFlow({
  branchOptions,
  dateDefault,
  createAction,
  draftAction,
}: {
  branchOptions: BranchOption[];
  dateDefault: string;
  createAction: (formData: FormData) => Promise<void>;
  draftAction: (formData: FormData) => Promise<void>;
}) {
  const [rawText, setRawText] = useState("");
  const [structured, setStructured] = useState<StructuredReport | null>(null);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const defaultBranchId = useMemo(() => branchOptions[0]?.id ?? "", [branchOptions]);

  useEffect(() => {
    // reset structured when rawText changes manually
    setStructured(null);
  }, [rawText]);

  async function transcribeAndFill() {
    setError(null);
    const chunks = chunksRef.current;
    if (!chunks.length) {
      setError("No hay audio grabado.");
      return;
    }
    const blob = new Blob(chunks, { type: "audio/webm" });
    const file = new File([blob], "captura.webm", { type: blob.type || "audio/webm" });

    const form = new FormData();
    form.set("audio", file);

    const res = await fetch("/api/ai/transcribe", { method: "POST", body: form });
    if (!res.ok) {
      const msg = await res.json().catch(() => ({} as any));
      setError(msg.error || "Error transcribiendo audio.");
      return;
    }

    const data = (await res.json()) as { text: string };
    setRawText(data.text || "");
  }

  async function structurePreview() {
    setError(null);
    if (!rawText.trim()) {
      setError("Escribe o transcribe lo que hiciste.");
      return;
    }
    const res = await fetch("/api/ai/structure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText }),
    });
    if (!res.ok) {
      const msg = await res.json().catch(() => ({} as any));
      setError(msg.error || "Error estructurando.");
      return;
    }
    const data = (await res.json()) as StructuredReport;
    setStructured(data);
  }

  function startRecording() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Tu navegador no soporta grabacion de audio.");
      return;
    }

    startTransition(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
          setAudioReady(chunksRef.current.length > 0);
          stream.getTracks().forEach((t) => t.stop());
        };

        recorder.start();
        recorderRef.current = recorder;
        setAudioReady(false);
        setRecording(true);
      } catch {
        setError("No se pudo iniciar microfono.");
      }
    });
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    try {
      recorder.stop();
    } catch {
      // ignore
    }
    recorderRef.current = null;
    setRecording(false);
  }

  const activitiesLines = listToLines(structured?.actividades ?? []);
  const findingsLines = listToLines(structured?.hallazgos ?? []);
  const pendingLines = listToLines(structured?.pendientes ?? []);
  const purchasesLines = listToLines(structured?.compras ?? []);
  const recommendationsLines = listToLines(structured?.recomendaciones ?? []);

  return (
    <div className="card">
      {error ? <div className="alert">{error}</div> : null}

      <form className="form-flow" action={createAction}>
        <div className="form-grid">
          <label className="field">
            <span>Cliente / sucursal</span>
            <select className="select" name="branchId" defaultValue={defaultBranchId} required>
              {branchOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.client.name} · {branch.name}
                  {branch.location ? ` (${branch.location})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Tipo de servicio</span>
            <input name="serviceType" defaultValue="Servicio en sitio" required />
          </label>

          <label className="field">
            <span>Fecha</span>
            <input type="date" name="date" defaultValue={dateDefault} />
          </label>

          <label className="field">
            <span>Hora inicio</span>
            <input type="time" name="startTime" defaultValue="09:00" />
          </label>

          <label className="field">
            <span>Hora fin</span>
            <input type="time" name="endTime" defaultValue="10:00" />
          </label>
        </div>

        <div className="voice-row">
          <button
            className="button button-secondary"
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={busy}
          >
            {recording ? "Detener" : "Grabar"}
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => startTransition(transcribeAndFill)}
            disabled={!audioReady || busy}
            title={!audioReady ? "Graba primero" : ""}
          >
            Transcribir
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => startTransition(structurePreview)}
            disabled={!rawText.trim() || busy}
          >
            Estructurar
          </button>
          <span className="muted">
            {recording ? "Grabando..." : audioReady ? "Audio listo" : "Sin audio"}
          </span>
        </div>

        <label className="field">
          <span>Que hiciste hoy (texto o transcripcion)</span>
          <textarea
            name="rawText"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Ej: Llegue a la sucursal..., revise..., encontre..., compre..., queda pendiente..."
            rows={10}
            required
          />
        </label>

        <input type="hidden" name="structuredJson" value={structured ? JSON.stringify(structured) : ""} />

        {structured ? (
          <div className="edit-grid">
            <div className="card-section">
              <span className="label">Resumen</span>
              <textarea
                name="summaryOverride"
                defaultValue={structured.resumen}
                rows={3}
              />
            </div>

            <div className="mini-cols">
              <label className="field">
                <span>Actividades (1 por linea)</span>
                <textarea
                  name="activitiesLines"
                  defaultValue={activitiesLines}
                  rows={6}
                />
              </label>
              <label className="field">
                <span>Hallazgos (1 por linea)</span>
                <textarea
                  name="findingsLines"
                  defaultValue={findingsLines}
                  rows={6}
                />
              </label>
            </div>

            <div className="mini-cols">
              <label className="field">
                <span>Pendientes (1 por linea)</span>
                <textarea name="pendingLines" defaultValue={pendingLines} rows={6} />
              </label>
              <label className="field">
                <span>Compras (1 por linea)</span>
                <textarea name="purchasesLines" defaultValue={purchasesLines} rows={6} />
              </label>
            </div>

            <label className="field">
              <span>Recomendaciones (1 por linea)</span>
              <textarea name="recommendationsLines" defaultValue={recommendationsLines} rows={5} />
            </label>
          </div>
        ) : null}

        <div className="action-row">
          <button className="button button-primary" type="submit" disabled={busy}>
            Guardar acta
          </button>
          <button className="button button-secondary" formAction={draftAction} disabled={busy}>
            Guardar borrador
          </button>
        </div>
      </form>
    </div>
  );
}

