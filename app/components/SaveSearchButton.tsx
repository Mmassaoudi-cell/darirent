"use client";

import { useState } from "react";

export function SaveSearchButton({ filters }: { filters: Record<string, string> }) {
  const [message, setMessage] = useState("");
  async function save() {
    const response = await fetch("/api/saved-searches", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "My DariRent search", filters }),
    });
    const data = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Search saved. New-match alerts are ready." : data.error ?? "Unable to save");
  }
  return <div className="save-search"><button className="button button-secondary" type="button" onClick={save}>Save this search</button>{message && <small>{message}</small>}</div>;
}
