"use client";

import { useRef } from "react";
import { money } from "../lib/dateUtils";

export default function Header({
  currentUser,
  totals,
  cloudStatus,
  cloudStatusText,
  onSyncCloud,
  theme,
  onToggleTheme,
  onExportCsv,
  onBackup,
  onRestoreFile,
  onOpenSidebar,
  onOpenSettings,
  onLogout,
}) {
  const fileInputRef = useRef(null);

  const handleRestoreClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onRestoreFile(file);
    }
    e.target.value = "";
  };

  return (
    <header>
      <div className="header-container">
        {/* Left: Brand */}
        <div className="brand-group">
          <div className="brand-icon-wrap">💸</div>
          <h1 className="brand-title">
            Chinmay&apos;s <span>Expense Tracker</span>
          </h1>
        </div>

        {/* Center: 4 Highlighted Metric / Insight Cards */}
        <div className="header-metrics" role="region" aria-label="Key Financial Insights">
          <div className="stat-chip chip-cycle" title="Total Cycle Spending">
            <div className="stat-chip-header">
              <span className="stat-chip-badge">CYCLE</span>
              <span className="stat-chip-label">Total Spend</span>
            </div>
            <span className="stat-chip-value">{money(totals.totalCycle)}</span>
          </div>

          <div className="stat-chip chip-week" title="Selected Week Subtotal">
            <div className="stat-chip-header">
              <span className="stat-chip-badge">WEEK</span>
              <span className="stat-chip-label">Active Week</span>
            </div>
            <span className="stat-chip-value">{money(totals.displayedWeek)}</span>
          </div>

          <div className="stat-chip chip-mom" title="Expenses marked on Mom's Account">
            <div className="stat-chip-header">
              <span className="stat-chip-badge">MOM</span>
              <span className="stat-chip-label">Mom&apos;s Share</span>
            </div>
            <span className="stat-chip-value">{money(totals.momAccount)}</span>
          </div>

          <div className="stat-chip chip-own" title="Expenses on Personal Account">
            <div className="stat-chip-header">
              <span className="stat-chip-badge">SELF</span>
              <span className="stat-chip-label">My Account</span>
            </div>
            <span className="stat-chip-value">{money(totals.myAccount)}</span>
          </div>
        </div>

        {/* Right: Sleek Compact Utility Actions */}
        <div className="header-actions">
          {/* Cloud Sync Status */}
          <button
            className={`btn-action btn-cloud ${cloudStatus}`}
            onClick={onSyncCloud}
            title={`Cloud Sync Status: ${cloudStatusText} (Click to re-sync)`}
            aria-label={`Cloud Sync: ${cloudStatusText}`}
          >
            <span className="cloud-dot"></span>
            <span className="cloud-text">{cloudStatus === "synced" ? "Synced" : cloudStatusText}</span>
          </button>

          {/* Theme Toggle */}
          <button
            className="btn-action btn-icon-only"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            <span>{theme === "dark" ? "☀️" : "🌙"}</span>
          </button>

          {/* Utility Tools Segment: CSV, Backup, Restore */}
          <div className="header-btn-cluster" role="group" aria-label="Data tools">
            {/* CSV Export */}
            <button
              className="btn-action btn-icon-only"
              onClick={onExportCsv}
              title="Export entries to CSV"
              aria-label="Export to CSV"
            >
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                width="16"
                height="16"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>

            {/* Backup */}
            <button
              className="btn-action btn-icon-only"
              onClick={onBackup}
              title="Save offline JSON backup"
              aria-label="Backup Data"
            >
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                width="16"
                height="16"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
            </button>

            {/* Restore */}
            <button
              className="btn-action btn-icon-only"
              onClick={handleRestoreClick}
              title="Restore data from JSON backup"
              aria-label="Restore Data"
            >
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                width="16"
                height="16"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            hidden
          />

          {/* User Badge */}
          {currentUser && (
            <div className="user-badge" title={`Signed in as ${currentUser}`}>
              <span className="user-badge-icon">👤</span>
              <span className="user-badge-name">{currentUser}</span>
            </div>
          )}

          {/* Logout */}
          {onLogout && (
            <button
              className="btn-action btn-logout btn-icon-only"
              onClick={onLogout}
              title={`Sign Out (${currentUser || "User"})`}
              aria-label="Sign Out"
            >
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                width="16"
                height="16"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          )}

          {/* Mobile Drawer Hamburger */}
          <button
            className="hamburger"
            onClick={onOpenSidebar}
            aria-label="Open Navigation Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
}
