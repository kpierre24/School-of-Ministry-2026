# School of Ministry 2026

A comprehensive digital platform for the HTEIM School of Ministry, designed to streamline course management, student engagement, and academic administration. Built with React, TypeScript, and Firebase for a modern, scalable learning experience.

**Live Demo:** [school-of-ministry-2026.vercel.app](https://school-of-ministry-2026.vercel.app)

---

## 🎯 Features

### 📚 Course & Content Management
- **Lesson Evaluation & Classification** - AI-powered analysis of lesson materials using Google Gemini to auto-generate summaries, categories, and key takeaways
- **Multi-Format Support** - Handle Word documents (.docx), CSV files, and text content seamlessly
- **Course Coding System** - Organize lessons by course codes (e.g., SOM-101, SOM-CORE)
- **Material Library** - Centralized repository for textbooks, lecture notes, study guides, and scripture memory materials
- **Content Metadata** - Track lesson titles, instructors, course assignments, and file information

### 👥 Student Management
- **Student Roster** - Comprehensive student list with photos, names, and academic levels
- **Attendance Tracking** - Mark and monitor daily attendance with excused absence management
- **Student Profiles** - Store student notes, performance data, and contact information
- **Photo Management** - Upload and display student photos for easy identification

### 📊 Assessment & Grading
- **Rubric Scoring System** - Define and apply custom rubrics for student evaluations
- **Custom Assignments** - Create, assign, and track custom coursework
- **Submission Tracking** - Collect and organize student assignment submissions
- **Performance Analytics** - Visual dashboards with charts and performance metrics

### 📝 Administrative Features
- **Google Sheets Integration** - Connect and sync with Google Sheets for data management
- **PDF Export** - Export reports, attendance records, and grades as PDFs
- **ZIP Archive Generation** - Batch export materials and documentation
- **Multi-Device Sync** - Cloud-based state synchronization via Firebase for access across devices
- **Notification System** - Keep users informed with in-app notifications and alerts

### 🔐 Data & Workflow
- **Cloud Persistence** - All data automatically synced to Firebase Firestore
- **GitHub Integration** - Pull latest code updates directly from the repository
- **Real-Time Updates** - Instant synchronization across all connected sessions
- **Secure Rules** - Firestore security rules for data protection

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icon library
- **Motion** - Smooth animations

### Backend
- **Express.js** - Node.js server framework
- **Firebase SDK** - Real-time database and authentication
- **Google Gemini AI** - Advanced content evaluation and analysis
- **Supabase** - Alternative database option

### Tools & Utilities
- **html2canvas** - Convert DOM to images
- **jsPDF** - PDF generation
- **jszip** - ZIP file creation
- **Mammoth.js** - Word document parsing
- **PapaParse** - CSV parsing and generation
- **Recharts** - Data visualization
- **String Similarity** - Fuzzy text matching

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) or [Bun](https://bun.sh/)
- npm or Yarn
- Firebase project with Firestore
- Google Gemini API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kpierre24/School-of-Ministry-2026.git
   cd School-of-Ministry-2026
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will run at `http://localhost:3000`

---

## 📦 Project Structure

```
.
├── src/                    # React application source code
├── public/                 # Static assets
├── assets/                 # Images and media
├── server.ts              # Express server & API routes
├── vite.config.ts         # Vite build configuration
├── tsconfig.json          # TypeScript configuration
├── firebase-blueprint.json # Firebase data schema
├── firestore.rules        # Firestore security rules
├── package.json           # Dependencies
└── index.html             # Entry HTML
```

---

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server with tsx

# Production
npm run build        # Build with Vite + bundle server
npm run start        # Run production server

# Utilities
npm run preview      # Preview production build
npm run clean        # Remove dist and build artifacts
npm run lint         # Type check with TypeScript
```

---

## 🔌 API Endpoints

### POST `/api/evaluate-lesson`
Evaluate lesson content using AI or heuristic analysis.

**Request:**
```json
{
  "title": "Lesson Title",
  "content": "Lesson content text",
  "author": "Instructor Name",
  "courseCode": "SOM-101",
  "fileName": "lesson_file.docx"
}
```

**Response:**
```json
{
  "success": true,
  "evaluatedByAI": true,
  "summary": "Executive summary",
  "category": "Textbook",
  "keyTakeaways": ["takeaway1", "takeaway2"],
  "courseCode": "SOM-101"
}
```

### POST `/api/pull-from-github`
Pull latest code updates from the GitHub repository.

**Request:**
```json
{
  "repoUrl": "https://github.com/kpierre24/School-of-Ministry-2026.git"
}
```

---

## 🔐 Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Firestore Database
3. Import the schema from `firebase-blueprint.json`
4. Apply security rules from `firestore.rules`
5. Add your Firebase config to `.env`

---

## 📱 Features in Detail

### AI-Powered Lesson Evaluation
The app uses Google Gemini AI to intelligently analyze lesson materials:
- Auto-generates concise summaries suitable for course cards
- Categorizes materials (Textbook, Study Guide, Lecture Notes, etc.)
- Extracts key learning outcomes and ministerial takeaways
- Suggests or confirms course codes

Falls back to heuristic evaluation if API key is unavailable.

### Real-Time Collaboration
- All app state synced to Firebase Firestore
- Multi-user access with automatic synchronization
- Concurrent editing with conflict resolution
- Notification system for important updates

### Export & Reporting
- Download attendance reports as PDFs
- Export grade sheets and rubric scores
- Generate ZIP archives of course materials
- Create printable student rosters

---

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

```bash
npm run build
npm run start
```

### Custom Server
1. Build the project: `npm run build`
2. Deploy `dist/` folder and `dist/server.cjs`
3. Set `NODE_ENV=production`
4. Run: `node dist/server.cjs`

---

## 📋 Firebase Data Schema

### AppState Document
The application stores all data in a single Firestore document:

```
/app_states/{stateId}
├── records[]              # Attendance records
├── classDays[]            # Configured class sessions
├── studentNotes{}         # Student notes (keyed by name)
├── excusedAbsences{}      # Absence tracking
├── rubricScores{}         # Evaluation scores
├── customAssignments[]    # User-created assignments
├── submissions[]          # Assignment responses
├── notifications[]        # In-app notifications
├── studentPhotos{}        # Photo Data URLs
├── studentLevels{}        # Academic levels
├── deletedStudentNames[]  # Archived students
├── sheetUrl               # Google Sheets URL
├── updatedAt              # Last update timestamp
└── updatedBy              # Last update user
```

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 📞 Support

For issues, questions, or suggestions:
- Open an [Issue](https://github.com/kpierre24/School-of-Ministry-2026/issues)
- Check the [GitHub Discussions](https://github.com/kpierre24/School-of-Ministry-2026/discussions)
- Contact the development team

---

## 🙏 Acknowledgments

Built for the **HTEIM School of Ministry** with a focus on empowering theological education through modern technology and AI-assisted content management.

---

**Last Updated:** August 2026 | **Status:** Active Development
