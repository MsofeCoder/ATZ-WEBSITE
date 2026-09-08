import type { Metadata } from "next";
import HomeView from "@/components/pages/HomeView";
import { homeMetadata } from "@/lib/page-meta";

export const metadata: Metadata = homeMetadata("sw");

export default function Page() {
  return <HomeView lang="sw" />;
}
