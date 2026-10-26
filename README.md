# 💸 Chinmay's Expense Tracker (Next.js Edition)

A modern, high-performance, responsive expense tracker built with **Next.js 14 (App Router)**, **React 18**, and **Vanilla CSS**. Features real-time Firebase cloud synchronization, multi-account tagging (Personal & Mom's Account), salary cycle budgeting (7th to 6th), and rich SaaS aesthetics.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg?logo=next.js)
![React](https://img.shields.io/badge/React-18-blue.svg?logo=react)
![CSS3](https://img.shields.io/badge/CSS3-Modern%20Design%20Tokens-blue.svg)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-orange.svg?logo=firebase)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Features

- **Next.js App Router Architecture**:
  - Organized modular component structure (`app/`, `components/`, `hooks/`, `lib/`).
  - Google Fonts (`Outfit` & `Inter`) with zero-layout-shift `next/font`.
  - Zero Tailwind dependency — powered by custom Vanilla CSS design system.
- **Top Navigation Bar with Live Stats**:
  - `Total (Cycle)`: Cumulative spending across the salary cycle.
  - `Displayed Week`: Instant weekly totals for the visible week.
  - `Mom's Account`: Tagged expenses with soft rose indicator.
  - `My Account`: Dedicated personal spending tracker.
- **Real-Time Cloud Synchronization**:
  - Connects to **Firebase Realtime Database** via direct REST and Server-Sent Events (SSE).
  - Multi-tab and multi-device live synchronization.
  - Local-first architecture: edits save instantly offline to `localStorage` and automatically sync to the cloud with debouncing.
  - Custom Settings modal for runtime Firebase URL configuration.
- **Salary Cycle Budgeting**:
  - Custom pay-cycle tracking (7th of current month to 6th of next month).
  - Quick month-switcher navigation (`<` and `>`).
  - Active cycle date range badge.
- **Interactive Expense Matrix**:
  - Week-by-week pagination with "Today" quick jump.
  - Glowing highlight on the current day column (`TODAY`).
  - Inline category renaming and automatic "Other" row appending.
  - Smooth Enter-key navigation between amount inputs.
  - Real-time search filter with category counter.
  - Mobile-responsive 3-day sliding window for touch devices.
- **Visual Analytics**:
  - Category breakdown **Doughnut Chart** with responsive legends.
  - Daily spending trend **Bar Chart** with Rupee (`₹`) tooltips.
- **Theming & Data Management**:
  - Dark Mode (Deep Zinc / Slate) & Light Mode with persistent preference.
  - One-click CSV spreadsheet export.
  - JSON backup and restore capabilities.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.17.0 or later recommended; Node 20 verified).
- `npm` (v9 or later).

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/chinmaykoshe/expense-tracker.git
cd "expense tracker"
npm install
```

### 2. Configure Firebase (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Update your Firebase configuration in `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_DATABASE_URL="https://your-project-id-default-rtdb.firebaseio.com"
NEXT_PUBLIC_FIREBASE_NODE="expenseTracker"
NEXT_PUBLIC_DATABASE_SECRET="" # Optional if public rules allow read/write
```
*(Note: You can also configure or change the Firebase Database URL directly in the app via the **Settings (⚙️)** modal without modifying files).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
To create an optimized production build:
```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
├── app/
│   ├── globals.css          # Vanilla CSS design system tokens and styles
│   ├── layout.jsx           # Root layout with fonts, metadata, and viewport
│   └── page.jsx             # Client dashboard orchestrator
├── components/
│   ├── Header.jsx           # Navigation bar with 4 metric cards and actions
│   ├── Toolbar.jsx          # Month picker, cycle range badge, and search
│   ├── WeekNav.jsx          # Week pagination and "Today" button
│   ├── ExpenseGrid.jsx      # Interactive table matrix with inline editing
│   ├── ChartsSection.jsx    # Chart.js Doughnut and Bar visualizations
│   ├── MobileSidebar.jsx    # Slide-out drawer for mobile devices
│   ├── Toast.jsx            # Toast feedback notifications
├── hooks/
│   ├── useExpenseState.js   # Local-first state, debounced sync, and SSE listener
│   └── useSalaryCycle.js    # 7th-to-6th cycle calculation and week pagination
├── lib/
│   ├── constants.js         # Default categories, storage keys, and config
│   ├── dateUtils.js         # Date formatting, cycle logic, and Rupee money helper
│   ├── exportUtils.js       # CSV export and JSON backup/restore
│   └── firebase.js          # REST and SSE Firebase communication
├── package.json
└── next.config.mjs
```

---

## 🔒 Security & Privacy

- Environment variables in `.env.local` and `.env` are protected by `.gitignore` and are never committed to public repositories.
- Client-side data is persisted locally in `localStorage` with offline-first support if Firebase is unreachable.

---

## 📄 License

This project is licensed under the MIT License - feel free to use and modify it.
