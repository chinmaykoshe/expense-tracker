"use client";

import { money } from "../lib/dateUtils";

export default function MobileSidebar({
  isOpen,
  onClose,
  totals,
  onExportCsv,
  onBackup,
  onRestore,
  onOpenSettings,
  onLogout,
}) {
  return (
    <>
      <div
        className={`overlay ${isOpen ? "active" : ""}`}
        onClick={onClose}
      ></div>

      <div className={`sidebar ${isOpen ? "active" : ""}`}>
        <div className="sb-header">
          <h2>Dashboard &amp; Tools</h2>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            &times;
          </button>
        </div>

        <div className="sb-content">
          <div className="sb-section-title">Cycle Overview</div>
          <div className="sb-mobile-stats">
            <div className="stat-chip chip-cycle" style={{ minWidth: "100%" }}>
              <div className="stat-chip-header">
                <span className="stat-chip-dot"></span>
                <span className="stat-chip-label">Total (Cycle)</span>
              </div>
              <span className="stat-chip-value">
                {money(totals.totalCycle)}
              </span>
            </div>

            <div className="stat-chip chip-week" style={{ minWidth: "100%" }}>
              <div className="stat-chip-header">
                <span className="stat-chip-dot"></span>
                <span className="stat-chip-label">Displayed Week</span>
              </div>
              <span className="stat-chip-value">
                {money(totals.displayedWeek)}
              </span>
            </div>

            <div className="stat-chip chip-mom" style={{ minWidth: "100%" }}>
              <div className="stat-chip-header">
                <span className="stat-chip-dot"></span>
                <span className="stat-chip-label">Mom&apos;s Account</span>
              </div>
              <span className="stat-chip-value">
                {money(totals.momAccount)}
              </span>
            </div>

            <div className="stat-chip chip-own" style={{ minWidth: "100%" }}>
              <div className="stat-chip-header">
                <span className="stat-chip-dot"></span>
                <span className="stat-chip-label">My Account</span>
              </div>
              <span className="stat-chip-value">
                {money(totals.myAccount)}
              </span>
            </div>
          </div>

          <div className="sb-section-title" style={{ marginTop: 16 }}>
            Quick Actions
          </div>
          <div className="sb-actions">
            <button
              onClick={() => {
                onExportCsv();
                onClose();
              }}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export CSV Spreadsheet
            </button>

            <button
              onClick={() => {
                onBackup();
                onClose();
              }}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Download JSON Backup
            </button>

            <button
              onClick={() => {
                onRestore();
                onClose();
              }}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Restore JSON Data
            </button>

            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                style={{ color: "#ef4444" }}
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
