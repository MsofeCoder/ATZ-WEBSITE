import type { Dict } from "@/dictionaries";

/**
 * Three micro-trust claims that sit under a primary CTA. Each answers a
 * question a first-time visitor is silently asking before they click:
 * where are you, will I own the work, how fast will you answer.
 *
 * `tone` picks a palette for a dark (hero) or light (CTA band) ground.
 */
export default function TrustBadges({
  dict,
  tone = "dark",
  className = "",
}: {
  dict: Dict;
  tone?: "dark" | "light";
  className?: string;
}) {
  const items = [
    { icon: PinIcon, label: dict.trust.based },
    { icon: ShieldIcon, label: dict.trust.ownership },
    { icon: ClockIcon, label: dict.trust.response },
  ];
  const chip =
    tone === "dark"
      ? "border-white/10 bg-white/[0.04] text-white/70"
      : "border-navy-deep/15 bg-navy-deep/[0.05] text-navy-deep/80";
  const iconTone = tone === "dark" ? "text-gold-soft" : "text-navy-deep";

  return (
    <ul className={`flex flex-wrap items-center gap-x-2 gap-y-2 ${className}`}>
      {items.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className={`font-display inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold tracking-[0.06em] uppercase ${chip}`}
        >
          <Icon className={`h-3.5 w-3.5 ${iconTone}`} />
          {label}
        </li>
      ))}
    </ul>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
