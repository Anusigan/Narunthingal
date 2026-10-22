// Seniority order used to rank elected roles. jsonb doesn't keep key order,
// so the live screen sorts by this instead of by insertion order.
export const ROLE_ORDER = [
  "President",
  "Vice President",
  "Secretary",
  "Treasurer",
  "Project Coordinator",
  "Event Coordinator",
  "PR Head",
  "Editor",
];

export function roleRank(role: string): number {
  const i = ROLE_ORDER.findIndex((r) => r.toLowerCase() === role.trim().toLowerCase());
  return i === -1 ? ROLE_ORDER.length : i;
}

// Most senior role first
export function sortByRole<T extends [string, string]>(entries: T[]): T[] {
  return [...entries].sort((a, b) => roleRank(a[0]) - roleRank(b[0]) || a[0].localeCompare(b[0]));
}
