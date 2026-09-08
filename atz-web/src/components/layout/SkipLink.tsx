/**
 * Keyboard-only escape hatch past the header. Visually hidden until focused,
 * which is the one case where it needs to be seen.
 */
export default function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      className="focus:bg-navy focus:font-display sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[300] focus:rounded-sm focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-white"
    >
      {label}
    </a>
  );
}
