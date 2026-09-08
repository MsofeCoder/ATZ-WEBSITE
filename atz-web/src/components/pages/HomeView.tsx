import { getDictionary, type Lang } from "@/dictionaries";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo";
import JsonLd from "@/components/layout/JsonLd";
import HomeSections from "@/components/sections/HomeSections";

/** The home page for one locale. Server-rendered apart from the hero. */
export default function HomeView({ lang }: { lang: Lang }) {
  const dict = getDictionary(lang);
  return (
    <>
      <JsonLd data={[buildOrganizationJsonLd(lang), buildWebSiteJsonLd(lang)]} />
      <HomeSections dict={dict} lang={lang} />
    </>
  );
}
