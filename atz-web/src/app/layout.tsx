import type { Metadata } from "next";
import { Montserrat, Open_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});
const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://atzcompany.co.tz"),
  title: "ATZ Company Limited — One Vision. Three Engines.",
  description:
    "ATZ Company Limited is a Tanzanian brand ecosystem across design, AI, and code — Msofe Designer, Adam Intelligence, and Msofe Coder, working as one under a single standard of craft.",
  alternates: { canonical: "/", languages: { en: "/", sw: "/sw" } },
  openGraph: {
    title: "ATZ Company Limited — One Vision. Three Engines.",
    description:
      "A Tanzanian brand ecosystem across design, AI, and code. Empowering vision. Engineering the future.",
    images: ["/ATZ_LOGO.png"],
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${openSans.variable} ${playfair.variable}`}
        data-lang-setter
      >
        {children}
      </body>
    </html>
  );
}
