"use client";

export type SendState = "idle" | "sending" | "sent";

/**
 * The consultation form's submit button, with a three-state animation:
 *
 *   idle     — label + paper plane; on hover the button lifts a touch, the
 *              plane tilts to 45° and an animated gold gradient ring appears
 *   sending  — the plane flies off to the right and shrinks away
 *   sent     — a checkmark drops in from scale(4) beside the "Sent" label
 *
 * It stays a plain `<button type="submit">` whose accessible name is the
 * visible label, so forms, screen readers and the e2e suite see nothing
 * unusual. Styles live in globals.css under `.send-btn`.
 */
export default function SendButton({
  state,
  labels,
  className = "",
}: {
  state: SendState;
  labels: Record<SendState, string>;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={state !== "idle"}
      data-state={state}
      aria-live="polite"
      className={`send-btn font-display ${className}`}
    >
      <span className="send-btn__label">{labels[state]}</span>

      {/* Paper plane — hidden from AT; the label carries the meaning. */}
      <svg
        className="send-btn__plane"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M22 2L11 13" />
        <path d="M22 2L15 22l-4-9-9-4 20-7z" />
      </svg>

      {/* Checkmark — scales in when the request has landed. */}
      <svg
        className="send-btn__check"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </button>
  );
}
