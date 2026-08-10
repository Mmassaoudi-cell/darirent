export type Locale = "fr" | "ar" | "en";

export function readLocale(value: string | string[] | undefined): Locale {
  const locale = Array.isArray(value) ? value[0] : value;
  return locale === "ar" || locale === "en" ? locale : "fr";
}

export const copy = {
  fr: {
    rent: "Louer",
    inspect: "État guidé",
    list: "Publier un bien",
    headline: "Votre prochain chez-vous en Tunisie.",
    subhead: "Inspecté. Comparé. Compris.",
    search: "Rechercher des locations",
    searchPlaceholder: "Quartier, ville ou besoin…",
    inspectCta: "Capturer l’état d’une location",
    costs: "Coûts transparents",
    evidence: "État documenté",
    price: "Prix expliqué",
    map: "Carte réelle",
    whatsapp: (title: string, neighborhood: string) => `Bonjour, je vous contacte via DariRent au sujet de ${title} à ${neighborhood}.`,
  },
  ar: {
    rent: "للإيجار",
    inspect: "توثيق الحالة",
    list: "انشر عقارك",
    headline: "دارك الجاية في تونس.",
    subhead: "موثقة. مقارنة. مفهومة.",
    search: "ابحث عن كراء",
    searchPlaceholder: "الحي أو المدينة أو احتياجاتك…",
    inspectCta: "وثّق حالة المسكن",
    costs: "تكاليف واضحة",
    evidence: "حالة موثّقة",
    price: "سعر مفسّر",
    map: "خريطة حقيقية",
    whatsapp: (title: string, neighborhood: string) => `مرحباً، أتواصل معكم عبر DariRent بخصوص ${title} في ${neighborhood}.`,
  },
  en: {
    rent: "Rent",
    inspect: "Guided condition",
    list: "List a property",
    headline: "Your next home in Tunisia.",
    subhead: "Inspected. Compared. Understood.",
    search: "Search rentals",
    searchPlaceholder: "Neighborhood, city, or need…",
    inspectCta: "Capture a rental's condition",
    costs: "Transparent costs",
    evidence: "Condition evidence",
    price: "Explained pricing",
    map: "Real map",
    whatsapp: (title: string, neighborhood: string) => `Hello, I am contacting you through DariRent about ${title} in ${neighborhood}.`,
  },
} as const;
