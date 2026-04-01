"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ShellUser = null | {
  id: string;
  name: string;
  email: string;
  role: string;
};

function getNavigation(role: string | null) {
  const base = [
    { href: "/", label: "Actas" },
    { href: "/captura", label: "Captura" },
  ];

  if (role === "ADMIN") base.push({ href: "/admin", label: "Admin" });
  return base;
}

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: ShellUser;
}) {
  const pathname = usePathname();
  const navigation = getNavigation(user?.role ?? null);
  const sessionLink = user ? (
    <Link className="nav-link" href="/logout">
      Salir
    </Link>
  ) : (
    <Link className="nav-link" href="/login">
      Entrar
    </Link>
  );
  const sessionLinkMobile = user ? (
    <Link className="mobile-link" href="/logout">
      <span>Salir</span>
    </Link>
  ) : (
    <Link className="mobile-link" href="/login">
      <span>Entrar</span>
    </Link>
  );

  return (
    <div className="shell-root">
      <header className="shell-header">
        <div className="brand-panel">
          <Image
            src="/brand/logo-fullcolor.png"
            alt="Ecosat Technology Solutions"
            width={220}
            height={48}
            priority
          />
          <div className="brand-copy">
            <span>{user ? `${user.name} · ${user.role}` : "Bitacora inteligente de campo"}</span>
            <strong>{user ? user.email : "Frontend MVP"}</strong>
          </div>
        </div>

        <nav className="desktop-nav" aria-label="Navegacion principal">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                className={isActive ? "nav-link active" : "nav-link"}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
          {sessionLink}
        </nav>
      </header>

      <main className="shell-main">{children}</main>

      <nav className="mobile-nav" aria-label="Navegacion movil">
        {navigation.map((item) => {
          const isActive =
            item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              className={isActive ? "mobile-link active" : "mobile-link"}
              href={item.href}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
        {sessionLinkMobile}
      </nav>
    </div>
  );
}
