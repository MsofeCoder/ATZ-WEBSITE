import type { Metadata } from "next";
import LegalView from "@/components/pages/LegalView";
import { privacyMetadata } from "@/lib/page-meta";
import { LEGAL_LAST_UPDATED } from "@/lib/site";

export const metadata: Metadata = privacyMetadata("en");

export default function Page() {
  return <LegalView lang="en" doc="privacy" updated={LEGAL_LAST_UPDATED} />;
}
