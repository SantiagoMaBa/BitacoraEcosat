import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bitacora Ecosat",
  description:
    "MVP frontend para la Bitacora Inteligente de Campo de Ecosat Technology Solutions.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="es">
      <body>
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
