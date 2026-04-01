import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { structureReport } from "@/lib/ai";

export const runtime = "nodejs";

const bodySchema = z.object({
  rawText: z.string().trim().min(4),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const structured = await structureReport(parsed.data.rawText);
  return NextResponse.json(structured);
}

