"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { storeEvidenceFile } from "@/lib/storage";

const signSchema = z.object({
  folio: z.string().min(3),
  signatureType: z.enum(["TECHNICIAN", "CLIENT"]),
  name: z.string().trim().min(2),
  imagePng: z
    .string()
    .trim()
    .refine((value) => value.startsWith("data:image/png;base64,"), "Formato invalido"),
});

export async function signReportAction(formData: FormData) {
  const payload = signSchema.safeParse({
    folio: String(formData.get("folio") ?? "").toUpperCase(),
    signatureType: String(formData.get("signatureType") ?? ""),
    name: String(formData.get("name") ?? ""),
    imagePng: String(formData.get("imagePng") ?? ""),
  });

  if (!payload.success) {
    redirect(`/reporte/${encodeURIComponent(String(formData.get("folio") ?? ""))}`);
  }

  const { folio, signatureType, name, imagePng } = payload.data;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const report = await prisma.report.findUnique({
    where: { folio },
    select: { id: true, version: true, locked: true, technicianId: true, supervisorId: true, status: true },
  });
  if (!report) redirect("/");

  if (report.locked) {
    redirect(`/reporte/${encodeURIComponent(folio)}`);
  }

  if (signatureType === "TECHNICIAN") {
    if (user.role !== "TECHNICIAN" || user.id !== report.technicianId) {
      redirect(`/reporte/${encodeURIComponent(folio)}`);
    }
  }

  if (signatureType === "CLIENT") {
    const allowed = user.role === "SUPERVISOR" || user.role === "ADMIN" || user.id === report.supervisorId;
    if (!allowed) {
      redirect(`/reporte/${encodeURIComponent(folio)}`);
    }
  }

  try {
    await prisma.signature.create({
      data: {
        reportId: report.id,
        type: signatureType,
        name,
        imagePng,
        version: report.version,
      },
    });
  } catch {
    // ignore duplicates for demo
  }

  const signatures = await prisma.signature.findMany({
    where: { reportId: report.id, version: report.version },
    select: { type: true },
  });

  const types = new Set(signatures.map((s) => s.type));
  if (types.has("TECHNICIAN") && types.has("CLIENT")) {
    await prisma.report.update({
      where: { id: report.id },
      data: { status: "SIGNED", locked: true },
    });
  }

  redirect(`/reporte/${encodeURIComponent(folio)}`);
}

export async function uploadEvidenceAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const folioParam = String(formData.get("folio") ?? "").toUpperCase();
  if (!folioParam) redirect("/");

  const report = await prisma.report.findUnique({
    where: { folio: folioParam },
    select: { id: true },
  });
  if (!report) redirect("/");

  const files = formData.getAll("files").filter(Boolean) as File[];
  if (files.length === 0) redirect(`/reporte/${encodeURIComponent(folioParam)}`);

  for (const file of files) {
    if (!(file instanceof File)) continue;
    if (file.size <= 0) continue;

    const bytes = Buffer.from(await file.arrayBuffer());

    const mime = file.type || "application/octet-stream";
    const type = mime.startsWith("image/")
      ? "PHOTO"
      : mime.startsWith("video/")
        ? "VIDEO"
        : mime.startsWith("audio/")
          ? "AUDIO"
          : mime === "application/pdf"
            ? "PDF"
            : "PDF";

    const stored = await storeEvidenceFile({
      reportId: report.id,
      originalFilename: file.name || "evidencia",
      mime,
      bytes,
    });

    await prisma.evidence.create({
      data: {
        reportId: report.id,
        type,
        filename: file.name || "evidencia",
        mime,
        path:
          stored.driver === "supabase"
            ? `supabase:${stored.bucket}:${stored.objectKey}`
            : `local:${stored.localPath}`,
      },
    });
  }

  redirect(`/reporte/${encodeURIComponent(folioParam)}`);
}

function parseLines(text: string) {
  return String(text || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function updateReportAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const folio = String(formData.get("folio") ?? "").toUpperCase();
  if (!folio) redirect("/");

  const report = await prisma.report.findUnique({
    where: { folio },
    include: { signatures: true },
  });
  if (!report) redirect("/");

  const canEdit =
    user.role === "ADMIN" ||
    (user.role === "SUPERVISOR" && report.supervisorId === user.id) ||
    (user.role === "TECHNICIAN" && report.technicianId === user.id);
  if (!canEdit) redirect(`/reporte/${encodeURIComponent(folio)}`);

  const serviceType = String(formData.get("serviceType") ?? report.serviceType).trim();
  const summary = String(formData.get("summary") ?? report.summary).trim();
  const activities = parseLines(String(formData.get("activities") ?? ""));
  const findings = parseLines(String(formData.get("findings") ?? ""));
  const pending = parseLines(String(formData.get("pending") ?? ""));
  const purchases = parseLines(String(formData.get("purchases") ?? ""));
  const recommendations = parseLines(String(formData.get("recommendations") ?? ""));

  const structured = {
    ...(report.structured as any),
    resumen: summary || "Servicio registrado.",
    actividades: activities,
    hallazgos: findings,
    pendientes: pending,
    compras: purchases,
    recomendaciones: recommendations,
  };

  const hasSignaturesForVersion = report.signatures.some((s) => s.version === report.version);
  const bumpVersion = report.locked || report.status === "SIGNED" || hasSignaturesForVersion;
  const nextVersion = bumpVersion ? report.version + 1 : report.version;

  await prisma.report.update({
    where: { id: report.id },
    data: {
      serviceType,
      summary: structured.resumen,
      structured,
      version: nextVersion,
      locked: false,
      status: "READY_FOR_SIGNATURE",
    },
  });

  redirect(`/reporte/${encodeURIComponent(folio)}`);
}

export async function closeReportAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const folio = String(formData.get("folio") ?? "").toUpperCase();
  if (!folio) redirect("/");

  const report = await prisma.report.findUnique({
    where: { folio },
    select: { id: true, supervisorId: true, status: true },
  });
  if (!report) redirect("/");

  const allowed = user.role === "ADMIN" || (user.role === "SUPERVISOR" && report.supervisorId === user.id);
  if (!allowed) redirect(`/reporte/${encodeURIComponent(folio)}`);

  await prisma.report.update({
    where: { id: report.id },
    data: { status: "CLOSED" },
  });

  redirect(`/reporte/${encodeURIComponent(folio)}`);
}
