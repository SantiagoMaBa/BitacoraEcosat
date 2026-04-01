import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: SearchParams | undefined, key: string) {
  const value = searchParams?.[key];
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

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

export default async function ActasPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resolvedSearchParams = (await searchParams) ?? {};
  const clientId = getParam(resolvedSearchParams, "clientId");
  const branchId = getParam(resolvedSearchParams, "branchId");
  const technicianId = getParam(resolvedSearchParams, "technicianId");
  const status = getParam(resolvedSearchParams, "status");
  const q = getParam(resolvedSearchParams, "q").trim();

  const where: any = {};
  if (user.role === "TECHNICIAN") {
    where.technicianId = user.id;
  } else if (user.role === "SUPERVISOR") {
    where.supervisorId = user.id;
  }

  if (clientId) where.clientId = clientId;
  if (branchId) where.branchId = branchId;
  if (technicianId && (user.role === "ADMIN" || user.role === "SUPERVISOR")) {
    where.technicianId = technicianId;
  }
  if (status) where.status = status;

  if (q) {
    where.OR = [
      { folio: { contains: q } },
      { serviceType: { contains: q } },
      { summary: { contains: q } },
    ];
  }

  const [reports, technicians, clients, branches] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 80,
    }),
    user.role === "ADMIN"
      ? prisma.user.findMany({
          where: { role: "TECHNICIAN", active: true },
          orderBy: [{ name: "asc" }],
          select: { id: true, name: true },
        })
      : user.role === "SUPERVISOR"
        ? prisma.user.findMany({
            where: { role: "TECHNICIAN", supervisorId: user.id, active: true },
            orderBy: [{ name: "asc" }],
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    prisma.client.findMany({
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.branch.findMany({
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, clientId: true },
    }),
  ]);

  const signatures = reports.length
    ? await prisma.signature.findMany({
        where: { reportId: { in: reports.map((r) => r.id) } },
        select: { reportId: true, type: true, version: true },
      })
    : [];

  const counts = reports.reduce(
    (acc, r) => {
      acc.total += 1;
      acc.byStatus[r.status] = (acc.byStatus[r.status] ?? 0) + 1;
      const day = new Date(r.createdAt);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      acc.byDay[key] = (acc.byDay[key] ?? 0) + 1;
      return acc;
    },
    { total: 0, byStatus: {} as Record<string, number>, byDay: {} as Record<string, number> },
  );

  const topDays = Object.entries(counts.byDay)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 3);

  return (
    <div className="page-flow">
      <section className="content-section">
        <div className="page-header">
          <div>
            <h1 className="page-title">Actas</h1>
            <p className="muted">
              Filtra por cliente, sucursal, tecnico y estatus. Abre un folio para firmar o descargar PDF.
            </p>
          </div>
          <Link className="button button-primary" href="/captura">
            Capturar dia
          </Link>
        </div>

        <div className="dash-row">
          <div className="dash-tile">
            <span className="label">Total</span>
            <strong>{counts.total}</strong>
          </div>
          <div className="dash-tile">
            <span className="label">Listas para firma</span>
            <strong>{counts.byStatus.READY_FOR_SIGNATURE ?? 0}</strong>
          </div>
          <div className="dash-tile">
            <span className="label">Firmadas</span>
            <strong>{counts.byStatus.SIGNED ?? 0}</strong>
          </div>
          <div className="dash-tile">
            <span className="label">Borradores</span>
            <strong>{counts.byStatus.DRAFT ?? 0}</strong>
          </div>
          <div className="dash-tile">
            <span className="label">Ultimos dias</span>
            <strong>
              {topDays.length ? topDays.map(([d, n]) => `${d} (${n})`).join(", ") : "—"}
            </strong>
          </div>
        </div>

        <form className="filters" method="get">
          <label className="field">
            <span>Cliente</span>
            <select className="select" name="clientId" defaultValue={clientId}>
              <option value="">Todos</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Sucursal</span>
            <select className="select" name="branchId" defaultValue={branchId}>
              <option value="">Todas</option>
              {branches
                .filter((b) => !clientId || b.clientId === clientId)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </label>

          {(user.role === "ADMIN" || user.role === "SUPERVISOR") && (
            <label className="field">
              <span>Tecnico</span>
              <select className="select" name="technicianId" defaultValue={technicianId}>
                <option value="">Todos</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span>Estatus</span>
            <select className="select" name="status" defaultValue={status}>
              <option value="">Todos</option>
              <option value="DRAFT">Borrador</option>
              <option value="READY_FOR_REVIEW">En revision</option>
              <option value="READY_FOR_SIGNATURE">Listo para firma</option>
              <option value="SIGNED">Firmado</option>
              <option value="CLOSED">Cerrado</option>
            </select>
          </label>

          <label className="field filter-search">
            <span>Buscar</span>
            <input name="q" placeholder="Folio, servicio, resumen" defaultValue={q} />
          </label>

          <div className="filter-actions">
            <button className="button button-secondary" type="submit">
              Aplicar
            </button>
            <Link className="button button-secondary" href="/">
              Limpiar
            </Link>
          </div>
        </form>
      </section>

      <section className="content-section">
        <div className="table">
          <div className="table-head">
            <span>Folio</span>
            <span>Cliente / Sucursal</span>
            <span>Tecnico</span>
            <span>Estatus</span>
            <span>Firmas</span>
            <span>Fecha</span>
          </div>
          {reports.length === 0 ? (
            <div className="table-empty">No hay actas con los filtros actuales.</div>
          ) : (
            reports.map((r) => {
              const sigs = signatures.filter((s) => s.reportId === r.id && s.version === r.version);
              const hasTech = sigs.some((s) => s.type === "TECHNICIAN");
              const hasClient = sigs.some((s) => s.type === "CLIENT");

              return (
                <Link key={r.id} className="table-row" href={`/reporte/${encodeURIComponent(r.folio)}`}>
                  <strong>{r.folio}</strong>
                  <span>
                    {r.client.name} / {r.branch.name}
                  </span>
                  <span>{r.technician.name}</span>
                  <span className={`status-pill ${statusTone(r.status)}`}>{statusLabel(r.status)}</span>
                  <span className="sig-state">
                    <span className={hasTech ? "sig-on" : "sig-off"}>T</span>
                    <span className={hasClient ? "sig-on" : "sig-off"}>C</span>
                  </span>
                  <span>{new Date(r.createdAt).toLocaleDateString("es-MX")}</span>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
