import type { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import HomePage from "@/components/HomePage";
import { buildJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "ATZ Company Limited — Maono Moja. Injini Tatu.",
  description:
    "ATZ Company Limited ni mtandao wa Kitanzania wa ubunifu, akili bandia, na code — Msofe Designer, Adam Intelligence, na Msofe Coder.",
  alternates: {
    canonical: "/sw",
    languages: { en: "/", sw: "/sw" },
  },
  openGraph: {
    title: "ATZ Company Limited — Maono Moja. Injini Tatu.",
    description:
      "Mtandao wa Kitanzania wa ubunifu, akili bandia, na code. Kuwezesha maono. Kujenga mustakabali.",
    images: ["/ATZ_LOGO.png"],
    type: "website",
    locale: "sw_TZ",
    alternateLocale: "en_US",
  },
};

export default function SwahiliPage() {
  const dict = getDictionary("sw");
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd("sw")) }}
      />
      <HomePage dict={dict} lang="sw" />
    </>
  );
}
