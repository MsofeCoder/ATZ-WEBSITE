import { getDictionary } from "@/dictionaries";
import HomePage from "@/components/HomePage";
import { buildJsonLd } from "@/lib/seo";

export default function Page() {
  const dict = getDictionary("en");
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd("en")) }}
      />
      <HomePage dict={dict} lang="en" />
    </>
  );
}
