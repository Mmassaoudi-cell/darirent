export type Locale = "fr" | "ar" | "en";

export function readLocale(value: string | string[] | undefined): Locale {
  const locale = Array.isArray(value) ? value[0] : value;
  return locale === "ar" || locale === "en" ? locale : "fr";
}

export const copy = {
  fr: {
    rent: "Louer",
    inspect: "Inspecter",
    list: "Publier un bien",
    headline: "Votre prochain chez-vous en Tunisie.",
    subhead: "Inspecté. Comparé. Compris.",
    search: "Rechercher des locations",
    searchPlaceholder: "Quartier, ville ou besoin…",
    inspectCta: "Inspecter une location avec l’IA",
    costs: "Coûts transparents",
    evidence: "État documenté",
    price: "Prix expliqué",
    map: "Carte réelle",
  },
  ar: {
    rent: "للكراء",
    inspect: "فحص المسكن",
    list: "انشر عقارك",
    headline: "دارك الجاية في تونس.",
    subhead: "مفحوصة. مقارنة. مفهومة.",
    search: "ابحث عن كراء",
    searchPlaceholder: "الحي أو المدينة أو احتياجاتك…",
    inspectCta: "افحص مسكناً بالذكاء الاصطناعي",
    costs: "تكاليف واضحة",
    evidence: "حالة موثّقة",
    price: "سعر مفسّر",
    map: "خريطة حقيقية",
  },
  en: {
    rent: "Rent",
    inspect: "Inspect",
    list: "List a property",
    headline: "Your next home in Tunisia.",
    subhead: "Inspected. Compared. Understood.",
    search: "Search rentals",
    searchPlaceholder: "Neighborhood, city, or need…",
    inspectCta: "Inspect a rental with AI",
    costs: "Transparent costs",
    evidence: "Condition evidence",
    price: "Explained pricing",
    map: "Real map",
  },
} as const;
