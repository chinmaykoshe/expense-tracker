"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { THEME_KEY, AUTH_KEY } from "../lib/constants";
import { useExpenseState } from "../hooks/useExpenseState";
import { useSalaryCycle } from "../hooks/useSalaryCycle";
import {
  exportToCsv,
  exportToJsonBackup,
  parseJsonBackup,
} from "../lib/exportUtils";

import Header from "../components/Header";
import Toolbar from "../components/Toolbar";
import WeekNav from "../components/WeekNav";
import ExpenseGrid from "../components/ExpenseGrid";
import ChartsSection from "../components/ChartsSection";
import MobileSidebar from "../components/MobileSidebar";
import LoginPage from "../components/LoginPage";
import Toast from "../components/Toast";

export default function DashboardPage() {
  // Toast state
  const [toastMsg, setToastMsg] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 2400);
  }, []);

  // Authentication state
  const [currentUser, setCurrentUser] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_KEY);
      if (savedUser) {
        setCurrentUser(savedUser);
        setIsAuthenticated(true);
      }
    } catch (e) {}
    setAuthChecked(true);
  }, []);

  // Expense and Cloud state (scoped to currentUser)
  const {
    state,
    isLoaded,
    cloudStatus,
    cloudStatusText,
    updateAmount,
    updateRemark,
    toggleMomCell,
    renameCategory,
    restoreState,
    syncCloudNow,
  } = useExpenseState(showToast, currentUser);

  // Salary cycle & week navigation
  const {
    cycleMonth,
    setCycleMonth,
    cycleDates,
    cycleRangeLabel,
    weeks,
    currentWeekIndex,
    currentWeekDates,
    weekLabel,
    mobileStartIndex,
    todayISO,
    prevMonth,
    nextMonth,
    prevWeek,
    nextWeek,
    jumpToToday,
    shiftMobileDate,
  } = useSalaryCycle(showToast);

  // Theme state
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      const isSystemDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = saved || (isSystemDark ? "dark" : "light");
      setTheme(initial);
      if (initial === "dark") {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
    } catch (e) {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (next === "dark") {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {}
      showToast(next === "dark" ? "Dark theme enabled" : "Light theme enabled");
      return next;
    });
  }, [showToast]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  const handleLoginSuccess = useCallback(
    (user) => {
      try {
        localStorage.setItem(AUTH_KEY, user);
      } catch (e) {}
      setCurrentUser(user);
      setIsAuthenticated(true);
      showToast(`Welcome, ${user}!`);
    },
    [showToast]
  );

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch (e) {}
    setCurrentUser("");
    setIsAuthenticated(false);
    showToast("Signed out successfully");
  }, [showToast]);

  // Modals & Drawers
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Totals calculations
  const totals = useMemo(() => {
    let totalCycle = 0;
    let displayedWeek = 0;
    let momAccount = 0;
    let myAccount = 0;

    const wkSet = new Set(currentWeekDates);

    cycleDates.forEach((d) => {
      state.categories.forEach((cat) => {
        const k = `${cat}|${d}`;
        const amt = Number(state.entries[k]) || 0;
        if (amt > 0) {
          totalCycle += amt;
          if (state.momCells[k]) {
            momAccount += amt;
          } else {
            myAccount += amt;
          }
          if (wkSet.has(d)) {
            displayedWeek += amt;
          }
        }
      });
    });

    return { totalCycle, displayedWeek, momAccount, myAccount };
  }, [cycleDates, currentWeekDates, state.categories, state.entries, state.momCells]);

  // Category counts
  const filteredCount = useMemo(() => {
    if (!searchQuery) return state.categories.length;
    const q = searchQuery.trim().toLowerCase();
    return state.categories.filter((c) => c.toLowerCase().includes(q)).length;
  }, [state.categories, searchQuery]);

  // Export handlers
  const handleExportCsv = useCallback(() => {
    exportToCsv(state, cycleDates, cycleMonth);
    showToast("CSV Exported successfully!");
  }, [state, cycleDates, cycleMonth, showToast]);

  const handleBackup = useCallback(() => {
    exportToJsonBackup(state, todayISO);
    showToast("Backup saved to file!");
  }, [state, todayISO, showToast]);

  const handleRestoreFile = useCallback(
    async (file) => {
      try {
        const parsed = await parseJsonBackup(file);
        restoreState(parsed);
      } catch (err) {
        showToast("Invalid backup file.");
      }
    },
    [restoreState, showToast]
  );

  if (!authChecked) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <Toast message={toastMsg} isVisible={isToastVisible} />
      </>
    );
  }

  return (
    <>
      <Header
        currentUser={currentUser}
        totals={totals}
        cloudStatus={cloudStatus}
        cloudStatusText={cloudStatusText}
        onSyncCloud={syncCloudNow}
        theme={theme}
        onToggleTheme={toggleTheme}
        onExportCsv={handleExportCsv}
        onBackup={handleBackup}
        onRestoreFile={handleRestoreFile}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onLogout={handleLogout}
      />

      <main>
        <Toolbar
          cycleMonth={cycleMonth}
          onCycleMonthChange={setCycleMonth}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          cycleRangeLabel={cycleRangeLabel}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery("")}
          filteredCount={filteredCount}
          totalCategoriesCount={state.categories.length}
        />

        <div className="panel">
          <WeekNav
            weekLabel={weekLabel}
            onPrevWeek={prevWeek}
            onNextWeek={nextWeek}
            onJumpToToday={jumpToToday}
            canPrevWeek={currentWeekIndex > 0}
            canNextWeek={currentWeekIndex < weeks.length - 1}
          />

          <ExpenseGrid
            categories={state.categories}
            entries={state.entries}
            momCells={state.momCells}
            remarks={state.remarks || {}}
            weekDates={currentWeekDates}
            todayISO={todayISO}
            mobileStartIndex={mobileStartIndex}
            onShiftMobileDate={shiftMobileDate}
            onUpdateAmount={updateAmount}
            onUpdateRemark={updateRemark}
            onToggleMomCell={toggleMomCell}
            onRenameCategory={renameCategory}
            searchQuery={searchQuery}
          />
        </div>

        <ChartsSection
          categories={state.categories}
          entries={state.entries}
          cycleDates={cycleDates}
          theme={theme}
        />
      </main>

      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        totals={totals}
        onExportCsv={handleExportCsv}
        onBackup={handleBackup}
        onRestore={() => {
          const input = document.querySelector('input[type="file"]');
          if (input) input.click();
        }}
        onLogout={handleLogout}
      />

      <Toast message={toastMsg} isVisible={isToastVisible} />
    </>
  );
}
