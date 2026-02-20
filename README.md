# Organizer

**Student:** NDEKWE Dieu Merci  
**Theme:** Campus Life Planner  
**🌐 Live App**(Link): https://mndekwe-dot.github.io/Summative_FrontEnd/#home
**📁 Repository:** [github.com/mndekwe-dot](https://github.com/mndekwe-dot)
**📁 Tutorial Video:**(link): https://youtu.be/Xd-UyoaMFIY


---

## Overview

Organizer is a single-page web application that helps university students track and manage their academic tasks — lectures, labs, assignments, exams, and projects. Everything is stored in the browser using `localStorage`; no server or login is required.

Built with plain HTML, CSS, and JavaScript — no frameworks, no libraries. The colour palette was chosen using **(https://colorhunt.co/)**. JavaScript techniques such as ES modules, the `FileReader` API, and event delegation were studied through **YouTube tutorials** and applied from scratch.

---

## Repository Structure

> **Rubric: Repository Organisation & Version Control**  
> Modular folder layout with a clear separation of concerns, consistent file naming, and a `.gitignore` to exclude `node_modules` and system files.

```
project/
├── index.html          — single-page app (all 6 sections)
├── README.md           — this file
├── .gitignore          — excludes node_modules, .DS_Store, etc.
├── scripts/
│   ├── app.js          — navigation, forms, home page, settings, events
│   ├── state.js        — in-memory store + all CRUD (add, update, delete)
│   ├── storage.js      — localStorage read/write (load/save records & settings)
│   ├── ui.js           — DOM rendering: table, cards, dashboard charts, tags
│   ├── search.js       — regex filter, sort, highlight, escapeHtml
│   └── validators.js   — all regex rules + safe compiler + import validator
└── style/
    └── style.css       — CSS variables, mobile-first layout, themes, transitions
└── asset/
    └── seed.json       — 12 diverse sample records for demo/testing
└── Test/
    └── Test.HTML       — in-browser automated test suite
```

Each script has a single responsibility. No file handles concerns that belong to another — for example, `storage.js` never touches the DOM, and `ui.js` never writes to `localStorage`.

---

## Setup Guide

> **Rubric: Deployment via GitHub Pages**  
> The app is live at the URL above. To run it locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/mndekwe-dot/Summative_FrontEnd
   cd [Summative_FrontEnd]
   ```

2. Start a local server — **required** because ES modules do not work when opened as a plain file:

   **Option A — VS Code:**  
   Install the *Live Server* extension → right-click `index.html` → **Open with Live Server**

   **Option B — Terminal:**
   ```bash
   npx serve .
   ```
   Then visit `http://localhost:3000`

3. To load the 12 sample records, open `seed-loader.html` in the **same browser** as the app and click **Load Sample Data**. It merges records into `localStorage` without overwriting anything.

---

## Features List

> **Rubric: JavaScript Functionality & Code Quality**  
> All features below are fully functional. The code is split into 6 modules with no shared global state. No console errors are produced during normal use.

| Section | Feature | Detail |
|---|---|---|
| **Home** | Quick stats | Events this week, tasks due in 3 days, total records |
| **Home** | Streak counter | Counts consecutive days with activity |
| **Home** | Upcoming events | Next 5 events sorted by date; filterable by tag chip |
| **Home** | My Tasks | 5 soonest tasks; done toggle; overdue warning icon |
| **Home** | Trending | Top 3 tags by record count |
| **Dashboard** | Stats cards | Total records, total hours, top tag, tasks due this week |
| **Dashboard** | Trend chart | Pure CSS/JS bar chart of tasks added per day (last 7 days) |
| **Dashboard** | Tag distribution | Horizontal bars showing count per tag |
| **Dashboard** | Weekly cap | Progress bar; shows remaining or overage; live ARIA message |
| **Records** | Table / Cards | Sortable table on desktop; card layout on mobile |
| **Records** | Live regex search | Pattern typed → filtered instantly; matches highlighted |
| **Records** | Sort | By date (asc/desc), title (A→Z / Z→A), duration (↑↓) |
| **Records** | Tag filter | Dropdown filters records to one tag |
| **Records** | Edit | Inline edit: fills form, changes heading and button label |
| **Records** | Delete | Confirm modal; keyboard accessible; cannot be undone |
| **Records** | Export JSON | Downloads all records as a `.json` file |
| **Records** | Import JSON | Validates structure before loading; reports skipped records |
| **Settings** | Theme | Light / Dark / System (auto) |
| **Settings** | Default unit | Minutes or Hours — affects all duration displays |
| **Settings** | Tags | Add custom tags; remove non-default tags |
| **Settings** | Weekly cap | Editable number; live updates dashboard |
| **Settings** | Converter | Quick minutes ↔ hours converter |

---

## CSS & Responsiveness

> **Rubric: CSS & Responsiveness**  
> Mobile-first layout with two breakpoints. Smooth transitions on all interactive elements using a shared `--transition: 0.2s ease` CSS variable.

| Breakpoint | Width | Layout change |
|---|---|---|
| Mobile (base) | < 768 px | Single column; records shown as cards; drawer navigation |
| Tablet | ≥ 768 px | Two-column grids appear; top nav replaces drawer |
| Desktop | ≥ 1024 px | Wider containers; table replaces cards; sidebar visible |

**Transitions & Animations:**
- All buttons, links, and nav items use `transition: background-color 0.2s ease, color 0.2s ease`
- Theme switch applies instantly via `data-theme` on `<html>` — no flash
- Mobile drawer slides in/out with CSS transitions
- Tag badges, progress bars, and trend chart bars render with CSS width transitions

**Design approach:** Colour palette sourced from [Color Hunt](https://colorhunt.co/). CSS custom properties (`--bg`, `--primary`, `--text`) make the two themes possible with a single stylesheet.

---

## Regex Catalog

> **Rubric: Regex Validation & Search**  
> Five form validators (4 required + 1 advanced lookahead) plus one advanced back-reference checker and a safe live-search compiler. All patterns are in `scripts/validators.js`. Errors appear inline next to each field on blur; the search error appears below the search box.

### Validation Rules

| # | Rule | Pattern | Purpose | ✅ Passes | ❌ Fails |
|---|---|---|---|---|---|
| 1 | Title — no edge spaces | `/^\S(?:.*\S)?$/` | Rejects leading/trailing whitespace | `"Study Biology"` | `" Bad title"` |
| 2 | Title — no double space | `str.includes('  ')` | Rejects consecutive spaces | `"Study Biology"` | `"Study  Biology"` |
| 3 | Duration | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | Positive number, max 2 decimal places | `"1.5"`, `"2"` | `"1.123"`, `"-1"` |
| 4 | Date | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | Strict YYYY-MM-DD | `"2026-02-20"` | `"20-02-2026"`, `"2026-13-01"` |
| 5 | Tag | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Letters, spaces, hyphens only | `"Study"`, `"Co-op"` | `"Study!"`, `"1Lab"` |
| 6 ⭐ | Tag — lookahead *(advanced)* | `/^(?=[A-Za-z])/` | Positive lookahead: must start with a letter | `"Lab"` | `"1Study"` |
| 7 | Time (optional) | `/^([01]\d\|2[0-3]):[0-5]\d$/` | HH:MM 24-hour; empty string is allowed | `"09:00"`, `"23:59"` | `"24:00"`, `"9:5"` |
| 8 ⭐ | Duplicate word in notes *(advanced — back-reference)* | `/\b(\w+)\s+\1\b/i` | Catches repeated words e.g. "the the" | `"to to"` → warning shown | `"to do"` → no warning |

### Live Search Compiler

```js
// scripts/validators.js
export function compileRegex(input, flags = 'i') {
  try {
    return input ? new RegExp(input, flags) : null;
  } catch {
    return null;   // invalid pattern — caller shows error message
  }
}
```

| Pattern typed | Result | Notes |
|---|---|---|
| `exam` | Filters to records matching `/exam/i` | Case-insensitive by default |
| `^Study` | Only records whose title starts with "Study" | Anchored match |
| `\d{2}:\d{2}` | Records containing a time token like `09:00` | Searches notes and title |
| `Lab\|Lecture` | Records tagged Lab or Lecture | Alternation |
| `2026-02` | All records due in February 2026 | Date field searched |
| `[invalid` | Returns `null` → shows "Invalid regex pattern." | Safe — no crash |

Matches are highlighted using `<mark>` tags injected after `escapeHtml()` runs, so HTML injection is impossible even if the match contains special characters.

---

## UX & Visual Consistency

> **Rubric: UX & Visual Consistency**  
> The interface uses consistent spacing, a shared type scale, and clear feedback for every user action.

- **Empty states:** The Records section shows a friendly message with an icon and an "Add Your First Task" button when no records exist. Home sections show their own empty messages when lists are empty.
- **Error states:** Inline field errors appear on blur (when you leave a field). The form shows a summary message at the bottom if you try to submit with errors. Import failures show an `alert()` with the exact reason.
- **Success states:** After saving or updating a task, a ✅ message appears for 700 ms before automatically navigating to the Records page.
- **Microcopy:** Button labels change context — "Save Task" becomes "Update Task" when editing; the form heading changes from "Add Task" to "Edit Task". The record count shows "5 records" or "3 of 5 records shown" depending on filters.
- **Consistent hierarchy:** All sections use the same heading levels, button styles, spacing tokens (`--gap`, `--radius`), and tag badge colours. Tags keep their assigned colour throughout the session.

---

## Data Handling & Persistence

> **Rubric: Data Handling & Persistence**

### localStorage

All data is saved automatically on every change — no Save button needed.

| Key | Content |
|---|---|
| `organizer:records` | JSON array of all task records |
| `organizer:settings` | Theme, default unit, tags, weekly cap |

### Data Model

```json
{
  "id":        "evt_abc123",
  "title":     "Study for Calculus Midterm",
  "dueDate":   "2026-02-21",
  "duration":  4,
  "unit":      "hours",
  "tag":       "Study",
  "time":      "09:00",
  "notes":     "Focus on integration by parts.",
  "done":      false,
  "createdAt": "2026-02-18T11:00:00.000Z",
  "updatedAt": "2026-02-18T11:00:00.000Z"
}
```

### Import / Export

- **Export:** Serialises all records to indented JSON and triggers a browser download.
- **Import:** Reads the file with `FileReader`, parses JSON, then runs `validateImportRecord()` on every object. Records missing required fields (`id`, `title`, `dueDate`, `duration`, `tag`) are silently skipped. The user sees how many were imported and how many were skipped.
- **Malformed data:** If the file is not valid JSON, or is not an array, an error message is shown and no data is changed.

---

## Accessibility

> **Rubric: HTML & Accessibility**  
> The app is designed to be fully usable with a keyboard alone and compatible with screen readers.

### Semantic Structure

| Element | Used for |
|---|---|
| `<header>` | Top navigation bar |
| `<nav aria-label="Top navigation">` | Desktop nav links |
| `<nav aria-label="Mobile navigation">` | Mobile drawer links |
| `<main id="main-content">` | All page sections |
| `<section>` × 6 | Home, About, Dashboard, Records, Add/Edit, Settings |
| `<aside>` | Home page trending sidebar |
| `<footer>` | Footer with attribution |

- **Heading hierarchy:** Each section has exactly one `<h1>`; sub-sections use `<h2>` and `<h3>` in order — no levels are skipped.
- **Labels:** Every `<input>`, `<textarea>`, and `<select>` has a `<label>` linked by matching `for`/`id`, or an `aria-label` where a visible label is not appropriate.
- **ARIA live regions:**
  - `role="alert" aria-live="polite"` on each field error span — announced on change
  - `role="status" aria-live="polite"` on form status and record count
  - `role="alert" aria-live="assertive"` on the search error (invalid regex is urgent)
  - Global `#status-msg` (polite) and `#alert-msg` (assertive) regions at the bottom of `<body>`
- **Modal:** Delete confirmation uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and moves focus to the Confirm button on open.
- **Button states:** Done/toggle buttons use `aria-pressed`; the mobile menu uses `aria-expanded`.
- **Focus styles:** All interactive elements have `:focus-visible` outlines. None are hidden or overridden.
- **Colour contrast:** Dark theme (`#0e1117` / `#e6edf3`) and light theme (`#f3f7fc` / `#1a202c`) both pass WCAG AA.

---

## Keyboard Map

> **Rubric: HTML & Accessibility — keyboard navigation**

| Key | Context | Action |
|---|---|---|
| `Tab` | Anywhere | Move focus to next interactive element |
| `Shift + Tab` | Anywhere | Move focus to previous element |
| `Enter` / `Space` | Button or link focused | Activate it |
| `Escape` | Drawer open | Close mobile drawer |
| `Escape` | Delete modal open | Close modal without deleting |
| `Enter` | New tag input focused | Add the tag (same as clicking Add) |
| `Enter` | Any form field | Submit the form |
| Arrow keys | Radio groups | Switch between theme / unit options |
| First `Tab` on page | Page load | Skip link appears — press `Enter` to jump to main content |

---

## How to Run Tests

> **Rubric: Regex Validation & Search — real-time feedback; safe regex compiler**

1. Start a local server (see Setup Guide above).
2. Open `http://localhost:3000/tests.html` in your browser.
3. Tests run automatically on page load — no interaction needed.
4. Each assertion shows ✅ or ❌ with the actual vs expected value if it fails.
5. A summary at the bottom shows total passed and failed.

**What is tested:**

| Module | Tests |
|---|---|
| `validateTitle` | Empty, leading space, trailing space, double space, too long, valid |
| `validateDuration` | Empty, zero, negative, 3 decimals, text, valid integer and decimal |
| `validateDate` | Invalid month, invalid day, wrong format, empty, leap year, valid |
| `validateTag` | Empty, number start (tests lookahead), special char, valid forms |
| `validateTime` | Invalid hour 24, invalid minute 60, empty (optional), valid |
| `checkDuplicateWord` | Detects "the the", "study study"; no false positives |
| `compileRegex` | Valid → RegExp; invalid → null; empty → null |
| `escapeHtml` | `<`, `>`, `&`, `"` all escaped |
| `highlight` | Wraps match in `<mark>`; escapes HTML before marking |
| `filterRecords` | By pattern, case-insensitive, empty query, invalid regex, by tag |
| `sortRecords` | title-asc, date-desc |

---

## Demo Video

> **Rubric: Demo Video (2–3 min)**

🎥 **Video link:** _Summative_FrontEnd_

The video demonstrates:
1. Navigation between all 6 sections using keyboard only (Tab, Enter, Escape)
2. Adding a task — showing real-time validation errors on each field
3. Regex search edge cases — valid pattern with highlight, invalid pattern caught safely
4. Editing and deleting a task
5. Import and export JSON round-trip
6. Responsive layout on mobile and desktop widths

---

## Attributions

- **Colour palette:** [Color Hunt](https://colorhunt.co/)
- **JavaScript techniques** (ES modules, `FileReader` API, event delegation): learned from YouTube tutorials and applied independently
- All code written individually — no other contributors appear in the commit history
