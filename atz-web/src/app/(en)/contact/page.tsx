import type { Metadata } from "next";
import ContactView from "@/components/pages/ContactView";
import { contactMetadata } from "@/lib/page-meta";

export const metadata: Metadata = contactMetadata("en");

export default function Page() {
  return <ContactView lang="en" />;
}
