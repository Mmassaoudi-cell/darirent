"use client";

import { useEffect } from "react";

export function ViewTracker({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/properties/${propertyId}?track=1`, {
      cache: "no-store",
      signal: controller.signal,
    }).catch(() => undefined);
    return () => controller.abort();
  }, [propertyId]);
  return null;
}
