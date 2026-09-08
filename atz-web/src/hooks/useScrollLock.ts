"use client";

import { useEffect } from "react";

/**
 * Ref-counted body scroll lock.
 *
 * Several overlays can be open at once (the consultation modal on top of the
 * hero drawer, say). A naive `overflow = ""` on unmount would unlock the page
 * while another overlay is still showing, so locks are counted and the
 * original style is restored only when the last one releases.
 *
 * The scrollbar width is replaced with padding so locking does not shift the
 * layout on desktop.
 */
let locks = 0;
let previousOverflow = "";
let previousPaddingRight = "";

function acquire() {
  if (locks === 0) {
    const { body } = document;
    previousOverflow = body.style.overflow;
    previousPaddingRight = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    body.style.overflow = "hidden";
  }
  locks += 1;
}

function release() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    document.body.style.overflow = previousOverflow;
    document.body.style.paddingRight = previousPaddingRight;
  }
}

/** Locks body scroll while `active` is true. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    acquire();
    return release;
  }, [active]);
}

/** Test seam. */
export function __lockCount() {
  return locks;
}
