import type { Lang } from "@/dictionaries";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://atzcompany.co.tz";

type SubOrg = { name: string; description: string; url: string };

const SUB_ORGS: Record<Lang, SubOrg[]> = {
  en: [
    {
      name: "Msofe Designer",
      description: "Creative studio — brand identity, logo, and web design.",
      url: "https://msofedesigner.blogspot.com/",
    },
    {
      name: "Adam Intelligence",
      description: "AI consultancy — prompt engineering, automation, and AI strategy.",
      url: "https://adamuintelligence.github.io/portfolio/",
    },
    {
      name: "Msofe Coder",
      description: "Development agency — web apps, ERP/CRM/POS, e-commerce.",
      url: "https://msofecoder.github.io/portfolio/",
    },
  ],
  sw: [
    {
      name: "Msofe Designer",
      description: "Studio ya ubunifu — nembo, utambulisho wa chapa, na muundo wa tovuti.",
      url: "https://msofedesigner.blogspot.com/",
    },
    {
      name: "Adam Intelligence",
      description: "Ushauri wa AI — maelekezo, automation, na mkakati wa AI.",
      url: "https://adamuintelligence.github.io/portfolio/",
    },
    {
      name: "Msofe Coder",
      description: "Shirika la programu — programu za wavuti, ERP/CRM/POS, na biashara mtandaoni.",
      url: "https://msofecoder.github.io/portfolio/",
    },
  ],
};

/** Builds Organization JSON-LD for the given locale. */
export function buildJsonLd(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ATZ Company Limited",
    url: SITE_URL,
    logo: `${SITE_URL}/ATZ_LOGO.png`,
    slogan:
      lang === "sw"
        ? "Kuwezesha Maono. Kujenga Mustakabali."
        : "Empowering Vision. Engineering the Future.",
    foundingDate: "2025",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Morogoro",
      addressCountry: "TZ",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+255794557333",
        contactType: "sales",
        availableLanguage: ["en", "sw"],
      },
    ],
    subOrganization: SUB_ORGS[lang],
  };
}
