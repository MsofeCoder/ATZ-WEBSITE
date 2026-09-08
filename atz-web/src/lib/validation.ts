/**
 * Lead form schema — shared by the client (pre-flight check) and the API route
 * (authoritative validation). One definition means the two can never drift.
 */
import { z } from "zod";

/** Kept as a plain regex so the client can validate a field without zod. */
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

const trimmed = (max: number) => z.string().trim().max(max);

export const leadSchema = z.object({
  name: z.string().trim().min(2, "name_too_short").max(120),
  email: z.string().trim().max(254).regex(EMAIL_RE, "invalid_email"),
  company: trimmed(200).default(""),
  phone: trimmed(50).default(""),
  service: trimmed(120).default(""),
  budget: trimmed(60).default(""),
  timeline: trimmed(60).default(""),
  message: trimmed(5000).default(""),
  locale: z.enum(["en", "sw"]).default("en"),
  /** Honeypot — any value means a bot filled a field humans cannot see. */
  _gotcha: z.string().max(500).optional(),
  /**
   * How long the form was open before submission, in milliseconds, measured
   * entirely on the client.
   *
   * This used to be an absolute client timestamp that the server subtracted
   * from its own `Date.now()` — two different clocks. A visitor whose device
   * ran a few minutes fast produced a negative difference, tripped the
   * too-fast bot filter, and had their enquiry silently discarded behind a
   * success screen. An elapsed duration cancels skew out entirely.
   */
  _elapsed: z.coerce.number().int().nonnegative().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

/** A validated lead plus server-assigned metadata. */
export type Lead = Omit<LeadInput, "_gotcha" | "_elapsed"> & {
  id: string;
  receivedAt: string;
};

/** Bots typically submit within a second of the DOM appearing. */
export const MIN_FILL_MS = 1_500;
