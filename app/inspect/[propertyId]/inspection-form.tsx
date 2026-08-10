"use client";

import { useState } from "react";
const rooms = [["entrance", "Entrance"], ["living", "Living room"], ["kitchen", "Kitchen"], ["bedroom", "Bedrooms"], ["bathroom", "Bathroom"], ["windows", "Windows and doors"], ["floors", "Floors and ceilings"]] as const;

export function InspectionForm({ propertyId }: { propertyId: string }) {
  const [result, setResult] = useState<{ coveragePct: number; findings: { rooms: Array<{ room: string; status: string }> } } | null>(null);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget); form.set("propertyId", propertyId);
    const response = await fetch("/api/inspections", { method: "POST", body: form });
    const data = (await response.json()) as { inspection?: typeof result; error?: string };
    setBusy(false); if (!response.ok || !data.inspection) return setError(data.error ?? "Inspection could not be submitted"); setResult(data.inspection);
  }
  if (result) return <section className="coverage-result"><div className="large-score">{result.coveragePct}%</div><h2>Inspection coverage</h2><ul>{result.findings.rooms.map((room) => <li key={room.room} className={room.status === "captured" ? "captured" : "missing"}>{room.room}<strong>{room.status}</strong></li>)}</ul><p>No defect diagnosis was generated: this beta performs coverage and evidence integrity checks only.</p></section>;
  return (
    <form className="inspection-form" onSubmit={submit}>
      {rooms.map(([key, roomLabel], index) => (
        <div className="capture-row" key={key}>
          <label htmlFor={`photo_${key}`}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <strong>{roomLabel}</strong>
            <small>Wide, clear view · up to 10 MB</small>
          </label>
          <input
            id={`photo_${key}`}
            name={`photo_${key}`}
            type="file"
            accept="image/*"
            capture="environment"
          />
        </div>
      ))}
      <label className="consent-check" htmlFor="disclaimerAck">
        <input id="disclaimerAck" required name="disclaimerAck" type="checkbox" />
        I understand the visual-analysis limitation and consent to processing these images for this inspection.
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="button button-primary button-block" disabled={busy}>
        {busy ? "Creating evidence record…" : "Submit inspection"}
      </button>
    </form>
  );
}
