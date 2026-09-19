"use client";

import { useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import WhatsAppIcon from "@/components/icons/WhatsApp";

/** Scroll depth at which the button appears — past the hero's CTA row. */
const REVEAL_AT = 300;

/**
 * Floating WhatsApp action button, present on every page.
 *
 * Hidden while the visitor is at the top: the hero already offers WhatsApp
 * as a primary CTA, and a second green disc over the orbit scene was
 * clutter. It fades in once they have scrolled 300px, and out again on the
 * way back up. While hidden it is also out of the tab order and the
 * accessibility tree, so it cannot be "clicked" invisibly.
 *
 * `href` carries the locale's pre-filled opener — see `waLink`.
 */
export default function WhatsAppFab({ label, href }: { label: string; href: string }) {
  const { scrollY } = useScroll();
  const [shown, setShown] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setShown(y > REVEAL_AT));

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
      data-shown={shown}
      className={`text-navy-deep fixed right-5 bottom-5 z-40 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#25D366] shadow-xl transition-[opacity,transform,box-shadow] duration-300 ease-out hover:scale-105 hover:shadow-2xl md:right-6 md:bottom-6 ${
        shown ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <WhatsAppIcon size={26} />
    </a>
  );
}
