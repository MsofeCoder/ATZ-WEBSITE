import type { Metadata } from "next";
import LegalView from "@/components/pages/LegalView";
import { privacyMetadata } from "@/lib/page-meta";
import { LEGAL_LAST_UPDATED } from "@/lib/site";

export const metadata: Metadata = privacyMetadata("sw");

export default function Page() {
  return <LegalView lang="sw" doc="privacy" updated={LEGAL_LAST_UPDATED} />;
}
