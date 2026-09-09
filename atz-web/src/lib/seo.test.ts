import { describe, it, expect } from "vitest";
import { jsonLdScript, buildOrganizationJsonLd, buildBreadcrumbJsonLd } from "./seo";

/** The two-character sequence backslash-u003c, built without escaping it here. */
const ESCAPED_LT = String.fromCharCode(92) + "u003c";

describe("jsonLdScript", () => {
  it("escapes < so a value cannot close the script element", () => {
    // This is the whole point of the function, and it silently did nothing for
    // a long time: the replacement was written as a JavaScript unicode escape,
    // which the JS parser resolves to "<" before `replace` ever runs — so it
    // substituted "<" for "<". A payload like this went through untouched.
    const out = jsonLdScript({ name: "ACME </script><img src=x onerror=alert(1)>" });

    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<");
    expect(out).toContain(ESCAPED_LT);
  });

  it("still round-trips to the original value", () => {
    const payload = { name: "Tools < Toys & Co", nested: { note: "a < b" } };
    expect(JSON.parse(jsonLdScript(payload))).toEqual(payload);
  });

  it("leaves payloads without angle brackets untouched", () => {
    const payload = { name: "ATZ Company Limited" };
    expect(jsonLdScript(payload)).toBe(JSON.stringify(payload));
  });

  it("produces script-safe output for the real Organization node", () => {
    const out = jsonLdScript(buildOrganizationJsonLd("en"));
    expect(out).not.toContain("<");
    expect(JSON.parse(out)["@type"]).toBe("Organization");
  });
});

describe("structured data", () => {
  it("lists all three subsidiaries, described in the requested locale", () => {
    const org = buildOrganizationJsonLd("sw");
    expect(org.subOrganization).toHaveLength(3);
    // Swahili copy, not the English fallback.
    expect(org.slogan).toBe("Kuwezesha Maono. Kujenga Mustakabali.");
    expect(org.url).toMatch(/\/sw$/);
  });

  it("numbers breadcrumb positions from 1", () => {
    const crumbs = buildBreadcrumbJsonLd("en", [
      { name: "ATZ", route: "/" },
      { name: "Contact", route: "/contact" },
    ]);
    expect(crumbs.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(crumbs.itemListElement[1]!.item).toMatch(/\/contact$/);
  });

  it("keeps Swahili breadcrumbs inside the Swahili tree", () => {
    const crumbs = buildBreadcrumbJsonLd("sw", [{ name: "ATZ", route: "/contact" }]);
    expect(crumbs.itemListElement[0]!.item).toMatch(/\/sw\/contact$/);
  });
});
