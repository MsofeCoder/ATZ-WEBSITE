import type { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import HomePage from "@/components/HomePage";

export const metadata: Metadata = {
  title: "ATZ Company Limited — Maono Moja. Injini Tatu.",
  description:
    "ATZ Company Limited ni mtandao wa Kitanzania wa ubunifu, akili bandia, na code — Msofe Designer, Adam Intelligence, na Msofe Coder.",
};

export default function SwahiliPage() {
  const dict = getDictionary("sw");
  return <HomePage dict={dict} lang="sw" />;
}
