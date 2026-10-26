"use client";

export default function WeekNav({
  weekLabel,
  onPrevWeek,
  onNextWeek,
  onJumpToToday,
  canPrevWeek,
  canNextWeek,
}) {
  return (
    <div className="week-nav">
      <button
        className="nav-btn"
        onClick={onPrevWeek}
        disabled={!canPrevWeek}
        title="View previous week"
      >
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Prev Week
      </button>

      <div className="week-nav-center">
        <h3>{weekLabel}</h3>
        <button
          className="today-jump-btn"
          onClick={onJumpToToday}
          title="Jump to current week"
        >
          Jump to Today
        </button>
      </div>

      <button
        className="nav-btn"
        onClick={onNextWeek}
        disabled={!canNextWeek}
        title="View next week"
      >
        Next Week
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}
