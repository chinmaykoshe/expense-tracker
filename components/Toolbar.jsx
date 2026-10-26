"use client";

export default function Toolbar({
  cycleMonth,
  onCycleMonthChange,
  onPrevMonth,
  onNextMonth,
  cycleRangeLabel,
  searchQuery,
  onSearchChange,
  onClearSearch,
  filteredCount,
  totalCategoriesCount,
  sortBy,
  onSortByChange,
}) {
  return (
    <div className="toolbar-panel">
      {/* Left: Salary Cycle Picker + Active Cycle Dates */}
      <div className="toolbar-left">
        <div className="control-item">
          <div className="control-meta">
            <span className="control-label">Salary Cycle</span>
            <div className="cycle-input-wrapper">
              <button
                className="cycle-btn-arrow"
                onClick={onPrevMonth}
                title="Previous Month"
                aria-label="Previous Month"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <input
                type="month"
                id="cycle"
                value={cycleMonth}
                onChange={(e) => onCycleMonthChange(e.target.value)}
                aria-label="Select salary cycle month"
              />
              <button
                className="cycle-btn-arrow"
                onClick={onNextMonth}
                title="Next Month"
                aria-label="Next Month"
              >
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
          </div>
        </div>

        <div
          className="cycle-badge"
          title="Salary cycle begins on the 7th and ends on the 6th of next month"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Cycle: {cycleRangeLabel}</span>
        </div>
      </div>

      {/* Right: Search Filter & Category Count */}
      <div className="toolbar-right">
        <div className="search-box">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search categories"
          />
          {searchQuery && (
            <button
              className="search-clear visible"
              onClick={onClearSearch}
              title="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        <div className="sort-select-wrapper">
          <label htmlFor="sort-select" className="sort-label">Sort:</label>
          <select
            id="sort-select"
            className="sort-select"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            title="Sort categories by activity or spending"
          >
            <option value="most-used">🔥 Most Used</option>
            <option value="highest-spent">💰 Highest Spent</option>
            <option value="default">📋 Default Order</option>
          </select>
        </div>

        <div className="cat-count-pill">
          {filteredCount} / {totalCategoriesCount} Categories
        </div>
      </div>
    </div>
  );
}
