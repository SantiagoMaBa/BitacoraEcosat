import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { prisma } from "@/lib/db";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    folio: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { folio: folioParam } = await context.params;
  const folio = decodeURIComponent(folioParam).toUpperCase();

  const report = await prisma.report.findUnique({
    where: { folio },
    include: {
      technician: { select: { name: true } },
      supervisor: { select: { name: true } },
      client: { select: { name: true } },
      branch: { select: { name: true } },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Ecosat brand bar
  page.drawRectangle({
    x: 0,
    y: height - 28,
    width,
    height: 28,
    color: rgb(0.16, 0.2, 0.56),
  });

  // Embed logo (best-effort)
  try {
    const logoPath = path.join(process.cwd(), "public", "brand", "logo-fullcolor.png");
    const logoBytes = await fs.readFile(logoPath);
    const logo = await doc.embedPng(logoBytes);
    const scaled = logo.scale(0.18);
    page.drawImage(logo, {
      x: 36,
      y: height - 28 - scaled.height - 16,
      width: scaled.width,
      height: scaled.height,
    });
  } catch {
    // ignore
  }

  const left = 36;
  let cursorY = height - 110;

  function line(label: string, value: string) {
    page.drawText(label, { x: left, y: cursorY, size: 10, font: fontBold, color: rgb(0.06, 0.08, 0.2) });
    page.drawText(value, { x: left + 110, y: cursorY, size: 10, font, color: rgb(0.06, 0.08, 0.2) });
    cursorY -= 16;
  }

  page.drawText("ACTA DE SERVICIO", {
    x: left,
    y: cursorY,
    size: 16,
    font: fontBold,
    color: rgb(0.06, 0.08, 0.2),
  });
  cursorY -= 28;

  line("Folio:", report.folio);
  line("Fecha:", new Date(report.createdAt).toLocaleString("es-MX"));
  line("Cliente:", report.client.name);
  line("Sucursal:", report.branch.name);
  line("Tecnico:", report.technician.name);
  line("Supervisor:", report.supervisor.name);
  line("Servicio:", report.serviceType);

  cursorY -= 8;
  page.drawText("Resumen:", { x: left, y: cursorY, size: 11, font: fontBold, color: rgb(0.06, 0.08, 0.2) });
  cursorY -= 18;

  const summaryLines = wrapText(report.summary, 92);
  for (const s of summaryLines.slice(0, 10)) {
    page.drawText(s, { x: left, y: cursorY, size: 10, font, color: rgb(0.06, 0.08, 0.2) });
    cursorY -= 14;
  }

  const structured = report.structured as any;
  cursorY -= 8;
  cursorY = drawSection(page, {
    title: "Actividades",
    items: toStringList(structured?.actividades),
    left,
    cursorY,
    font,
    fontBold,
  });
  cursorY = drawSection(page, {
    title: "Hallazgos",
    items: toStringList(structured?.hallazgos),
    left,
    cursorY,
    font,
    fontBold,
  });
  cursorY = drawSection(page, {
    title: "Pendientes",
    items: toStringList(structured?.pendientes),
    left,
    cursorY,
    font,
    fontBold,
  });
  cursorY = drawSection(page, {
    title: "Compras",
    items: toStringList(structured?.compras),
    left,
    cursorY,
    font,
    fontBold,
  });
  cursorY = drawSection(page, {
    title: "Recomendaciones",
    items: toStringList(structured?.recomendaciones),
    left,
    cursorY,
    font,
    fontBold,
  });

  const pdfBytes = await doc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${report.folio}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function toStringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)).filter(Boolean);
}

function drawSection(
  page: any,
  {
    title,
    items,
    left,
    cursorY,
    font,
    fontBold,
  }: {
    title: string;
    items: string[];
    left: number;
    cursorY: number;
    font: any;
    fontBold: any;
  },
) {
  if (cursorY < 120) return cursorY;

  page.drawText(`${title}:`, { x: left, y: cursorY, size: 11, font: fontBold, color: rgb(0.06, 0.08, 0.2) });
  cursorY -= 16;

  const list = items.length ? items : ["—"];
  for (const item of list.slice(0, 12)) {
    const lines = wrapText(item, 96);
    for (const l of lines.slice(0, 2)) {
      page.drawText(`• ${l}`, { x: left, y: cursorY, size: 10, font, color: rgb(0.06, 0.08, 0.2) });
      cursorY -= 14;
      if (cursorY < 120) return cursorY;
    }
  }

  cursorY -= 8;
  return cursorY;
}
