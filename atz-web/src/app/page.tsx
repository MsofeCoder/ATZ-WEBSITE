import { getDictionary } from "@/dictionaries";
import HomePage from "@/components/HomePage";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ATZ Company Limited",
  url: "https://atzcompany.co.tz",
  logo: "https://atzcompany.co.tz/ATZ_LOGO.png",
  slogan: "Empowering Vision. Engineering the Future.",
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
  subOrganization: [
    {
      "@type": "Organization",
      name: "Msofe Designer",
      description: "Creative studio — brand identity, logo, and web design.",
      url: "https://msofedesigner.blogspot.com/",
    },
    {
      "@type": "Organization",
      name: "Adam Intelligence",
      description: "AI consultancy — prompt engineering, automation, and AI strategy.",
      url: "https://adamuintelligence.github.io/portfolio/",
    },
    {
      "@type": "Organization",
      name: "Msofe Coder",
      description: "Development agency — web apps, ERP/CRM/POS, e-commerce.",
      url: "https://msofecoder.github.io/portfolio/",
    },
  ],
};

export default function Page() {
  const dict = getDictionary("en");
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePage dict={dict} lang="en" />
    </>
  );
}
