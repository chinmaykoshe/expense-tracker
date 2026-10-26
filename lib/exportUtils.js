export function exportToCsv(state, dates, cycleMonth) {
  const cats = state.categories || [];
  const rows = [
    ["Category", "Date", "Amount INR", "Account", "Remarks"],
    ...cats.flatMap((cat) =>
      dates
        .map((d) => {
          const key = `${cat}|${d}`;
          const amt = Number(state.entries[key]) || 0;
          const account = state.momCells[key] ? "Mom's account" : "My account";
          const remark = state.remarks?.[key] || "";
          return [cat, d, amt, account, remark];
        })
        .filter((r) => r[2] > 0 || r[4])
    ),
  ];

  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chinmay-expenses-${cycleMonth || "export"}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToJsonBackup(state, todayISO) {
  const data = {
    categories: state.categories,
    entries: state.entries,
    momCells: state.momCells,
    remarks: state.remarks || {},
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chinmay-expense-backup-${todayISO || "backup"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseJsonBackup(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || !parsed.entries || !Array.isArray(parsed.categories)) {
    throw new Error("Invalid backup format: missing categories or entries");
  }
  return {
    categories: parsed.categories,
    entries: parsed.entries,
    momCells: parsed.momCells || {},
    remarks: parsed.remarks || {},
  };
}
