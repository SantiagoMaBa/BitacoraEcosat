import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getEvidenceDownloadUrl } from "@/lib/storage";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const evidence = await prisma.evidence.findUnique({
    where: { id },
    select: { filename: true, mime: true, path: true },
  });

  if (!evidence) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (evidence.path.startsWith("supabase:")) {
    const [, bucket, ...rest] = evidence.path.split(":");
    const objectKey = rest.join(":");
    const signedUrl = await getEvidenceDownloadUrl({ bucket, objectKey, expiresInSeconds: 60 });
    return NextResponse.redirect(signedUrl);
  }

  if (evidence.path.startsWith("local:")) {
    const rel = evidence.path.slice("local:".length);
    const absolutePath = path.join(process.cwd(), rel);
    const bytes = await fs.readFile(absolutePath);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": evidence.mime || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${evidence.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({ error: "Unsupported evidence driver" }, { status: 400 });
}
