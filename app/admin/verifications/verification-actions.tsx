"use client";

import { useState } from "react";

export function VerificationActions({ id }: { id: string }) {
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function decide(action: "approve" | "reject") {
    setState("busy");
    setError("");
    const response = await fetch(`/api/verification/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, reviewNote: note }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Review could not be saved");
      setState("idle");
      return;
    }
    setState("done");
  }

  if (state === "done") return <p className="form-message">Review saved. Refresh to update the queue.</p>;
  return (
    <div className="verification-actions">
      <label>
        Review note
        <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div>
        <button className="button button-primary" disabled={state === "busy"} onClick={() => decide("approve")}>Approve</button>
        <button className="button button-secondary" disabled={state === "busy"} onClick={() => decide("reject")}>Reject</button>
      </div>
    </div>
  );
}
