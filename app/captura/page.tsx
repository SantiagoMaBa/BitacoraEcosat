import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createDraftAction, createStructuredReportAction } from "./actions";
import { CaptureFlow } from "@/components/capture-flow";

export const dynamic = "force-dynamic";

export default async function CapturePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const branchOptions =
    user.role === "TECHNICIAN"
      ? (
          await prisma.technicianBranch.findMany({
            where: { technicianId: user.id },
            select: {
              branch: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                  client: { select: { name: true } },
                },
              },
            },
            orderBy: { createdAt: "asc" },
          })
        ).map((entry) => entry.branch)
      : await prisma.branch.findMany({
          select: {
            id: true,
            name: true,
            location: true,
            client: { select: { name: true } },
          },
          orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
        });

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const dateDefault = `${yyyy}-${mm}-${dd}`;

  return (
    <div className="page-flow">
      <section className="content-section">
        <div className="page-header">
          <div>
            <h1 className="page-title">Captura</h1>
            <p className="muted">
              Graba voz o escribe. Estructura, edita/valida y guarda el acta lista para firma.
            </p>
          </div>
        </div>

        <CaptureFlow
          branchOptions={branchOptions}
          dateDefault={dateDefault}
          createAction={createStructuredReportAction}
          draftAction={createDraftAction}
        />
      </section>
    </div>
  );
}
