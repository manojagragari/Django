/** Shared formatting so every screen renders money and dates identically. */

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const currencyPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("en-IN");

export function money(value, { precise = false } = {}) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "₹0";
  return precise ? currencyPrecise.format(amount) : currency.format(amount);
}

/** Compact form for chart axes and tight stat tiles. */
export function moneyShort(value) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "₹0";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

export function count(value) {
  return number.format(Number(value ?? 0));
}

export function percent(value, digits = 1) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "0%";
  return `${amount.toFixed(digits)}%`;
}

export function formatDate(value, { withTime = false } = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** "2 hours ago" style label for activity feeds. */
export function relativeTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";

  const units = [
    ["minute", 60],
    ["hour", 3600],
    ["day", 86400],
    ["week", 604800],
    ["month", 2629800],
    ["year", 31557600],
  ];

  let label = "minute";
  let divisor = 60;
  for (const [unit, unitSeconds] of units) {
    if (seconds < unitSeconds * (unit === "year" ? Infinity : 1) && seconds >= unitSeconds) {
      label = unit;
      divisor = unitSeconds;
    }
  }

  const amount = Math.floor(seconds / divisor);
  return `${amount} ${label}${amount === 1 ? "" : "s"} ago`;
}

/** Value for an <input type="date"> */
export function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export function todayInput() {
  return toDateInput(new Date());
}
