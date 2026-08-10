export type PropertyInput = {
  title: string;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
  priceDt: number;
  depositDt: number;
  agencyFeeDt: number;
  sizeM2: number;
  rooms: string;
  furnished: boolean;
  parking: boolean;
  elevator: boolean;
  description: string;
  status: "draft" | "published" | "rented" | "archived";
};

function asText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function asNumber(value: unknown, minimum: number, maximum: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) return null;
  return number;
}

export function parsePropertyInput(value: unknown):
  | { ok: true; data: PropertyInput }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "Invalid property payload" };
  const input = value as Record<string, unknown>;
  const title = asText(input.title, 100);
  const neighborhood = asText(input.neighborhood, 80);
  const city = asText(input.city, 80) || "Tunis";
  const rooms = asText(input.rooms, 12);
  const description = asText(input.description, 2000);
  const lat = asNumber(input.lat, 30, 38);
  const lng = asNumber(input.lng, 7, 12);
  const priceDt = asNumber(input.priceDt, 1, 100000);
  const depositDt = asNumber(input.depositDt ?? 0, 0, 300000);
  const agencyFeeDt = asNumber(input.agencyFeeDt ?? 0, 0, 300000);
  const sizeM2 = asNumber(input.sizeM2, 10, 5000);
  const statusValues = ["draft", "published", "rented", "archived"] as const;
  const status = statusValues.includes(input.status as (typeof statusValues)[number])
    ? (input.status as PropertyInput["status"])
    : "draft";

  if (!title || !neighborhood || !rooms) return { ok: false, error: "Title, neighborhood, and rooms are required" };
  if (lat === null || lng === null) return { ok: false, error: "Coordinates must be within Tunisia" };
  if (priceDt === null || sizeM2 === null || depositDt === null || agencyFeeDt === null) {
    return { ok: false, error: "Price, size, and fee values are invalid" };
  }

  return {
    ok: true,
    data: {
      title,
      neighborhood,
      city,
      lat,
      lng,
      priceDt: Math.round(priceDt),
      depositDt: Math.round(depositDt),
      agencyFeeDt: Math.round(agencyFeeDt),
      sizeM2: Math.round(sizeM2),
      rooms,
      furnished: Boolean(input.furnished),
      parking: Boolean(input.parking),
      elevator: Boolean(input.elevator),
      description,
      status,
    },
  };
}

export function canEditProperty(
  currentUserId: string,
  propertyOwnerId: string,
  role: "renter" | "owner" | "admin",
) {
  return role === "admin" || currentUserId === propertyOwnerId;
}

export type PropertyFilters = {
  minPrice?: number;
  maxPrice?: number;
  rooms?: string;
  neighborhood?: string;
  furnished?: boolean;
  verifiedOnly?: boolean;
  page: number;
  pageSize: number;
};

export function parseFilters(url: URL): PropertyFilters {
  const readNumber = (name: string) => {
    const raw = url.searchParams.get(name);
    if (!raw) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  };
  return {
    minPrice: readNumber("minPrice"),
    maxPrice: readNumber("maxPrice"),
    rooms: asText(url.searchParams.get("rooms"), 12) || undefined,
    neighborhood: asText(url.searchParams.get("neighborhood"), 80) || undefined,
    furnished: url.searchParams.get("furnished") === "true" ? true : undefined,
    verifiedOnly: url.searchParams.get("verifiedOnly") === "true" ? true : undefined,
    page: Math.max(1, Math.floor(readNumber("page") ?? 1)),
    pageSize: Math.min(24, Math.max(1, Math.floor(readNumber("pageSize") ?? 9))),
  };
}
