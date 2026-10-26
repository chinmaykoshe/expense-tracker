"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  localISO,
  getCycleDates,
  buildWeeks,
  getCycleRangeLabel,
  getWeekLabel,
} from "../lib/dateUtils";

export function useSalaryCycle(showToast) {
  const todayISO = useMemo(() => localISO(new Date()), []);

  // Default cycle month based on today
  const [cycleMonth, setCycleMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Calculate cycle dates and weekly chunks
  const cycleDates = useMemo(
    () => getCycleDates(cycleMonth),
    [cycleMonth]
  );

  const cycleRangeLabel = useMemo(
    () => getCycleRangeLabel(cycleDates),
    [cycleDates]
  );

  const weeks = useMemo(
    () => buildWeeks(cycleDates),
    [cycleDates]
  );

  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [mobileStartIndex, setMobileStartIndex] = useState(0);

  // When cycle month changes, default week to the one containing today or week 0
  useEffect(() => {
    if (!weeks.length) return;
    const found = weeks.findIndex((w) => w.includes(todayISO));
    const targetIdx = found !== -1 ? found : 0;
    setCurrentWeekIndex(targetIdx);

    const weekDates = weeks[targetIdx] || [];
    const todayIdx = weekDates.indexOf(todayISO);
    setMobileStartIndex(todayIdx !== -1 ? Math.max(0, todayIdx - 2) : 0);
  }, [weeks, todayISO]);

  const currentWeekDates = useMemo(() => {
    return weeks[currentWeekIndex] || [];
  }, [weeks, currentWeekIndex]);

  const weekLabel = useMemo(() => {
    return getWeekLabel(currentWeekDates, currentWeekIndex);
  }, [currentWeekDates, currentWeekIndex]);

  // Month Switchers
  const prevMonth = useCallback(() => {
    const [y, m] = cycleMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setCycleMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }, [cycleMonth]);

  const nextMonth = useCallback(() => {
    const [y, m] = cycleMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setCycleMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }, [cycleMonth]);

  // Week Switchers
  const prevWeek = useCallback(() => {
    setCurrentWeekIndex((prev) => {
      if (prev > 0) {
        setMobileStartIndex(0);
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const nextWeek = useCallback(() => {
    setCurrentWeekIndex((prev) => {
      if (prev < weeks.length - 1) {
        setMobileStartIndex(0);
        return prev + 1;
      }
      return prev;
    });
  }, [weeks.length]);

  // Jump to Today
  const jumpToToday = useCallback(() => {
    const found = weeks.findIndex((w) => w.includes(todayISO));
    if (found !== -1) {
      setCurrentWeekIndex(found);
      const todayIdx = weeks[found].indexOf(todayISO);
      setMobileStartIndex(Math.max(0, todayIdx - 2));
      if (showToast) showToast("Jumped to current week");
    } else {
      const now = new Date();
      setCycleMonth(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      );
      if (showToast) showToast("Switched to current cycle");
    }
  }, [weeks, todayISO, showToast]);

  // Mobile 3-day sliding navigation
  const shiftMobileDate = useCallback(
    (dir) => {
      if (!weeks.length || !weeks[currentWeekIndex]) return;
      const wkDates = weeks[currentWeekIndex];
      let nextStart = mobileStartIndex + dir;

      if (nextStart < 0) {
        if (currentWeekIndex > 0) {
          setCurrentWeekIndex(currentWeekIndex - 1);
          setMobileStartIndex(Math.max(0, weeks[currentWeekIndex - 1].length - 3));
        } else {
          setMobileStartIndex(0);
        }
      } else if (nextStart > wkDates.length - 3 && wkDates.length >= 3) {
        if (currentWeekIndex < weeks.length - 1) {
          setCurrentWeekIndex(currentWeekIndex + 1);
          setMobileStartIndex(0);
        } else {
          setMobileStartIndex(wkDates.length - 3);
        }
      } else if (wkDates.length < 3 && nextStart > 0) {
        if (currentWeekIndex < weeks.length - 1) {
          setCurrentWeekIndex(currentWeekIndex + 1);
          setMobileStartIndex(0);
        } else {
          setMobileStartIndex(0);
        }
      } else {
        setMobileStartIndex(nextStart);
      }
    },
    [weeks, currentWeekIndex, mobileStartIndex]
  );

  return {
    cycleMonth,
    setCycleMonth,
    cycleDates,
    cycleRangeLabel,
    weeks,
    currentWeekIndex,
    setCurrentWeekIndex,
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
  };
}
