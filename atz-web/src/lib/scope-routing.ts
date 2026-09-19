/**
 * Routes a "Request a Consultation" click to the 30-second scope card when
 * it is on the page, and to the consultation dialog when it is not (the
 * contact and legal pages have no scope card).
 *
 * The scroll respects `prefers-reduced-motion`, and focus moves to the first
 * engine choice so a keyboard user lands *in* the tool rather than merely
 * near it. The card also gets a brief highlight so the eye finds it.
 */
export const SCOPE_ID = "scope-estimator";

export function goToScope(fallback: () => void): void {
  const el = document.getElementById(SCOPE_ID);
  if (!el) {
    fallback();
    return;
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  el.classList.remove("scope-flash");
  // Restart the animation even if it is mid-flight.
  void el.offsetWidth;
  el.classList.add("scope-flash");
  window.setTimeout(
    () => {
      el.querySelector<HTMLElement>('[role="radio"]')?.focus({ preventScroll: true });
    },
    reduced ? 0 : 650
  );
}
