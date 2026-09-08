import type { Metadata } from "next";
import LegalView from "@/components/pages/LegalView";
import { termsMetadata } from "@/lib/page-meta";
import { LEGAL_LAST_UPDATED } from "@/lib/site";

export const metadata: Metadata = termsMetadata("sw");

export default function Page() {
  return <LegalView lang="sw" doc="terms" updated={LEGAL_LAST_UPDATED} />;
}
