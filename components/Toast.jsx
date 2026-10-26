"use client";

export default function Toast({ message, isVisible }) {
  return (
    <div className={`toast ${isVisible ? "show" : ""}`} role="status">
      <svg
        width="18"
        height="18"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        style={{ color: "#10B981" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}
