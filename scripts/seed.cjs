/* eslint-disable no-console */
const fs = require("node:fs");
const dotenv = require("dotenv");
if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
} else {
  dotenv.config();
}
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function ensureUser({ name, email, role, supervisorId }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: { name, email, role, supervisorId },
  });
}

async function ensureClientWithBranches({ name, branches }) {
  const existing = await prisma.client.findFirst({ where: { name } });
  if (existing) {
    const existingBranches = await prisma.branch.findMany({ where: { clientId: existing.id } });
    for (const b of branches) {
      const found = existingBranches.find((eb) => eb.name === b.name);
      if (!found) {
        await prisma.branch.create({ data: { clientId: existing.id, name: b.name, location: b.location } });
      }
    }
    const finalBranches = await prisma.branch.findMany({ where: { clientId: existing.id }, orderBy: { name: "asc" } });
    return { ...existing, branches: finalBranches };
  }

  const created = await prisma.client.create({
    data: {
      name,
      branches: { create: branches },
    },
    include: { branches: true },
  });
  return created;
}

async function ensureTechBranchLink(technicianId, branchId) {
  await prisma.technicianBranch.upsert({
    where: { technicianId_branchId: { technicianId, branchId } },
    update: {},
    create: { technicianId, branchId },
  });
}

async function ensureReportSeed({ folio, technicianId, supervisorId, clientId, branchId, serviceType, status, rawText, summary, structured }) {
  const existing = await prisma.report.findUnique({ where: { folio } });
  if (existing) return existing;
  return prisma.report.create({
    data: {
      folio,
      technicianId,
      supervisorId,
      clientId,
      branchId,
      serviceType,
      status,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 60 * 60 * 1000),
      rawText,
      summary,
      structured,
    },
  });
}

async function main() {
  const supervisor = await ensureUser({
    name: "Daniela Mendez",
    email: "supervisor@ecosat.demo",
    role: "SUPERVISOR",
  });

  const admin = await ensureUser({
    name: "Admin Ecosat",
    email: "admin@ecosat.demo",
    role: "ADMIN",
  });

  const technician = await ensureUser({
    name: "Eduardo Ibarra",
    email: "tecnico@ecosat.demo",
    role: "TECHNICIAN",
    supervisorId: supervisor.id,
  });

  const clientsSpec = [
    {
      name: "Farmacias del Norte",
      branches: [
        { name: "Division del Norte 201", location: "Chihuahua, CHIH" },
        { name: "Sucursal Aeropuerto", location: "Chihuahua, CHIH" },
      ],
    },
    {
      name: "McDonalds",
      branches: [
        { name: "Plaza Centro", location: "Chihuahua, CHIH" },
        { name: "Periferico", location: "Chihuahua, CHIH" },
      ],
    },
    {
      name: "Emerson",
      branches: [
        { name: "Planta Norte", location: "Chihuahua, CHIH" },
        { name: "Planta Sur", location: "Chihuahua, CHIH" },
      ],
    },
    {
      name: "CarneMart",
      branches: [
        { name: "Sucursal 1", location: "Chihuahua, CHIH" },
        { name: "Sucursal 2", location: "Chihuahua, CHIH" },
      ],
    },
    {
      name: "Chamberlain",
      branches: [
        { name: "Oficinas", location: "Chihuahua, CHIH" },
        { name: "Almacen", location: "Chihuahua, CHIH" },
      ],
    },
  ];

  const createdClients = [];
  for (const spec of clientsSpec) {
    const c = await ensureClientWithBranches(spec);
    createdClients.push(c);
  }

  // Link technician to first branch of each client for demo capture.
  for (const c of createdClients) {
    if (c.branches && c.branches[0]) {
      await ensureTechBranchLink(technician.id, c.branches[0].id);
    }
  }

  // Seed a report per client to make dashboard usable.
  const baseRaw =
    "Llegue al sitio, revise el equipo y realice pruebas. Se detecto una falla intermitente. Queda pendiente cambiar una refaccion. Compre material para el siguiente servicio.";
  for (const c of createdClients) {
    const b = c.branches[0];
    const folio = `BT-SEED-${c.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 10).toUpperCase()}`;
    await ensureReportSeed({
      folio,
      technicianId: technician.id,
      supervisorId: supervisor.id,
      clientId: c.id,
      branchId: b.id,
      serviceType: "Servicio en sitio",
      status: "READY_FOR_SIGNATURE",
      rawText: baseRaw,
      summary: "Servicio registrado. Revisar pendientes y compras.",
      structured: {
        actividades: ["Revision de equipos", "Pruebas operativas"],
        hallazgos: ["Falla intermitente detectada"],
        pendientes: ["Cambiar refaccion pendiente"],
        compras: ["Material para siguiente servicio"],
        recomendaciones: ["Agendar visita de seguimiento"],
        resumen: "Servicio registrado. Revisar pendientes y compras.",
      },
    });
  }

  console.log("Seed complete:");
  console.log("- admin:", admin.email);
  console.log("- supervisor:", supervisor.email);
  console.log("- tecnico:", technician.email);
  console.log("- clients:", createdClients.map((c) => c.name).join(", "));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
