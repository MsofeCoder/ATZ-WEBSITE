"use client";

import { useEffect } from "react";
import { WA_URL } from "@/lib/site";

/**
 * Last-resort boundary: catches errors thrown by a root layout itself, where
 * no locale shell exists. It must render its own <html>/<body>, and cannot
 * rely on the dictionary or on fonts having loaded — so the copy is inline
 * and bilingual.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error.digest ?? "", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8F9FA",
          color: "#1B2A4A",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0 }}>Something went wrong</h1>
          <p style={{ marginTop: "0.75rem", color: "#4A4A4A", lineHeight: 1.6 }}>
            An unexpected error stopped this page from loading. Please try again.
            <br />
            <span lang="sw">Kuna hitilafu imetokea. Tafadhali jaribu tena.</span>
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              background: "#1B2A4A",
              color: "#fff",
              border: 0,
              borderRadius: 3,
              padding: "0.85rem 1.5rem",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Try again / Jaribu tena
          </button>
          <p style={{ marginTop: "1.25rem" }}>
            <a href={WA_URL} style={{ color: "#8a7328", fontSize: "0.85rem" }}>
              WhatsApp +255 794 557 333
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
