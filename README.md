# 💸 Chinmay's Expense Tracker

A modern, high-performance, responsive expense tracker with real-time Firebase cloud synchronization, multi-account tagging (Personal & Mom's Account), salary cycle budgeting (7th to 6th), and SaaS design aesthetics.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla%20ES6+-yellow.svg)
![CSS3](https://img.shields.io/badge/CSS3-Modern%20Custom%20Properties-blue.svg)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-orange.svg)

---

## ✨ Features

- **Top Navigation Bar with Live Stats**:
  - `Total (Cycle)`: Cumulative spending across the salary cycle.
  - `Displayed Week`: Instant weekly totals.
  - `Mom's Account`: Tagged expenses with soft rose indicator.
  - `My Account`: Dedicated personal spending tracker.
- **Real-Time Cloud Synchronization**:
  - Connects to **Firebase Realtime Database** via direct REST & Server-Sent Events (SSE).
  - Multi-tab and multi-device live sync.
  - Local-first architecture: edits save instantly offline to `localStorage` and automatically sync to the cloud.
- **Salary Cycle Budgeting**:
  - Custom pay-cycle tracking (e.g. 7th of current month to 6th of next month).
  - Quick month-switcher navigation (`<` and `>`).
  - Active cycle date range badge.
- **Interactive Expense Matrix**:
  - Inline category renaming and custom category addition.
  - Current day column glowing highlight (`TODAY`).
  - Enter key navigation across amount inputs.
  - Real-time search filter with category counter.
- **Visual Analytics**:
  - Interactive Doughnut chart for category breakdown.
  - Daily spending trend bar chart with Rupee (`₹`) tooltips.
- **Theming & Data Management**:
  - Dark Mode (Deep Zinc / Slate) & Light Mode with persistent preference.
  - One-click CSV spreadsheet export.
  - JSON backup and restore capabilities.

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/chinmaykoshe/expense-tracker.git
cd expense-tracker
```

### 2. Configure Firebase (Optional but Recommended)
Copy `config.example.js` to `config.js`:
```bash
cp config.example.js config.js
```
Open `config.js` and set your Firebase Realtime Database URL:
```javascript
window.APP_CONFIG = {
  FIREBASE_DATABASE_URL: "https://your-project-id-default-rtdb.firebaseio.com",
  FIREBASE_NODE: "expenseTracker",
  DATABASE_SECRET: "" // Optional
};
```
*(Note: `config.js` is included in `.gitignore` to prevent leaking your private database URL or secrets.)*

### 3. Open in Browser
Simply open `index.html` in any modern web browser (Edge, Chrome, Firefox, Safari).

---

## 🔒 Security & Privacy

This project follows security best practices:
- Credentials in `config.js` and `.env` are protected by `.gitignore` and are never committed to public repositories.
- Client-side data is cached locally with seamless fallback if offline or unreachable.

---

## 📄 License

This project is licensed under the MIT License - feel free to use and modify it.
