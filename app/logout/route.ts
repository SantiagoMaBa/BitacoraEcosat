import { NextResponse } from "next/server";
import { clearDemoUserCookie } from "@/lib/auth";

export async function GET(request: Request) {
  await clearDemoUserCookie();
  return NextResponse.redirect(new URL("/login", request.url));
}
