# HTEIM School of Ministry Portal — Developer & Agent Guidelines

This file serves as persistent instructions for AI coding agents working on the **HTEIM School of Ministry Portal**.

---

## 1. Project Context & Domain
- **Organization**: Heaven Touching Earth International Ministries (HTEIM) School of Ministry.
- **Core Purpose**: A full-featured educational portal for tracking student enrollment, attendance, assignment submissions, academic grades across 6 core curriculum modules, tuition payments, library resources, and live broadcasts.
- **Role Permissions**:
  - `admin` / `teacher`: Full management access to student records, attendance overrides, grade input, payment statements, and settings.
  - `student`: View-only or personal access to self-attendance, grades, assigned homework, personal payments, and library handouts.

---

## 2. Attendance & Scoring Thresholds
- **Satisfactory Attendance Threshold**: **75%** attendance rate.
- **At-Risk Attendance Warning Trigger**: Any student with an attendance rate **below 75%** is flagged in the At-Risk Notification System.
- **Critical Attendance Level**: Attendance rate **<= 50%**.
- **Grading Scale Standards**:
  - **Honor Roll / High Distinction**: Average score **>= 85%**.
  - **Satisfactory**: Score **>= 75%**.
  - **At-Risk**: Score **< 75%**.

---

## 3. Student Alias Mappings & Name Canonicalization
- When processing student attendance records from external sources (Google Sheets, CSVs, manual check-ins):
  - Strip non-breaking spaces (`\u00A0`) and extra whitespace.
  - Trim and apply case-insensitive matching (`toLowerCase().trim()`).
  - Maintain canonical display names so student profile metrics remain unified across sheets and local edits.

---

## 4. Google Sheets & Data Synchronization Architecture
- **Dual-Source System**: Google Sheets CSV feed + Local state in `localStorage` & Supabase cloud backup.
- **Conflict Merge Policy**:
  - `manual` (default): Preserves local manual attendance overrides made inside the portal.
  - `sheets`: Overwrites local state with incoming Google Sheets data.
  - `prompt`: Displays the `SheetMergeConflictModal` to allow teachers to resolve line-by-line conflicts.
- **Offline PWA Behavior**: Attendance records marked offline are buffered in local storage and auto-synced upon reconnecting to the internet.

---

## 5. UI & Styling Rules
- **Framework**: React + Vite + Tailwind CSS.
- **Icons**: Always import from `lucide-react`.
- **Animations**: `motion` from `motion/react`.
- **Data Visualizations**: `recharts` for charts and responsive SVG graphs.
- **Theme Support**: Seamless Light / Dark theme toggling with high-contrast accessibility.
