export type ExternalOffer = {
  id: string;
  title: string;
  location: string;
  priceDt: number;
  sizeM2?: number;
  rooms: string;
  features: string[];
  source: "Mubawab";
  sourceUrl: string;
};

// Public offer summaries collected from the linked source pages on 12 August 2026.
// Availability and details can change; DariRent never treats these as verified inventory.
export const externalOffers: ExternalOffer[] = [
  {
    id: "mubawab-8397659",
    title: "Appartement moderne à La Manouba",
    location: "La Manouba",
    priceDt: 800,
    sizeM2: 57,
    rooms: "S+1",
    features: ["Garage", "Ascenseur", "Chauffage central"],
    source: "Mubawab",
    sourceUrl: "https://www.mubawab.tn/fr/a/8397659/location-d-un-appartement-%C3%A0-la-manouba-surface-totale-57-m%C2%B2-double-vitrage-et-chauffage-central",
  },
  {
    id: "mubawab-8386035",
    title: "Appartement S2 haut standing à Manouba",
    location: "La Manouba",
    priceDt: 1100,
    rooms: "S+2",
    features: ["Résidence", "Cuisine équipée"],
    source: "Mubawab",
    sourceUrl: "https://www.mubawab.tn/fr/a/8386035/a-louer-appartement-s2-hst-%C3%A0-manouba",
  },
  {
    id: "mubawab-8391334",
    title: "Studio meublé à La Fayette",
    location: "La Fayette, Tunis",
    priceDt: 950,
    sizeM2: 40,
    rooms: "Studio",
    features: ["Meublé", "Climatisation", "Chauffage central"],
    source: "Mubawab",
    sourceUrl: "https://www.mubawab.tn/fr/a/8391334/studio-en-location",
  },
  {
    id: "mubawab-8397700",
    title: "S1 au Centre Urbain Nord",
    location: "Centre Urbain Nord, Tunis",
    priceDt: 1250,
    rooms: "S+1",
    features: ["Appartement"],
    source: "Mubawab",
    sourceUrl: "https://www.mubawab.tn/fr/a/8397700/%C3%A0-louer-s1-au-centre-urbain-nord",
  },
  {
    id: "mubawab-8395675",
    title: "Appartement S2 au Centre Urbain Nord",
    location: "Centre Urbain Nord, Tunis",
    priceDt: 2100,
    rooms: "S+2",
    features: ["Appartement"],
    source: "Mubawab",
    sourceUrl: "https://www.mubawab.tn/fr/a/8395675/location-d-un-appartement-s2-au-centre-urbain-nord",
  },
  {
    id: "mubawab-8396106",
    title: "S2 meublé à AFH Mrezga",
    location: "AFH Mrezga, Nabeul",
    priceDt: 1400,
    rooms: "S+2",
    features: ["Meublé", "Location annuelle"],
    source: "Mubawab",
    sourceUrl: "https://www.mubawab.tn/fr/a/8396106/location-annuelle-s2-meubl%C3%A9-%C3%A0-afh-mrezga",
  },
  {
    id: "mubawab-8398205",
    title: "S1 meublé à AFH Mrezga",
    location: "AFH Mrezga, Nabeul",
    priceDt: 750,
    rooms: "S+1",
    features: ["Meublé", "Location annuelle"],
    source: "Mubawab",
    sourceUrl: "https://www.mubawab.tn/fr/a/8398205/location-annuelle-app-s1-meubl%C3%A9-%C3%A0-afh-mrezga",
  },
  {
    id: "mubawab-8396479",
    title: "Appartement à El Mourouj 2",
    location: "El Mourouj 2",
    priceDt: 750,
    rooms: "Appartement",
    features: ["Longue durée"],
    source: "Mubawab",
    sourceUrl: "https://www.mubawab.tn/fr/a/8396479/appartement-a-el-mourouj-2",
  },
];

export const externalOffersCollectedAt = "2026-08-12";
