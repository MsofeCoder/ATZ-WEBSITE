import type { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import ContactPageComponent from "@/components/ContactPage";

export const metadata: Metadata = {
  title: "Wasiliana na ATZ Company Limited — Omba Ushauri",
  description:
    "Wasiliana na ATZ Company Limited. Ujumbe mmoja unafika kwa kampuni zote tatu — ubunifu, AI, au programu. Tutajibu ndani ya siku moja ya kazi.",
  alternates: {
    canonical: "/sw/contact",
    languages: { en: "/contact", sw: "/sw/contact" },
  },
};

export default function SwContactPage() {
  const dict = getDictionary("sw");
  return <ContactPageComponent dict={dict} lang="sw" />;
}
