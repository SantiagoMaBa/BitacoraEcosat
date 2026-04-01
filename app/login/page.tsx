import Image from "next/image";
import { prisma } from "@/lib/db";
import { loginAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true },
  });

  return (
    <div className="page-flow">
      <section className="hero-panel login-hero">
        <div className="hero-copy">
          <span className="eyebrow">Acceso demo</span>
          <h1>Entrar a Bitacora Ecosat</h1>
          <p className="hero-text">
            Selecciona un perfil para probar el MVP con roles, reportes y actas.
          </p>
        </div>
        <div className="hero-side">
          <div className="glass-card login-card">
            <Image
              src="/brand/logo-fullcolor.png"
              alt="Ecosat"
              width={220}
              height={48}
              priority
            />
            <p className="muted">
              En esta fase no hay password. Es un acceso de prueba local.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-title">
          <span className="eyebrow">Perfiles</span>
          <h2>Usuarios de prueba</h2>
          <p>Estos usuarios se crean con `npm run db:seed`.</p>
        </div>

        <div className="module-grid">
          {users.map((user) => (
            <form key={user.id} action={loginAction} className="module-card login-user">
              <input type="hidden" name="userId" value={user.id} />
              <span className="module-kicker">{user.role}</span>
              <h3>{user.name}</h3>
              <p>{user.email}</p>
              <button className="button button-primary wide-button" type="submit">
                Entrar
              </button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
