import { headers } from "next/headers";
import { jsonLdScript } from "@/lib/seo";

/**
 * Renders one or more schema.org nodes as a JSON-LD script tag.
 *
 * Reads the nonce minted by the middleware so this inline script satisfies a
 * `script-src` that no longer allows `'unsafe-inline'`.
 */
export default async function JsonLd({ data }: { data: unknown }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // Serialised via jsonLdScript, which escapes `<` so a value can never
      // break out of the script element.
      dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }}
    />
  );
}
