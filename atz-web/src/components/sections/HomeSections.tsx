import type { Dict, Lang } from "@/dictionaries";
import Hero from "@/components/Hero";
import Ecosystem from "@/components/Ecosystem";
import Approach from "@/components/sections/Approach";
import { FounderQuoteAndValues } from "@/components/FounderQuote";
import CtaBand from "@/components/CtaBand";

/**
 * The home page, in order.
 *
 * This used to be a client component holding one `activeCard` value, so that
 * clicking a satellite in the hero could scroll down and expand the matching
 * card. That fought the hero's own drawer — one click opened a modal *and*
 * scrolled the page 882px behind it — so the satellite now answers in place
 * and the shared state is gone. Everything here is a server component again
 * except the two sections that genuinely need the client.
 */
export default function HomeSections({ dict, lang }: { dict: Dict; lang: Lang }) {
  return (
    <>
      <Hero dict={dict} />
      <Ecosystem dict={dict} />
      <Approach dict={dict} />
      <FounderQuoteAndValues dict={dict} lang={lang} />
      <CtaBand dict={dict} />
    </>
  );
}
