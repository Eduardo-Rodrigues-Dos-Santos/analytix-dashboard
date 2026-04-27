export type FormatApiNumberOptions = {
  locale?: string;
  useGrouping?: boolean;
};

/**
 * Formats a number coming from the API without forcing rounding.
 *
 * Note: JSON numbers do not preserve trailing zeros (e.g. 1.2300 becomes 1.23).
 * If you need to display *exact* scale as produced by the backend, the API must
 * return the value as a string.
 */
export function displayApiScalar(value: unknown): string {
  if (value === null || value === undefined) return "0";
  if (typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "0";
  return String(value);
}

export function formatApiNumber(
  value: unknown,
  { locale = "pt-BR", useGrouping = true }: FormatApiNumberOptions = {},
): string {
  if (value === null || value === undefined) return "0";
  if (typeof value === "string") return value;

  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "0";

  // Use a high maxFractionDigits to avoid rounding while keeping locale formatting.
  return n.toLocaleString(locale, {
    useGrouping,
    maximumFractionDigits: 20,
  });
}


export function parseApiNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    // API should use dot as decimal separator. If not, fall back to replacing comma.
    const normalized = value.trim().replace(",", ".");
    const n = Number.parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}


export function formatFixedNumber(
  value: unknown,
  fractionDigits: number,
  locale: string = "pt-BR",
): string {
  const n = parseApiNumber(value);
  return n.toLocaleString(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}


export function displayApiDecimal(value: unknown, fractionDigits: number): string {
  if (typeof value === "string") return value;
  return formatFixedNumber(value, fractionDigits);
}
