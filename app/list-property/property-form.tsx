"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ListPropertyForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const images = form.getAll("images");
    const payload = {
      title: form.get("title"), neighborhood: form.get("neighborhood"), city: form.get("city"),
      lat: Number(form.get("lat")), lng: Number(form.get("lng")), priceDt: Number(form.get("priceDt")),
      depositDt: Number(form.get("depositDt")), agencyFeeDt: Number(form.get("agencyFeeDt")), sizeM2: Number(form.get("sizeM2")),
      rooms: form.get("rooms"), furnished: form.get("furnished") === "on", parking: form.get("parking") === "on",
      elevator: form.get("elevator") === "on", description: form.get("description"), status: form.get("status"), phone: form.get("phone"),
    };
    const response = await fetch("/api/properties", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = (await response.json()) as { property?: { id: string }; error?: string };
    if (!response.ok || !data.property) { setBusy(false); return setError(data.error ?? "Unable to create listing"); }
    const validImages = images.filter((value): value is File => value instanceof File && value.size > 0);
    if (validImages.length) {
      const upload = new FormData(); validImages.forEach((image) => upload.append("images", image));
      const imageResponse = await fetch(`/api/properties/${data.property.id}/images`, { method: "POST", body: upload });
      if (!imageResponse.ok) setError("Listing created, but some photos could not be uploaded.");
    }
    router.push(`/listing/${data.property.id}`); router.refresh();
  }
  return <form className="workflow-form" onSubmit={submit}>
    <div className="form-section"><h2>1. Property</h2><label>Title<input required name="title" maxLength={100} placeholder="Bright furnished S+2" /></label><div className="form-grid"><label>Neighborhood<input required name="neighborhood" placeholder="El Aouina" /></label><label>City<input required name="city" defaultValue="Tunis" /></label><label>Rooms<select name="rooms" defaultValue="S+2"><option>S+0</option><option>S+1</option><option>S+2</option><option>S+3</option><option>S+4+</option></select></label><label>Size m²<input required name="sizeM2" type="number" min="10" max="5000" defaultValue="100" /></label></div><label>Description<textarea name="description" rows={4} maxLength={2000} placeholder="Describe the property without inventing amenities." /></label></div>
    <div className="form-section"><h2>2. Map position</h2><p className="form-help">Use an approximate public pin; do not expose a precise private entrance.</p><div className="form-grid"><label>Latitude<input required name="lat" type="number" step="any" defaultValue="36.86" /></label><label>Longitude<input required name="lng" type="number" step="any" defaultValue="10.27" /></label></div></div>
    <div className="form-section"><h2>3. Cost before contact</h2><div className="form-grid"><label>Monthly rent DT<input required name="priceDt" type="number" min="1" /></label><label>Deposit DT<input required name="depositDt" type="number" min="0" defaultValue="0" /></label><label>Agency fee DT<input required name="agencyFeeDt" type="number" min="0" defaultValue="0" /></label><label>WhatsApp phone<input required name="phone" inputMode="tel" placeholder="+216 22 000 000" /></label></div></div>
    <div className="form-section"><h2>4. Features and evidence</h2><div className="check-grid"><label><input name="furnished" type="checkbox" /> Furnished</label><label><input name="parking" type="checkbox" /> Parking</label><label><input name="elevator" type="checkbox" /> Elevator</label></div><label>Owner photos<input name="images" type="file" accept="image/*" multiple /></label></div>
    <div className="form-section"><h2>5. Visibility</h2><label>Status<select name="status" defaultValue="draft"><option value="draft">Save as draft</option><option value="published">Publish now</option></select></label><p className="form-help">Publishing creates a provisional score. Trust and condition improve only through real verification and inspection evidence.</p></div>
    {error && <p className="form-error">{error}</p>}<button className="button button-primary button-block" disabled={busy}>{busy ? "Saving securely…" : "Create listing"}</button>
  </form>;
}
