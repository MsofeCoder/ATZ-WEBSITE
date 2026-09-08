import { ogImage } from "@/lib/og";

/**
 * Open Graph card for the en tree, at a stable URL.
 *
 * A file-based `opengraph-image` was tried first, but Next only merges it at
 * the segment that declares it: any deeper page exporting its own
 * `openGraph` object (which every page here does, for per-route titles) lost
 * the image entirely. A plain route gives every page one URL to point at.
 */
export const dynamic = "force-static";

export function GET() {
  return ogImage("en");
}
