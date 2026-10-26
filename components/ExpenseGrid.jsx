"use client";

import { useMemo, useState } from "react";
import { money } from "../lib/dateUtils";

export default function ExpenseGrid({
  categories,
  entries,
  momCells,
  remarks = {},
  weekDates,
  todayISO,
  mobileStartIndex,
  onShiftMobileDate,
  onUpdateAmount,
  onUpdateRemark,
  onToggleMomCell,
  onRenameCategory,
  searchQuery,
}) {
  const [activeCellKey, setActiveCellKey] = useState(null);

  const visibleIndices = useMemo(() => {
    return [mobileStartIndex, mobileStartIndex + 1, mobileStartIndex + 2].filter(
      (i) => i < weekDates.length
    );
  }, [mobileStartIndex, weekDates.length]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const q = searchQuery.trim().toLowerCase();
    return categories.filter((c) => c.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  // Excel-like Keyboard Navigation:
  // Enter -> Down, Shift+Enter -> Up
  // Tab -> Right, Shift+Tab -> Left
  const handleKeyDown = (e) => {
    if (!e.target.matches("input.amount")) return;

    const row = parseInt(e.target.getAttribute("data-row"), 10);
    const col = parseInt(e.target.getAttribute("data-col"), 10);
    const numRows = filteredCategories.length;
    const numCols = weekDates.length;

    let targetRow = row;
    let targetCol = col;

    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift + Enter: Move Up (previous row in same column)
        targetRow = Math.max(0, row - 1);
      } else {
        // Enter: Move Down (next row in same column)
        targetRow = Math.min(numRows - 1, row + 1);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift + Tab: Move Left (previous column)
        if (col > 0) {
          targetCol = col - 1;
        } else if (row > 0) {
          targetRow = row - 1;
          targetCol = numCols - 1;
        }
      } else {
        // Tab: Move Right (next column)
        if (col < numCols - 1) {
          targetCol = col + 1;
        } else if (row < numRows - 1) {
          targetRow = row + 1;
          targetCol = 0;
        }
      }
    } else {
      return;
    }

    const nextInput = document.querySelector(
      `table#grid input.amount[data-row="${targetRow}"][data-col="${targetCol}"]`
    );
    if (nextInput) {
      nextInput.focus();
      nextInput.select?.();
    }
  };

  // Grand total for the displayed week
  const weekGrandTotal = useMemo(() => {
    return weekDates.reduce((weekSum, d) => {
      return (
        weekSum +
        categories.reduce((catSum, cat) => {
          return catSum + (Number(entries[`${cat}|${d}`]) || 0);
        }, 0)
      );
    }, 0);
  }, [weekDates, categories, entries]);

  return (
    <div className="table-container" onKeyDown={handleKeyDown}>
      <table id="grid">
        {/* Table Header */}
        <thead>
          <tr>
            <th className="cat-col">Category</th>
            {weekDates.map((d, i) => {
              const dt = new Date(d + "T00:00:00");
              const isToday = d === todayISO;
              const isMobileVisible = visibleIndices.includes(i);
              const dateStr = `${dt.getDate()} ${dt.toLocaleString("default", {
                weekday: "short",
              })}`;

              return (
                <th
                  key={d}
                  className={`day-col ${isToday ? "today" : ""} ${
                    isMobileVisible ? "mobile-active" : ""
                  }`}
                >
                  <span className="desktop-date">{dateStr}</span>
                  <div className="mobile-date-wrapper">
                    {i === visibleIndices[0] ? (
                      <button
                        className="m-nav-btn m-prev"
                        onClick={() => onShiftMobileDate(-1)}
                        aria-label="Previous day"
                      >
                        &lt;
                      </button>
                    ) : (
                      <span className="spacer"></span>
                    )}

                    <span>{dateStr}</span>

                    {i === visibleIndices[visibleIndices.length - 1] ? (
                      <button
                        className="m-nav-btn m-next"
                        onClick={() => onShiftMobileDate(1)}
                        aria-label="Next day"
                      >
                        &gt;
                      </button>
                    ) : (
                      <span className="spacer"></span>
                    )}
                  </div>
                </th>
              );
            })}
            <th>Week Total</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {filteredCategories.map((cat, catIdx) => {
            let catWeekTotal = 0;

            return (
              <tr key={cat}>
                <td className="cat-col">
                  <input
                    className="cat-edit"
                    type="text"
                    defaultValue={cat}
                    key={cat}
                    onBlur={(e) => onRenameCategory(cat, e.target.value)}
                    placeholder="Category Name"
                  />
                </td>

                {weekDates.map((d, dayIdx) => {
                  const key = `${cat}|${d}`;
                  const amt = entries[key] || "";
                  const isMom = Boolean(momCells[key]);
                  const isToday = d === todayISO;
                  const isMobileVisible = visibleIndices.includes(dayIdx);
                  const isCellActive = activeCellKey === key;
                  const hasRemark = Boolean(remarks[key]);

                  if (amt) catWeekTotal += Number(amt);

                  return (
                    <td
                      key={key}
                      className={`day-col ${isMom ? "mom-active" : ""} ${
                        isToday ? "today" : ""
                      } ${isMobileVisible ? "mobile-active" : ""} ${
                        isCellActive ? "cell-selected" : ""
                      }`}
                    >
                      <div
                        className={`cell-wrapper ${isCellActive ? "active" : ""}`}
                        onBlur={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget)) {
                            setActiveCellKey(null);
                          }
                        }}
                      >
                        {/* Note indicator triangle/badge if remark exists */}
                        {hasRemark && (
                          <div
                            className="cell-note-flag"
                            title={`Note: ${remarks[key]}`}
                            onClick={() => {
                              setActiveCellKey(key);
                              const input = document.querySelector(
                                `input.amount[data-key="${key}"]`
                              );
                              if (input) input.focus();
                            }}
                          ></div>
                        )}

                        <label
                          className="mom-check-wrap"
                          title="Toggle Mom's Account"
                        >
                          <input
                            type="checkbox"
                            className="mom-check"
                            checked={isMom}
                            onChange={() => onToggleMomCell(key)}
                            tabIndex={-1}
                          />
                        </label>

                        <input
                          type="number"
                          className="amount"
                          value={amt}
                          onChange={(e) => onUpdateAmount(key, e.target.value)}
                          onFocus={() => setActiveCellKey(key)}
                          data-row={catIdx}
                          data-col={dayIdx}
                          data-key={key}
                          min="0"
                          step="0.01"
                          placeholder="—"
                        />

                        {/* Floating Remarks Popover: Only visible when this cell is active */}
                        {isCellActive && (
                          <div
                            className="cell-remark-popover"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className="cell-remark-inner">
                              <svg
                                width="12"
                                height="12"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                className="cell-remark-icon"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2.5"
                                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                />
                              </svg>
                              <input
                                type="text"
                                className="cell-remark-input"
                                placeholder="Add remark / note..."
                                value={remarks[key] || ""}
                                onChange={(e) =>
                                  onUpdateRemark(key, e.target.value)
                                }
                                onFocus={() => setActiveCellKey(key)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === "Escape") {
                                    e.preventDefault();
                                    const input = document.querySelector(
                                      `input.amount[data-key="${key}"]`
                                    );
                                    if (input) input.focus();
                                  }
                                }}
                              />
                              {remarks[key] && (
                                <button
                                  type="button"
                                  className="cell-remark-clear"
                                  onClick={() => onUpdateRemark(key, "")}
                                  title="Clear note"
                                  tabIndex={-1}
                                >
                                  &times;
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}

                <td className="row-total-cell">
                  {catWeekTotal > 0 ? money(catWeekTotal) : "—"}
                </td>
              </tr>
            );
          })}

          {filteredCategories.length === 0 && (
            <tr>
              <td
                colSpan={weekDates.length + 2}
                style={{
                  textAlign: "center",
                  padding: "32px",
                  color: "var(--muted)",
                }}
              >
                No matching categories found for &quot;{searchQuery}&quot;
              </td>
            </tr>
          )}
        </tbody>

        {/* Table Footer */}
        <tfoot>
          <tr>
            <td className="cat-col" style={{ fontWeight: 700 }}>
              Daily Total
            </td>
            {weekDates.map((d, i) => {
              const dTotal = categories.reduce(
                (sum, cat) => sum + (Number(entries[`${cat}|${d}`]) || 0),
                0
              );
              const isToday = d === todayISO;
              const isMobileVisible = visibleIndices.includes(i);

              return (
                <td
                  key={d}
                  style={{ fontWeight: 700 }}
                  className={`day-col ${isToday ? "today" : ""} ${
                    isMobileVisible ? "mobile-active" : ""
                  }`}
                >
                  {dTotal ? money(dTotal) : "—"}
                </td>
              );
            })}
            <td className="grand-total-cell">{money(weekGrandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
