# 💸 Chinmay's Expense Tracker (Next.js Edition)

A modern, high-performance, responsive expense tracker built with **Next.js 14 (App Router)**, **React 18**, and **Vanilla CSS**. Features real-time Firebase cloud synchronization, secure user authentication with account isolation, multi-account tagging (Personal & Mom's Account), salary cycle budgeting (7th to 6th), dynamic usage-based category sorting, and rich SaaS aesthetics.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg?logo=next.js)
![React](https://img.shields.io/badge/React-18-blue.svg?logo=react)
![CSS3](https://img.shields.io/badge/CSS3-Modern%20Design%20Tokens-blue.svg)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-orange.svg?logo=firebase)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg?logo=vercel)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Features

- **Authentication & User Isolation**:
  - Secure credential-based sign in and account registration.
  - **"Remember Me"** support: automatically remembers and pre-fills your username on return.
  - Account-specific isolated storage and live capacity management.
- **Next.js App Router Architecture**:
  - Organized modular component structure (`app/`, `components/`, `hooks/`, `lib/`).
  - Google Fonts (`Outfit` & `Inter`) with zero-layout-shift `next/font`.
  - Zero Tailwind dependency — powered by custom Vanilla CSS design system.
- **Top Navigation Bar with Live Stats**:
  - `Total (Cycle)`: Cumulative spending across the salary cycle.
  - `Displayed Week`: Instant weekly totals for the visible week.
  - `Mom's Account`: Tagged expenses with soft rose indicator.
  - `My Account`: Dedicated personal spending tracker.
- **Dynamic Category Sorting & Filtering**:
  - **Most Used Sorting (Default)**: Automatically ranks categories with the most entries and activity right at the top.
  - **Highest Spent Sorting**: Quick toggle to order categories by cumulative money spent.
  - **Default Order**: Traditional fixed categorization list.
  - Intelligent trailing "Other" row preservation for seamless addition of new categories.
  - Instant real-time category search filter with live count badge.
- **Real-Time Cloud Synchronization**:
  - Connects to **Firebase Realtime Database** via direct REST and Server-Sent Events (SSE).
  - Multi-tab and multi-device live synchronization.
  - Local-first architecture: edits save instantly offline to `localStorage` and automatically sync to the cloud with debouncing.
- **Salary Cycle Budgeting**:
  - Custom pay-cycle tracking (7th of current month to 6th of next month).
  - Quick month-switcher navigation (`<` and `>`).
  - Active cycle date range badge.
- **Interactive Expense Matrix**:
  - Week-by-week pagination with "Today" quick jump.
  - Glowing highlight on the current day column (`TODAY`).
  - Inline category renaming and automatic "Other" row appending.
  - Full Excel-like keyboard navigation (Enter/Shift+Enter for row movement, Tab/Shift+Tab for column jumping).
  - Per-cell notes/remarks support with visual flag indicators.
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

### 2. Configure Firebase Environment Variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_FIREBASE_DATABASE_URL="https://your-project-id-default-rtdb.firebaseio.com"
NEXT_PUBLIC_FIREBASE_NODE="expenseTracker"
NEXT_PUBLIC_DATABASE_SECRET="" # Optional if public rules allow read/write
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production / Vercel
To create an optimized production bundle:
```bash
npm run build
npm run start
```

Deployable directly on [Vercel](https://vercel.com) with preconfigured `vercel.json` framework settings.

---

## 📁 Project Structure

```
├── app/
│   ├── globals.css          # Vanilla CSS design system tokens and styling
│   ├── layout.jsx           # Root layout with fonts, metadata, and viewport
│   └── page.jsx             # Client dashboard orchestrator & state manager
├── components/
│   ├── Header.jsx           # Top bar with 4 summary metric chips and actions
│   ├── LoginPage.jsx        # Authentication card with Remember Me & live capacity
│   ├── Toolbar.jsx          # Month picker, search box, and Sort By selector
│   ├── WeekNav.jsx          # Week pagination and "Today" quick jump button
│   ├── ExpenseGrid.jsx      # Interactive table matrix with sort logic & keyboard nav
│   ├── ChartsSection.jsx    # Chart.js Doughnut and Bar visualizations
│   ├── MobileSidebar.jsx    # Slide-out drawer for mobile devices
│   └── Toast.jsx            # Toast feedback notifications
├── hooks/
│   ├── useExpenseState.js   # Local-first storage, debounced sync, and SSE listener
│   └── useSalaryCycle.js    # 7th-to-6th cycle calculation and week pagination
├── lib/
│   ├── constants.js         # Default categories, storage keys, and config
│   ├── dateUtils.js         # Date formatting, cycle logic, and Rupee money helper
│   ├── exportUtils.js       # CSV export and JSON backup/restore
│   └── firebase.js          # REST and SSE Firebase communication & auth
├── vercel.json              # Vercel Next.js framework configuration
├── package.json
└── next.config.mjs
```

---

## 🔒 Security & Privacy

- Environment variables in `.env.local` and `.env` are protected by `.gitignore` and are never committed to public repositories.
- Client-side data is persisted locally in `localStorage` with offline-first support if Firebase is unreachable.
- Individual user expense stores are scoped and isolated by user account.

---

## 📄 License

This project is licensed under the MIT License - feel free to use and modify it.
