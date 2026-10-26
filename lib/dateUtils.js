export function localISO(d) {
  const date = d instanceof Date ? d : new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function money(n) {
  return inrFormatter.format(n || 0);
}

// Salary cycle: 7th of selected month to 6th of following month
export function getCycleDates(yearMonthStr) {
  if (!yearMonthStr) return [];
  const [y, m] = yearMonthStr.split("-").map(Number);
  const d = new Date(y, m - 1, 7, 0, 0, 0);
  const end = new Date(y, m, 6, 0, 0, 0);
  const dates = [];

  while (d <= end) {
    dates.push(localISO(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

// Split cycle dates into weekly chunks ending on Sunday (day 0) or cycle end
export function buildWeeks(dates) {
  const weeks = [];
  let chunk = [];

  dates.forEach((d) => {
    chunk.push(d);
    const dt = new Date(d + "T00:00:00");
    if (dt.getDay() === 0 || d === dates[dates.length - 1]) {
      weeks.push([...chunk]);
      chunk = [];
    }
  });

  return weeks;
}

export function getCycleRangeLabel(dates) {
  if (!dates || !dates.length) return "Calculating...";
  const d1 = new Date(dates[0] + "T00:00:00");
  const d2 = new Date(dates[dates.length - 1] + "T00:00:00");
  const f1 = d1.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  const f2 = d2.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${f1} – ${f2}`;
}

export function getWeekLabel(weekDates, weekIndex) {
  if (!weekDates || !weekDates.length) return `Week ${weekIndex + 1}`;
  const first = new Date(weekDates[0] + "T00:00:00");
  const monthName = first.toLocaleString("default", { month: "short" }).toUpperCase();
  const yearNum = first.getFullYear();
  return `WK ${weekIndex + 1} • ${monthName} ${yearNum}`;
}
