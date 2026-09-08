import type { Metadata, Viewport } from "next";
import LocaleShell from "@/components/layout/LocaleShell";
import { SITE_URL } from "@/lib/env";
import { homeMetadata } from "@/lib/page-meta";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...homeMetadata("sw"),
  title: {
    default: homeMetadata("sw").title as string,
    template: "%s",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0E1730",
  colorScheme: "light",
};

export default function swRootLayout({ children }: { children: React.ReactNode }) {
  return <LocaleShell lang="sw">{children}</LocaleShell>;
}
