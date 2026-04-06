import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createDraftAction, createStructuredReportAction } from "./actions";
import { CaptureFlow } from "@/components/capture-flow";
import { DEMO_BRANCH_OPTIONS } from "@/lib/catalogs";

export const dynamic = "force-dynamic";

export default async function CapturePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const branches = await prisma.branch.findMany({
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, location: true, client: { select: { name: true } } },
  });

  const branchOptions = branches.length
    ? branches.map((branch) => ({
        id: branch.id,
        clientName: branch.client.name,
        branchName: branch.name,
        location: branch.location,
      }))
    : DEMO_BRANCH_OPTIONS;

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
              Graba voz o escribe. Estructura, valida y guarda el acta antes de pasar a firma.
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
