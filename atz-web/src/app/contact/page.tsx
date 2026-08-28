import type { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import ContactPageComponent from "@/components/ContactPage";

export const metadata: Metadata = {
  title: "Contact ATZ Company Limited — Request a Consultation",
  description:
    "Get in touch with ATZ Company Limited. One message reaches all three companies — design, AI, or development. We reply within one business day.",
  alternates: {
    canonical: "/contact",
    languages: { en: "/contact", sw: "/sw/contact" },
  },
};

export default function ContactPage() {
  const dict = getDictionary("en");
  return <ContactPageComponent dict={dict} lang="en" />;
}
