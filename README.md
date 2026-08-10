# HTEIM School of Ministry Portal

A full-featured educational portal for tracking student enrollment, attendance, assignment submissions, academic grades across 6 core curriculum modules, tuition payments, library resources, and live broadcasts.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Express + Vite middleware (dev) / static serve (prod)
- **Auth**: Firebase Auth (Google Sign-In)
- **Database**: Supabase (PostgreSQL) + Firestore
- **AI**: Gemini AI for lesson evaluation
- **State**: React Context + localStorage
- **Icons**: lucide-react
- **Animations**: motion (Framer Motion)
- **Charts**: recharts

## Prerequisites

- Node.js >= 18
- npm >= 9

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/kpierre24/School-of-Ministry-2026.git
   cd School-of-Ministry-2026
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Gemini AI API key for lesson evaluation |
| `APP_URL` | Yes | Public URL where the app is hosted |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | No | Firestore database ID |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | No | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | Firebase measurement ID |
| `VITE_FIREBASE_OAUTH_CLIENT_ID` | No | Firebase OAuth client ID |
| `VITE_FIREBASE_RECAPTCHA_SITE_KEY` | No | Firebase reCAPTCHA site key |

## Production Build

```bash
npm run build
npm run preview
```

## Deploy to Azure

### Option 1: Azure Container Apps (recommended)

1. Build and push the Docker image to Azure Container Registry:
   ```bash
   az acr build --registry <your-registry> --image hteim-portal:latest .
   ```

2. Deploy to Container Apps:
   ```bash
   az containerapp create \
     --name hteim-portal \
     --resource-group <your-rg> \
     --environment <your-env> \
     --image <your-registry>.azurecr.io/hteim-portal:latest \
     --cpu 1 --memory 2Gi \
     --min-replicas 1 --max-replicas 3 \
     --env-vars GEMINI_API_KEY=<key> APP_URL=<url> VITE_SUPABASE_URL=<url> VITE_SUPABASE_ANON_KEY=<key> VITE_FIREBASE_PROJECT_ID=<id> VITE_FIREBASE_API_KEY=<key> VITE_FIREBASE_AUTH_DOMAIN=<domain> VITE_FIREBASE_STORAGE_BUCKET=<bucket>
   ```

### Option 2: Azure Static Web Apps

For a static-first deployment, use Azure Static Web Apps with an API function for the Express backend.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with Express middleware |
| `npm run build` | Build frontend + bundle server |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run TypeScript type checking |
| `npm run clean` | Remove dist and build artifacts |

## Project Structure

```
src/
  components/   # React UI components
  lib/          # Utilities, API clients, auth, logging
  server/       # Express routes and services
  assets/       # Images and static files
server.ts       # Express entry point
```

## License

Proprietary - HTEIM School of Ministry
