import { describe, it, expect } from "vitest";
import { localePath, stripLocale, langFromPathname, sectionHref } from "./site";

describe("localePath", () => {
  it("leaves English at the root", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/contact")).toBe("/contact");
    expect(localePath("en", "/privacy")).toBe("/privacy");
  });

  it("prefixes Swahili", () => {
    expect(localePath("sw", "/")).toBe("/sw");
    expect(localePath("sw", "/contact")).toBe("/sw/contact");
    expect(localePath("sw", "/privacy")).toBe("/sw/privacy");
  });

  it("defaults to the home route", () => {
    expect(localePath("en")).toBe("/");
    expect(localePath("sw")).toBe("/sw");
  });

  it("tolerates a path without a leading slash", () => {
    expect(localePath("en", "contact")).toBe("/contact");
    expect(localePath("sw", "contact")).toBe("/sw/contact");
  });
});

describe("stripLocale", () => {
  it("removes the Swahili prefix", () => {
    expect(stripLocale("/sw")).toBe("/");
    expect(stripLocale("/sw/contact")).toBe("/contact");
    expect(stripLocale("/sw/privacy")).toBe("/privacy");
  });

  it("leaves English paths alone", () => {
    expect(stripLocale("/")).toBe("/");
    expect(stripLocale("/contact")).toBe("/contact");
  });

  it("does not strip a path that merely starts with the letters sw", () => {
    expect(stripLocale("/swahili-guide")).toBe("/swahili-guide");
  });
});

describe("langFromPathname", () => {
  it("detects the locale from a pathname", () => {
    expect(langFromPathname("/")).toBe("en");
    expect(langFromPathname("/contact")).toBe("en");
    expect(langFromPathname("/sw")).toBe("sw");
    expect(langFromPathname("/sw/contact")).toBe("sw");
  });

  it("does not treat /swahili-guide as Swahili", () => {
    expect(langFromPathname("/swahili-guide")).toBe("en");
  });
});

describe("round trip", () => {
  it("re-prefixing a stripped path returns the original", () => {
    for (const path of ["/", "/contact", "/privacy", "/terms"]) {
      expect(localePath("en", stripLocale(localePath("en", path)))).toBe(localePath("en", path));
      expect(localePath("sw", stripLocale(localePath("sw", path)))).toBe(localePath("sw", path));
    }
  });
});

describe("sectionHref", () => {
  it("anchors within the current locale's home page", () => {
    expect(sectionHref("en", "ecosystem")).toBe("/#ecosystem");
    expect(sectionHref("sw", "ecosystem")).toBe("/sw#ecosystem");
    expect(sectionHref("sw", "values")).toBe("/sw#values");
  });
});
