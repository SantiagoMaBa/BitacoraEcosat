import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 400 });

  const form = await request.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }
  const audioFile: File = audio;

  const client = new OpenAI({ apiKey });
  const primary = (process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1").trim();
  const fallback = (process.env.OPENAI_TRANSCRIBE_MODEL_FALLBACK || "").trim();

  async function run(model: string) {
    return client.audio.transcriptions.create({
      file: audioFile,
      model,
      language: "es",
    });
  }

  let transcription: any;
  try {
    transcription = await run(primary);
  } catch {
    if (!fallback) throw new Error("Transcription failed");
    transcription = await run(fallback);
  }

  const text = String(transcription.text ?? "").trim();
  return NextResponse.json({ text });
}
