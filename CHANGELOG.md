# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Enhanced student analytics dashboard
- Multi-language support for international schools
- Mobile app (React Native)
- Advanced reporting and data export features
- Student progress tracking and milestones
- Parent/guardian portal
- Automated email notifications

## [0.1.0] - 2026-08-04

### Added
- Initial release of School of Ministry platform
- **Course & Content Management**
  - AI-powered lesson evaluation using Google Gemini
  - Multi-format document support (DOCX, CSV, text)
  - Course coding system for lesson organization
  - Centralized material library
  - Content metadata tracking

- **Student Management**
  - Comprehensive student roster with photos
  - Student profiles with notes and levels
  - Photo management and display
  - Student search and filtering

- **Attendance Tracking**
  - Daily attendance marking
  - Excused absence management
  - Attendance reports and analytics
  - Historical attendance data

- **Assessment & Grading**
  - Custom rubric scoring system
  - Assignment creation and tracking
  - Student submission collection
  - Performance analytics with charts

- **Administrative Features**
  - Google Sheets integration
  - PDF export for reports and documents
  - ZIP archive generation for batch exports
  - Multi-device synchronization via Firebase
  - Real-time notifications

- **Technical Features**
  - React 19 frontend with TypeScript
  - Express.js backend
  - Firebase Firestore for data persistence
  - Google Gemini AI integration
  - Responsive design with Tailwind CSS
  - Vite build system for optimal performance

- **Infrastructure**
  - GitHub repository and version control
  - Firebase Firestore configuration
  - Security rules for Firestore
  - Environment configuration templates
  - Comprehensive documentation

### Initial Stack
- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: Express.js, Node.js
- Database: Firebase Firestore
- AI: Google Gemini Flash
- Additional Libraries: html2canvas, jsPDF, jszip, Mammoth, Recharts
- Deployment: Vercel

---

## Version History Details

### Release Format
- **Version**: MAJOR.MINOR.PATCH
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes and improvements

### Release Process
1. All changes merged to `develop` branch
2. Create PR from `develop` to `main` for release
3. Tag commit with version number
4. Update CHANGELOG.md
5. Create GitHub Release with notes

### Release Notes Template
```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Security
- Security fixes and improvements
```

---

## How to Contribute

When you add a feature or fix a bug, update this CHANGELOG:

1. Add your change under an appropriate section (Added, Changed, Fixed, etc.)
2. Use clear, descriptive language
3. Include PR/issue references: `(#123)`
4. Keep changes organized by feature area

### Example Entry
```markdown
### Added
- New student analytics dashboard with performance charts (#45)
- Support for CSV bulk student import (#47)
```

---

## Maintenance

- **Active Development**: Current version receives features and enhancements
- **Bug Fixes**: All supported versions receive security and critical bug fixes
- **Deprecation**: Features are deprecated for at least one major version before removal

---

**Last Updated**: August 4, 2026
