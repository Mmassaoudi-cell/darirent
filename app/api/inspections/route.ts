import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { inspectionMedia, inspections, properties } from "../../../db/schema";
import { apiError, unauthorized } from "../../lib/api";
import { upsertCurrentUser } from "../../lib/current-user";

export const dynamic = "force-dynamic";
const requiredRooms = ["entrance", "living", "kitchen", "bedroom", "bathroom", "windows", "floors"];

async function sha256(file: File) {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  try {
    const current = await upsertCurrentUser();
    if (!current) return unauthorized();
    const form = await request.formData();
    const propertyId = String(form.get("propertyId") ?? "");
    const disclaimerAck = form.get("disclaimerAck") === "true" || form.get("disclaimerAck") === "on";
    if (!propertyId || !disclaimerAck) {
      return Response.json({ error: "Property and disclaimer acknowledgement are required" }, { status: 400 });
    }
    const db = getDb();
    const [property] = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
    if (!property) return Response.json({ error: "Property not found" }, { status: 404 });

    const captured = new Map<string, File>();
    for (const [name, value] of form.entries()) {
      if (name.startsWith("photo_") && value instanceof File && value.size > 0) {
        const room = name.slice(6);
        if (requiredRooms.includes(room) && value.type.startsWith("image/") && value.size <= 10_000_000) {
          captured.set(room, value);
        }
      }
    }
    if (!captured.size) return Response.json({ error: "Capture at least one required area" }, { status: 400 });
    const coveragePct = Math.round((captured.size / requiredRooms.length) * 100);
    const findings = {
      rooms: requiredRooms.map((room) => ({
        room,
        status: captured.has(room) ? "captured" : "missing",
        coverage: captured.has(room) ? 100 : 0,
      })),
      issues: [] as Array<{ room: string; label: string; confidence: number; recommendation: string }>,
    };
    const inspectionId = crypto.randomUUID();
    await db.insert(inspections).values({
      id: inspectionId,
      propertyId,
      uploaderId: current.id,
      coveragePct,
      aiFindings: findings,
      disclaimerAck: true,
      modelVersion: "coverage-rules-v1",
    });
    for (const [room, file] of captured) {
      const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
      const objectKey = `inspections/${inspectionId}/${room}-${crypto.randomUUID()}.${extension}`;
      const digest = await sha256(file);
      await env.UPLOADS.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type } });
      await db.insert(inspectionMedia).values({
        id: crypto.randomUUID(),
        inspectionId,
        room,
        objectKey,
        sha256: digest,
      });
    }
    return Response.json({
      inspection: { id: inspectionId, propertyId, coveragePct, findings, modelVersion: "coverage-rules-v1" },
      limitation: "Visual AI is observational. It does not replace structural, electrical, plumbing, safety, or mold inspection.",
    }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
