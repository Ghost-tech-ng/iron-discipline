/** YYYY-MM-DD in the device's local timezone. Never use toISOString() for calendar dates — it is UTC. */
export function localIso(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Local date `days` days before today. */
export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return localIso(d);
}
