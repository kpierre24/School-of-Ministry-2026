# HTEIM School of Ministry
**Version:** `v1.0.0`  
**License:** Proprietary — Heaven Touching Earth International Ministries (HTEIM)  
**System Status:** Production Ready | PWA & Capacitor Android Supported

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Authentication](#authentication)
- [Security](#security)
- [Database](#database)
- [Roles & Permissions](#roles--permissions)
- [Development Setup](#development-setup)
- [How to Deploy from Zero](#how-to-deploy-from-zero)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [Progressive Web App (PWA)](#progressive-web-app-pwa)
- [Android Integration](#android-integration)
- [Testing](#testing)
- [Backup / Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

---

## Overview

The **HTEIM School of Ministry Portal** is a full-stack, enterprise-grade educational management platform designed specifically for Heaven Touching Earth International Ministries. It unifies academic tracking across 6 core curriculum modules, student enrollment, daily attendance recording, assignment submission & automated AI grading, financial balance management with receipt generation, library handouts, and live broadcast integration into a single unified workspace.

Built with desktop-first precision and mobile-native responsiveness, the portal functions seamlessly on web browsers, as an installable Progressive Web App (PWA), and as a standalone Android application built with Capacitor.

---

## Features

### 🎓 Academic & Student Management
- **Curriculum Modules**: Structured course materials, video lectures, downloadable PDF handouts, and quizzes for all 6 core ministry modules.
- **Attendance Engine**: Daily attendance recording, attendance rate calculations, 75% satisfactory threshold enforcement, and at-risk warning alerts (students < 75%).
- **Student 360° Profile**: Comprehensive view of individual student GPA, attendance metrics, payment logs, submitted homework, and activity audit timeline.
- **Assignment & Quiz Suite**: Online assignment submission, teacher marking interface, AI-assisted essay evaluation via Google Gemini, and automated quiz scoring.

### 💰 Tuition & Financial Operations
- **Financial Profile & Statements**: Real-time tuition balance tracking, installment plan management, scholarship sponsoring, and financial adjustments.
- **Receipt & Invoice Generator**: Instant downloadable/printable official receipts formatted for TT$ (Trinidad & Tobago Dollars) or USD currency.
- **Financial Audit & Reconciliation**: Full transaction ledger with cashier attribution, payment reminders, and summary reports.

### 🔒 Administration & Security
- **System Health & Readiness Center**: Real-time telemetry monitoring network latency, database persistence, session security, storage usage, and component readiness scores.
- **Institutional Audit Log**: Immutable log recording user actions, timestamped events, role changes, grade edits, and failed authentication attempts with role/module filters.
- **Dual Data Synchronization**: Dual-source merge engine (Google Sheets CSV feed + Cloud PostgreSQL/Firestore) with interactive line-by-line conflict resolution.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions isolating Student, Teacher/Lecturer, Finance Officer, and Administrator views.

---

## Architecture

The portal utilizes a hybrid full-stack client-server architecture powered by React, Express, and Vite:

```
                  ┌───────────────────────────────────────────┐
                  │       Client Browser / PWA / Android      │
                  │ (React 18 + Tailwind v4 + Motion + Lucide)│
                  └─────────────────────┬─────────────────────┘
                                        │
                                 HTTPS / REST / WSS
                                        │
                  ┌─────────────────────▼─────────────────────┐
                  │           Express Node.js Backend         │
                  │   - Static Asset Middleware (Vite SPA)    │
                  │   - Server-Side Gemini AI Evaluation Proxy│
                  │   - Session Security & Throttling Guards   │
                  └──────────┬──────────────────────┬─────────┘
                             │                      │
       ┌─────────────────────▼───────┐    ┌─────────▼──────────────────┐
       │   Supabase Cloud PostgreSQL  │    │ Firebase Auth & Firestore  │
       │ (Primary Relational Storage)│    │   (OAuth & Real-Time Sync) │
       └─────────────────────────────┘    └────────────────────────────┘
```

---

## Technology Stack

- **Frontend Core**: React 18, TypeScript, Vite 6
- **Styling & UI**: Tailwind CSS v4, Lucide React Icons, Framer Motion (`motion/react`)
- **Data Visualization**: Recharts
- **Backend / Middleware**: Express, `tsx` (Dev Execution), `esbuild` (Production ESM/CJS compilation)
- **Database & Storage**: Supabase (PostgreSQL), Firebase Firestore & Firebase Auth, Browser `localStorage` Buffer
- **AI Processing**: Google Gemini API (`@google/genai` TypeScript SDK)
- **Mobile Runtime**: Capacitor 6 (`@capacitor/core`, `@capacitor/android`)
- **PWA Runtime**: Vite PWA Plugin, Service Worker static cache manifest

---

## Authentication

The portal supports multi-modal, secure authentication flows:

1. **Email / Username + Cryptographic Password**: Passwords are hashed client-side and server-side using SHA-256 with a unique salt (`hteim_som_sec_salt_2026`).
2. **WebAuthn Biometric Authentication**: Fingerprint / Face ID unlock linked directly to authenticated sessions via the browser's native `navigator.credentials` API. Biometrics unlock active short-lived credentials rather than bypassing backend verification.
3. **Google OAuth & Firebase Auth**: Direct single-sign-on (SSO) integration for faculty and student accounts.
4. **Account Lockout Protection**: Automatic 2-minute lockout triggered after 5 consecutive failed login attempts on any single account or IP identifier.

---

## Security

- **Server-Side API Proxying**: Gemini API keys and cloud storage secrets are handled exclusively on the backend (`server.ts` / server routes) and never exposed to the client browser.
- **Role & Authorization Checks**: Client-side UI guards are backed by server-side verification of role permissions (`admin`, `teacher`, `finance`, `student`).
- **Input Sanitization**: All incoming inputs, filenames, and parameters are sanitized to prevent XSS and SQL injection.
- **Session Timeout**: Automatic 30-minute idle session timeout with countdown notification warning users before session invalidation.

---

## Database

The platform employs a dual-tier persistence model:

1. **Supabase Cloud PostgreSQL**: Primary relational database handling student records, course enrollments, grade sheets, and tuition transaction ledgers.
2. **Firebase Firestore**: Real-time sync for chat messaging, active announcement broadcasts, and live notifications.
3. **Local Storage Fallback Buffer**: PWA offline buffer storing pending attendance check-ins and draft notes, automatically flushing to the cloud upon internet reconnection.

---

## Roles & Permissions

| Role | Access Level | Description & Capabilities |
|------|--------------|----------------------------|
| `super_admin` / `admin` | Full Management | System settings, student 360 profile edits, attendance overrides, grade publishing, user management, audit log inspection, backup export/restore. |
| `teacher` / `lecturer` | Academic Management | Course content editing, assignment creation, student grading, daily attendance check-in, batch announcements. |
| `finance` | Financial Management | Payment transaction recording, tuition balance adjustments, receipt generation, financial audit trail. |
| `student` | Student View | Personal course view, homework submission, self-attendance tracking, financial balance review, library resource access. |

---

## Development Setup

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`
- **Git**: Installed on local environment

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kpierre24/School-of-Ministry-2026.git
   cd School-of-Ministry-2026
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to include your Supabase, Firebase, and Gemini API credentials.*

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   *The application will boot at `http://localhost:3000`.*

---

## How to Deploy from Zero

To deploy the HTEIM School of Ministry platform to a fresh cloud container or server from scratch:

```bash
# Step 1: Clone the clean codebase
git clone https://github.com/kpierre24/School-of-Ministry-2026.git
cd School-of-Ministry-2026

# Step 2: Install node dependencies
npm install

# Step 3: Run static type-checking and code quality linting
npm run lint

# Step 4: Run build suite to generate bundle in dist/
npm run build

# Step 5: Start the production Express server
npm start
```

Your server will spin up on `PORT=3000` listening on host `0.0.0.0`.

---

## Production Deployment

### Docker Deployment

To package and run as a Docker container:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build & run:
```bash
docker build -t hteim-portal:1.0.0 .
docker run -d -p 3000:3000 --env-file .env hteim-portal:1.0.0
```

---

## Environment Variables

The application requires the following environment variables (see `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for server-side essay grading |
| `VITE_SUPABASE_URL` | Yes | Supabase PostgreSQL endpoint URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous client key |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project identifier |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web application API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase authentication domain |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase cloud storage bucket |
| `APP_URL` | No | Base application URL for production CORS validation |

---

## Progressive Web App (PWA)

The portal is a fully compliant Progressive Web App:
- **Offline Caching**: Static JS, CSS, fonts, and core assets cached via Service Worker (`sw.js`).
- **Installability**: Web App Manifest (`manifest.webmanifest`) configured with high-resolution app icons and theme colors.
- **Install Prompt**: Interactive in-app installation banner triggers automatically on supporting mobile and desktop browsers.

---

## Android Integration

The project includes Capacitor Android native bridge files:
- **Build Sync**: Run `npm run cap:sync` to compile web assets and push to the native Android directory.
- **Android Studio Project**: Open the native project with `npx cap open android`.
- **Hardware Integration**: Built-in support for native camera check-ins, haptic feedback, and biometric hardware authenticators.

---

## Testing

Run linting, static type verification, and unit verification:

```bash
# Run TypeScript compilation check & ESLint rules
npm run lint

# Clean build directory and run test builds
npm run clean && npm run build
```

---

## Backup / Recovery

- **Automated JSON Export**: Administrators can export complete system state (students, attendance, grades, ledger) as an encrypted JSON backup file from **Admin → System Health → Backup Suite**.
- **System Restore**: Upload a valid backup JSON file to restore portal data to a previous state instantly.

---

## Troubleshooting

| Issue | Cause | Resolution |
|-------|-------|------------|
| Port `3000` already in use | Stale background process | Kill process using `lsof -i :3000` or `fuser -k 3000/tcp` and restart `npm run dev`. |
| Supabase connection fails | Missing environment variables | Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`. |
| Biometrics unavailable | Unsafe browser context | WebAuthn requires HTTPS or `localhost` context to access biometric hardware. |
| Offline sync pending | No internet connection | Reconnect to the network; the sync worker will flush local buffer automatically. |

---

*© 2026 Heaven Touching Earth International Ministries (HTEIM) School of Ministry. All Rights Reserved.*
