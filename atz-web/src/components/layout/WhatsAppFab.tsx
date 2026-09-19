import WhatsAppIcon from "@/components/icons/WhatsApp";

/** Floating WhatsApp action button, present on every page. `href` carries the locale's pre-filled opener. */
export default function WhatsAppFab({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="text-navy-deep fixed right-5 bottom-5 z-40 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#25D366] shadow-xl transition hover:scale-105 hover:shadow-2xl md:right-6 md:bottom-6"
    >
      <WhatsAppIcon size={26} />
    </a>
  );
}
