import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  assignTechnicianAction,
  createBranchAction,
  createClientAction,
  createUserAction,
  linkTechnicianBranchAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const [clients, branches, users] = await Promise.all([
    prisma.client.findMany({ orderBy: [{ name: "asc" }], select: { id: true, name: true } }),
    prisma.branch.findMany({
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, location: true, client: { select: { name: true } } },
    }),
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, email: true, role: true, supervisorId: true, active: true },
    }),
  ]);

  const supervisors = users.filter((u) => u.role === "SUPERVISOR");
  const technicians = users.filter((u) => u.role === "TECHNICIAN");

  return (
    <div className="page-flow">
      <section className="content-section">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admin</h1>
            <p className="muted">CRUD basico para probar flujos Admin, Supervisor y Tecnico.</p>
          </div>
        </div>

        <div className="two-col">
          <div className="card">
            <h2 className="card-title">Clientes</h2>
            <form className="form-flow" action={createClientAction}>
              <label className="field">
                <span>Nombre</span>
                <input name="name" placeholder="Nombre del cliente" required />
              </label>
              <button className="button button-primary" type="submit">
                Crear cliente
              </button>
            </form>
            <div className="list">
              {clients.map((c) => (
                <div key={c.id} className="list-row">
                  <strong>{c.name}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Sucursales</h2>
            <form className="form-flow" action={createBranchAction}>
              <label className="field">
                <span>Cliente</span>
                <select className="select" name="clientId" required>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Nombre</span>
                <input name="name" placeholder="Nombre de sucursal" required />
              </label>
              <label className="field">
                <span>Ubicacion (opcional)</span>
                <input name="location" placeholder="Ciudad, Estado" />
              </label>
              <button className="button button-primary" type="submit">
                Crear sucursal
              </button>
            </form>
            <div className="list">
              {branches.map((b) => (
                <div key={b.id} className="list-row">
                  <strong>{b.client.name}</strong>
                  <span className="muted">
                    {b.name}
                    {b.location ? ` · ${b.location}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="two-col">
          <div className="card">
            <h2 className="card-title">Usuarios</h2>
            <form className="form-flow" action={createUserAction}>
              <div className="form-grid">
                <label className="field">
                  <span>Nombre</span>
                  <input name="name" required />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input name="email" type="email" required />
                </label>
                <label className="field">
                  <span>Rol</span>
                  <select className="select" name="role" defaultValue="TECHNICIAN">
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                    <option value="TECHNICIAN">TECHNICIAN</option>
                  </select>
                </label>
                <label className="field">
                  <span>Supervisor (si es tecnico)</span>
                  <select className="select" name="supervisorId" defaultValue="">
                    <option value="">Sin asignar</option>
                    {supervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button className="button button-primary" type="submit">
                Crear usuario
              </button>
            </form>
            <div className="list">
              {users.map((u) => (
                <div key={u.id} className="list-row">
                  <strong>{u.name}</strong>
                  <span className="muted">
                    {u.role} · {u.email}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Asignaciones</h2>

            <form className="form-flow" action={assignTechnicianAction}>
              <span className="label">Tecnico a supervisor</span>
              <label className="field">
                <span>Tecnico</span>
                <select className="select" name="technicianId" required>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Supervisor</span>
                <select className="select" name="supervisorId" required>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button button-secondary" type="submit">
                Asignar
              </button>
            </form>

            <form className="form-flow" action={linkTechnicianBranchAction}>
              <span className="label">Tecnico a sucursal</span>
              <label className="field">
                <span>Tecnico</span>
                <select className="select" name="technicianId" required>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Sucursal</span>
                <select className="select" name="branchId" required>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.client.name} · {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button button-secondary" type="submit">
                Vincular
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

