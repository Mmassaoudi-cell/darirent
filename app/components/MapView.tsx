"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

type MapProperty = { id: string; title: string; neighborhood: string; lat: number; lng: number; priceDt: number };

export function MapView({ properties }: { properties: MapProperty[] }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      center: [10.27, 36.86],
      zoom: 11.3,
      style: {
        version: 8,
        sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    for (const property of properties) {
      const marker = document.createElement("a");
      marker.className = "map-price-marker";
      marker.href = `/listing/${property.id}`;
      marker.textContent = `${property.priceDt.toLocaleString("fr-TN")} DT`;
      marker.setAttribute("aria-label", `${property.title}, ${property.priceDt} DT`);
      new maplibregl.Marker({ element: marker, anchor: "bottom" }).setLngLat([property.lng, property.lat])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setText(`${property.title} · ${property.neighborhood}`)).addTo(map);
    }
    return () => map.remove();
  }, [properties]);
  return <div ref={container} className="real-map" aria-label="Interactive rental map of Greater Tunis" />;
}
