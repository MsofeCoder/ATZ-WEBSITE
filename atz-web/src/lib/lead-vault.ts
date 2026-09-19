/**
 * Client-side safety net for consultation requests.
 *
 * Every submission is written to `localStorage` *before* the network call and
 * updated with the outcome afterwards, so a lead survives a dropped
 * connection, a 5xx, or an unconfigured backend. The vault is capped and
 * only ever read on this device; it is a recovery aid, not a datastore.
 */

export const LEAD_VAULT_KEY = "atz:leads";
const CAP = 25;

export type VaultStatus = "pending" | "sent" | "dev" | "failed";

export interface VaultedLead {
  id: string;
  submittedAt: string;
  status: VaultStatus;
  /** Server-assigned id once the API accepted it. */
  serverId?: string;
  fields: Record<string, string>;
}

function read(): VaultedLead[] {
  try {
    const raw = window.localStorage.getItem(LEAD_VAULT_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? (list as VaultedLead[]) : [];
  } catch {
    return [];
  }
}

function write(list: VaultedLead[]) {
  try {
    window.localStorage.setItem(LEAD_VAULT_KEY, JSON.stringify(list.slice(-CAP)));
  } catch {
    // Private mode / quota — nothing to do; the network path still runs.
  }
}

/** Records a submission as pending and returns its local id. */
export function vaultLead(fields: Record<string, string>): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const list = read();
  list.push({ id, submittedAt: new Date().toISOString(), status: "pending", fields });
  write(list);
  return id;
}

export function markLead(id: string, status: VaultStatus, serverId?: string) {
  const list = read();
  const hit = list.find((l) => l.id === id);
  if (!hit) return;
  hit.status = status;
  if (serverId) hit.serverId = serverId;
  write(list);
}

/** Leads on this device that never reached a real backend. */
export function undeliveredLeads(): VaultedLead[] {
  return read().filter((l) => l.status !== "sent");
}
