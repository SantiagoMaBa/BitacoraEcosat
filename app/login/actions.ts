"use server";

import { redirect } from "next/navigation";
import { setDemoUserCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function loginAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, active: true },
  });

  if (!user || !user.active) redirect("/login");

  await setDemoUserCookie(user.id);
  redirect("/");
}
