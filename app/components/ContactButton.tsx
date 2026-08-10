"use client";

import { useState } from "react";

export function ContactButton({ propertyId, disabled }: { propertyId: string; disabled?: boolean }) {
  const [error, setError] = useState("");
  async function contact() {
    setError("");
    const response = await fetch("/api/contact", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ propertyId }),
    });
    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) return setError(data.error ?? "Contact unavailable");
    window.open(data.url, "_blank", "noopener,noreferrer");
  }
  return <div><button className="button button-whatsapp" type="button" onClick={contact} disabled={disabled}>Contact on WhatsApp</button>{error && <p className="form-error">{error}</p>}</div>;
}
