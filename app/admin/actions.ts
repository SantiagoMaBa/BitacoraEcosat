"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

const createClientSchema = z.object({
  name: z.string().trim().min(2),
});

export async function createClientAction(formData: FormData) {
  await requireAdmin();
  const payload = createClientSchema.safeParse({
    name: String(formData.get("name") ?? ""),
  });
  if (!payload.success) redirect("/admin");
  await prisma.client.create({ data: { name: payload.data.name } });
  redirect("/admin");
}

const createBranchSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().trim().min(2),
  location: z.string().trim().optional(),
});

export async function createBranchAction(formData: FormData) {
  await requireAdmin();
  const payload = createBranchSchema.safeParse({
    clientId: String(formData.get("clientId") ?? ""),
    name: String(formData.get("name") ?? ""),
    location: String(formData.get("location") ?? "").trim() || undefined,
  });
  if (!payload.success) redirect("/admin");

  await prisma.branch.create({
    data: {
      clientId: payload.data.clientId,
      name: payload.data.name,
      location: payload.data.location,
    },
  });

  redirect("/admin");
}

const createUserSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  role: z.enum(["ADMIN", "SUPERVISOR", "TECHNICIAN"]),
  supervisorId: z.string().optional(),
});

export async function createUserAction(formData: FormData) {
  await requireAdmin();
  const payload = createUserSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
    supervisorId: String(formData.get("supervisorId") ?? "").trim() || undefined,
  });
  if (!payload.success) redirect("/admin");

  await prisma.user.create({
    data: {
      name: payload.data.name,
      email: payload.data.email,
      role: payload.data.role,
      supervisorId: payload.data.role === "TECHNICIAN" ? payload.data.supervisorId : undefined,
    },
  });

  redirect("/admin");
}

const assignTechSchema = z.object({
  technicianId: z.string().min(1),
  supervisorId: z.string().min(1),
});

export async function assignTechnicianAction(formData: FormData) {
  await requireAdmin();
  const payload = assignTechSchema.safeParse({
    technicianId: String(formData.get("technicianId") ?? ""),
    supervisorId: String(formData.get("supervisorId") ?? ""),
  });
  if (!payload.success) redirect("/admin");

  await prisma.user.update({
    where: { id: payload.data.technicianId },
    data: { supervisorId: payload.data.supervisorId },
  });

  redirect("/admin");
}

const linkBranchSchema = z.object({
  technicianId: z.string().min(1),
  branchId: z.string().min(1),
});

export async function linkTechnicianBranchAction(formData: FormData) {
  await requireAdmin();
  const payload = linkBranchSchema.safeParse({
    technicianId: String(formData.get("technicianId") ?? ""),
    branchId: String(formData.get("branchId") ?? ""),
  });
  if (!payload.success) redirect("/admin");

  await prisma.technicianBranch.upsert({
    where: { technicianId_branchId: { technicianId: payload.data.technicianId, branchId: payload.data.branchId } },
    update: {},
    create: { technicianId: payload.data.technicianId, branchId: payload.data.branchId },
  });

  redirect("/admin");
}

