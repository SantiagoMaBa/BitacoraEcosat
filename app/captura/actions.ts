"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { structureReport } from "@/lib/ai";

function toDateStamp(date: Date) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

async function allocateTechnicianId(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  if (user.role === "TECHNICIAN") return user.id;
  if (user.role === "SUPERVISOR") {
    const tech = await prisma.user.findFirst({
      where: { role: "TECHNICIAN", supervisorId: user.id, active: true },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    return tech?.id ?? null;
  }

  const anyTech = await prisma.user.findFirst({
    where: { role: "TECHNICIAN", active: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return anyTech?.id ?? null;
}

async function allocateSupervisorId(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>, technicianId: string) {
  if (user.role === "SUPERVISOR") return user.id;
  if (user.role === "TECHNICIAN") {
    if (!user.supervisorId) return null;
    return user.supervisorId;
  }

  const tech = await prisma.user.findUnique({
    where: { id: technicianId },
    select: { supervisorId: true },
  });
  return tech?.supervisorId ?? null;
}

function parseLocalDateTime(dateValue: string, timeValue: string) {
  const [yearRaw, monthRaw, dayRaw] = dateValue.split("-");
  const [hourRaw, minuteRaw] = timeValue.split(":");

  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

async function createReport(formData: FormData, status: "DRAFT" | "READY_FOR_SIGNATURE") {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const branchId = String(formData.get("branchId") ?? "");
  const serviceType = String(formData.get("serviceType") ?? "").trim();
  const rawText = String(formData.get("rawText") ?? "").trim();
  const structuredJson = String(formData.get("structuredJson") ?? "").trim();
  const summaryOverride = String(formData.get("summaryOverride") ?? "").trim();
  const activitiesLines = String(formData.get("activitiesLines") ?? "").trim();
  const findingsLines = String(formData.get("findingsLines") ?? "").trim();
  const pendingLines = String(formData.get("pendingLines") ?? "").trim();
  const purchasesLines = String(formData.get("purchasesLines") ?? "").trim();
  const recommendationsLines = String(formData.get("recommendationsLines") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();

  if (!branchId || !serviceType || !rawText) {
    redirect("/captura");
  }

  const technicianId = await allocateTechnicianId(user);
  if (!technicianId) redirect("/captura");

  const supervisorId = await allocateSupervisorId(user, technicianId);
  if (!supervisorId) redirect("/captura");

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { id: true, clientId: true },
  });
  if (!branch) redirect("/captura");

  const stamp = toDateStamp(new Date());
  const folio = `BT-${stamp}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;

  const structured =
    structuredJson && structuredJson.startsWith("{")
      ? (() => {
          try {
            const parsed = JSON.parse(structuredJson);
            return {
              transcripcion_original: rawText.trim(),
              resumen: String(summaryOverride || parsed.resumen || "").trim() || "Servicio registrado.",
              actividades: linesToArray(activitiesLines, parsed.actividades),
              hallazgos: linesToArray(findingsLines, parsed.hallazgos),
              pendientes: linesToArray(pendingLines, parsed.pendientes),
              compras: linesToArray(purchasesLines, parsed.compras),
              recomendaciones: linesToArray(recommendationsLines, parsed.recomendaciones),
            };
          } catch {
            return null;
          }
        })()
      : null;

  const structuredFinal = structured ?? (await structureReport(rawText));

  const startedAt = date && startTime ? parseLocalDateTime(date, startTime) : null;
  const endedAt = date && endTime ? parseLocalDateTime(date, endTime) : null;

  const report = await prisma.report.create({
    data: {
      folio,
      technicianId,
      supervisorId,
      clientId: branch.clientId,
      branchId: branch.id,
      serviceType,
      status,
      startedAt,
      endedAt,
      rawText,
      structured: structuredFinal,
      summary: structuredFinal.resumen,
    },
    select: { folio: true },
  });

  redirect(`/reporte/${encodeURIComponent(report.folio)}`);
}

export async function createDraftAction(formData: FormData) {
  return createReport(formData, "DRAFT");
}

export async function createStructuredReportAction(formData: FormData) {
  return createReport(formData, "READY_FOR_SIGNATURE");
}

function linesToArray(text: string, fallback: unknown) {
  const lines = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length) return lines;
  return Array.isArray(fallback) ? fallback.map((s) => String(s)) : [];
}
