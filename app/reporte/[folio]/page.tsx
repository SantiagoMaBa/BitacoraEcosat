import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SignaturePad } from "@/components/signature-pad";
import { closeReportAction, signReportAction, updateReportAction, uploadEvidenceAction } from "./actions";

type ReportPageProps = {
  params: Promise<{
    folio: string;
  }>;
};

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  switch (status) {
    case "DRAFT":
      return "Borrador";
    case "READY_FOR_REVIEW":
      return "En revision";
    case "READY_FOR_SIGNATURE":
      return "Listo para firma";
    case "SIGNED":
      return "Firmado";
    case "CLOSED":
      return "Cerrado";
    default:
      return status;
  }
}

function statusTone(status: string) {
  if (status === "CLOSED" || status === "SIGNED") return "tone-success";
  if (status === "READY_FOR_SIGNATURE") return "tone-info";
  if (status === "DRAFT") return "tone-neutral";
  return "tone-warning";
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { folio: folioParam } = await params;
  const folio = String(folioParam ?? "").toUpperCase();
  const currentUser = await getCurrentUser();

  const report = await prisma.report.findUnique({
    where: { folio },
    include: {
      technician: { select: { name: true } },
      supervisor: { select: { name: true } },
      client: { select: { name: true } },
      branch: { select: { name: true } },
      evidences: true,
      signatures: true,
    },
  });

  if (!report) {
    notFound();
  }

  const structured = report.structured as any;
  const activities: string[] = Array.isArray(structured?.actividades) ? structured.actividades : [];
  const findings: string[] = Array.isArray(structured?.hallazgos) ? structured.hallazgos : [];
  const pending: string[] = Array.isArray(structured?.pendientes) ? structured.pendientes : [];
  const purchases: string[] = Array.isArray(structured?.compras) ? structured.compras : [];
  const recommendations: string[] = Array.isArray(structured?.recomendaciones) ? structured.recomendaciones : [];
  const techSig = report.signatures.find((sig) => sig.type === "TECHNICIAN" && sig.version === report.version);
  const clientSig = report.signatures.find((sig) => sig.type === "CLIENT" && sig.version === report.version);
  const timeRange =
    report.startedAt && report.endedAt
      ? `${new Date(report.startedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} - ${new Date(report.endedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`
      : "";

  return (
    <div className="page-flow">
      <section className="content-section">
        <div className="page-header">
          <div>
            <h1 className="page-title">{report.folio}</h1>
            <p className="muted">
              {report.client.name} / {report.branch.name}
              {timeRange ? ` · ${timeRange}` : ""}
            </p>
          </div>
          <span className={`status-pill ${statusTone(report.status)}`}>{statusLabel(report.status)}</span>
        </div>

        <div className="meta-grid">
          <div className="meta-item">
            <span className="label">Servicio</span>
            <strong>{report.serviceType}</strong>
          </div>
          <div className="meta-item">
            <span className="label">Fecha</span>
            <strong>{new Date(report.createdAt).toLocaleDateString("es-MX")}</strong>
          </div>
          <div className="meta-item">
            <span className="label">Tecnico</span>
            <strong>{report.technician.name}</strong>
          </div>
          <div className="meta-item">
            <span className="label">Supervisor</span>
            <strong>{report.supervisor.name}</strong>
          </div>
        </div>

        <div className="card-section">
          <span className="label">Resumen</span>
          <p className="muted">{report.summary}</p>
        </div>
      </section>

      <section className="content-section">
        <div className="two-col">
          <div className="card">
            <h2 className="card-title">Trabajo</h2>
            <div className="mini-cols">
              <div>
                <span className="label">Actividades</span>
                <ul className="bullet-list">
                  {activities.length ? activities.map((item) => <li key={item}>{item}</li>) : <li>Sin registro.</li>}
                </ul>
              </div>
              <div>
                <span className="label">Hallazgos</span>
                <ul className="bullet-list">
                  {findings.length ? findings.map((item) => <li key={item}>{item}</li>) : <li>Sin registro.</li>}
                </ul>
              </div>
            </div>
            <div className="mini-cols">
              <div>
                <span className="label">Pendientes</span>
                <ul className="bullet-list">
                  {pending.length ? pending.map((item) => <li key={item}>{item}</li>) : <li>Sin pendientes.</li>}
                </ul>
              </div>
              <div>
                <span className="label">Compras</span>
                <ul className="bullet-list">
                  {purchases.length ? purchases.map((item) => <li key={item}>{item}</li>) : <li>Sin compras.</li>}
                </ul>
              </div>
            </div>

            <div className="card-section">
              <span className="label">Recomendaciones</span>
              <ul className="bullet-list">
                {recommendations.length
                  ? recommendations.map((item) => <li key={item}>{item}</li>)
                  : <li>Sin recomendaciones.</li>}
              </ul>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Evidencias</h2>
            <div className="evidence-inline">
              {report.evidences.length === 0 ? (
                <span className="muted">Sin evidencias.</span>
              ) : (
                report.evidences.map((item) => (
                  <div key={item.id} className="inline-chip">
                    <strong>{item.type}</strong>
                    <a className="text-link" href={`/api/evidence/${encodeURIComponent(item.id)}`}>
                      {item.filename}
                    </a>
                  </div>
                ))
              )}
            </div>
            <form className="evidence-upload" action={uploadEvidenceAction}>
              <input type="hidden" name="folio" value={report.folio} />
              <label className="field">
                <span>Subir archivos</span>
                <input name="files" type="file" multiple />
              </label>
              <button className="button button-secondary" type="submit">
                Cargar
              </button>
            </form>
          </div>
        </div>

        <div className="two-col">
          <div className="card">
            <h2 className="card-title">Firma tecnico</h2>
            {techSig ? (
              <p className="muted">
                Firmado por {techSig.name} · {new Date(techSig.signedAt).toLocaleString("es-MX")}
              </p>
            ) : report.locked ? (
              <p className="muted">Reporte bloqueado.</p>
            ) : (
              <form className="form-flow" action={signReportAction}>
                <input type="hidden" name="folio" value={report.folio} />
                <input type="hidden" name="signatureType" value="TECHNICIAN" />
                <label className="field">
                  <span>Nombre</span>
                  <input name="name" defaultValue={report.technician.name} required />
                </label>
                <SignaturePad inputName="imagePng" />
                <button
                  className="button button-primary wide-button"
                  type="submit"
                  disabled={!currentUser || currentUser.id !== report.technicianId}
                  title={
                    !currentUser || currentUser.id !== report.technicianId
                      ? "Solo el tecnico asignado puede firmar."
                      : ""
                  }
                >
                  Firmar
                </button>
              </form>
            )}
          </div>

          <div className="card">
            <h2 className="card-title">Firma cliente</h2>
            {clientSig ? (
              <p className="muted">
                Firmado por {clientSig.name} · {new Date(clientSig.signedAt).toLocaleString("es-MX")}
              </p>
            ) : report.locked ? (
              <p className="muted">Reporte bloqueado.</p>
            ) : (
              <form className="form-flow" action={signReportAction}>
                <input type="hidden" name="folio" value={report.folio} />
                <input type="hidden" name="signatureType" value="CLIENT" />
                <label className="field">
                  <span>Nombre</span>
                  <input name="name" placeholder="Nombre del cliente" required />
                </label>
                <SignaturePad inputName="imagePng" />
                <button className="button button-primary wide-button" type="submit">
                  Firmar
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Editar y validar</h2>
          <p className="muted">Edita listas (1 por linea). Si ya estaba firmado, al guardar se genera nueva version y se requiere re-firma.</p>
          <form className="form-flow" action={updateReportAction}>
            <input type="hidden" name="folio" value={report.folio} />
            <div className="form-grid">
              <label className="field">
                <span>Tipo de servicio</span>
                <input name="serviceType" defaultValue={report.serviceType} />
              </label>
              <label className="field">
                <span>Resumen</span>
                <textarea name="summary" defaultValue={report.summary} rows={3} />
              </label>
            </div>
            <div className="mini-cols">
              <label className="field">
                <span>Actividades</span>
                <textarea name="activities" defaultValue={activities.join("\n")} rows={6} />
              </label>
              <label className="field">
                <span>Hallazgos</span>
                <textarea name="findings" defaultValue={findings.join("\n")} rows={6} />
              </label>
            </div>
            <div className="mini-cols">
              <label className="field">
                <span>Pendientes</span>
                <textarea name="pending" defaultValue={pending.join("\n")} rows={6} />
              </label>
              <label className="field">
                <span>Compras</span>
                <textarea name="purchases" defaultValue={purchases.join("\n")} rows={6} />
              </label>
            </div>
            <label className="field">
              <span>Recomendaciones</span>
              <textarea name="recommendations" defaultValue={recommendations.join("\n")} rows={5} />
            </label>
            <button className="button button-secondary" type="submit">
              Guardar cambios
            </button>
          </form>
        </div>

        <div className="action-row">
          <Link className="button button-secondary" href="/">
            Volver a actas
          </Link>
          <Link className="button button-secondary" href="/captura">
            Nueva captura
          </Link>
          {(currentUser?.role === "ADMIN" || currentUser?.role === "SUPERVISOR") && report.status === "SIGNED" ? (
            <form action={closeReportAction}>
              <input type="hidden" name="folio" value={report.folio} />
              <button className="button button-secondary" type="submit">
                Cerrar acta
              </button>
            </form>
          ) : null}
          <a className="button button-primary" href={`/api/reporte/${encodeURIComponent(report.folio)}/pdf`}>
            Descargar PDF
          </a>
        </div>
      </section>
    </div>
  );
}
