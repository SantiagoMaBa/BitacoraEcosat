import "server-only";

import crypto from "node:crypto";
import { getEvidenceBucket, getSupabaseAdmin } from "@/lib/storage/supabase";

export type StoredEvidence = {
  driver: "supabase" | "local";
  bucket?: string;
  objectKey?: string;
  localPath?: string;
  publicUrl?: string;
};

function sanitizeFilename(name: string) {
  return (name || "evidencia").replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

export async function storeEvidenceFile(params: {
  reportId: string;
  originalFilename: string;
  mime: string;
  bytes: Uint8Array;
}) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const bucket = getEvidenceBucket();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const rand = crypto.randomBytes(6).toString("hex").toUpperCase();
    const safeOriginal = sanitizeFilename(params.originalFilename);
    const objectKey = `${params.reportId}/${stamp}-${rand}-${safeOriginal}`;

    const upload = await supabase.storage.from(bucket).upload(objectKey, params.bytes, {
      contentType: params.mime || "application/octet-stream",
      upsert: false,
    });
    if (upload.error) throw new Error(upload.error.message);

    const pub = supabase.storage.from(bucket).getPublicUrl(objectKey);
    return {
      driver: "supabase" as const,
      bucket,
      objectKey,
      publicUrl: pub.data.publicUrl || undefined,
    };
  }

  // Local fallback (works locally; not suitable for Vercel).
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const baseDir = path.join(process.cwd(), ".data", "uploads", params.reportId);
  await fs.mkdir(baseDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const rand = crypto.randomBytes(6).toString("hex").toUpperCase();
  const safeOriginal = sanitizeFilename(params.originalFilename);
  const storedName = `${stamp}-${rand}-${safeOriginal}`;
  const storedPath = path.join(baseDir, storedName);
  await fs.writeFile(storedPath, params.bytes);

  return {
    driver: "local" as const,
    localPath: path.relative(process.cwd(), storedPath),
  };
}

export async function getEvidenceDownloadUrl(params: {
  bucket: string;
  objectKey: string;
  expiresInSeconds?: number;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase Storage not configured");

  const expiresIn = params.expiresInSeconds ?? 60;
  const signed = await supabase.storage.from(params.bucket).createSignedUrl(params.objectKey, expiresIn);
  if (signed.error) throw new Error(signed.error.message);
  return signed.data.signedUrl;
}
