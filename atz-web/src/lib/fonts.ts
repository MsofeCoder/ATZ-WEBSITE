/**
 * Font loading, in one place.
 *
 * Weights are pruned to those actually rendered — every extra weight is
 * another file on the critical path, and this audience is largely on mobile
 * data. `display: swap` keeps text visible during the font fetch.
 */
import { Montserrat, Open_Sans, Playfair_Display } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-open-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const fontClassNames = [montserrat.variable, openSans.variable, playfair.variable].join(" ");
