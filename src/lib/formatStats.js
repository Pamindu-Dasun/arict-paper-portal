export function formatActiveStudentsDisplay(value) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return "0+";
  return `${n.toLocaleString("en-US")}+`;
}
