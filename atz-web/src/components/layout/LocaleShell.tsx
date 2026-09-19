import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getDictionary, type Lang } from "@/dictionaries";
import { ConsultationProvider } from "@/components/providers/ConsultationProvider";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import WhatsAppFab from "@/components/layout/WhatsAppFab";
import SkipLink from "@/components/layout/SkipLink";
import CustomCursor from "@/components/CustomCursor";
import MotionProvider from "@/components/motion/MotionProvider";
import { fontClassNames } from "@/lib/fonts";
import { waLink } from "@/lib/site";
import "@/app/globals.css";

/**
 * The complete document for one locale.
 *
 * Each locale has its own root layout (`app/(en)` and `app/(sw)`) so that
 * `<html lang>` is correct in the server-rendered HTML rather than being
 * patched by an effect after hydration — crawlers, screen readers and
 * translation tooling all read the initial markup.
 */
export default function LocaleShell({ lang, children }: { lang: Lang; children: ReactNode }) {
  const dict = getDictionary(lang);
  return (
    <html lang={dict.meta.htmlLang} suppressHydrationWarning>
      <body className={fontClassNames}>
        <SkipLink label={dict.a11y.skipToContent} />
        <MotionProvider>
          <ConsultationProvider dict={dict}>
            <SiteHeader dict={dict} lang={lang} />
            <main id="main" tabIndex={-1}>
              {children}
            </main>
            <SiteFooter dict={dict} lang={lang} />
            <WhatsAppFab label={dict.a11y.whatsapp} href={waLink(dict.wa.general)} />
          </ConsultationProvider>
        </MotionProvider>
        <CustomCursor />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
