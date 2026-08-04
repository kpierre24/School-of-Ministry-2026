# Contributing to School of Ministry 2026

Thank you for your interest in contributing to the School of Ministry platform! We welcome contributions from educators, developers, and community members. This document provides guidelines and instructions for contributing.

## 🤝 Code of Conduct

Please be respectful and constructive in all interactions. We are committed to fostering an inclusive and welcoming community for everyone.

## 🐛 Reporting Bugs

Found a bug? Please help us by reporting it!

### Before Submitting a Bug Report
- Check the [existing issues](https://github.com/kpierre24/School-of-Ministry-2026/issues) to avoid duplicates
- Verify the bug still exists on the latest code
- Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

### How to Submit a Bug Report
1. Use the [Bug Report template](/.github/ISSUE_TEMPLATE/bug_report.md)
2. Include a clear title and description
3. Provide step-by-step reproduction instructions
4. Include screenshots or error logs
5. Specify your environment (OS, Node version, etc.)

## ✨ Suggesting Features

Have an idea to improve the platform?

### Before Submitting a Feature Request
- Check the [existing issues](https://github.com/kpierre24/School-of-Ministry-2026/issues)
- Search closed issues to understand previous discussions
- Consider if the feature aligns with the project's goals

### How to Submit a Feature Request
1. Use the [Feature Request template](/.github/ISSUE_TEMPLATE/feature_request.md)
2. Provide a clear use case
3. Explain the expected behavior
4. Suggest implementation approaches if possible

## 💻 Development Workflow

### Prerequisites
- Node.js v18+
- npm or Yarn
- Git
- Firebase account
- Google Gemini API key (optional)

### Setting Up Your Development Environment

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/School-of-Ministry-2026.git
   cd School-of-Ministry-2026
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Update .env with your Firebase and Gemini credentials
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Run linting**
   ```bash
   npm run lint
   ```

### Code Style Guidelines

We follow these conventions to maintain code quality:

#### TypeScript
- Use strict type checking
- Avoid `any` types when possible
- Export interfaces in `.d.ts` files when appropriate
- Document complex types with JSDoc comments

#### React Components
```typescript
interface ComponentProps {
  title: string;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

/**
 * Brief description of the component
 * @param props - Component properties
 * @returns Rendered component
 */
export const MyComponent: React.FC<ComponentProps> = ({
  title,
  onSubmit,
  isLoading = false,
}) => {
  return (
    <div>
      {/* Implementation */}
    </div>
  );
};
```

#### File Naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `types.ts` or `module.d.ts`
- Constants: `UPPER_CASE.ts`

#### Formatting
- Use Prettier for code formatting
- Line length: 100 characters
- Use single quotes for strings
- 2-space indentation
- Trailing commas in multi-line structures

### Git Commit Messages

Follow conventional commit format:

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/changes
- `chore`: Build, dependencies, etc.

**Examples:**
```
feat(lesson): add AI-powered evaluation endpoint

fix(auth): resolve Firebase token expiration issue

docs(readme): update installation instructions

refactor(student-list): improve performance with memoization
```

## 📤 Submitting a Pull Request

1. **Keep it focused**
   - One feature or bug fix per PR
   - Limit scope to keep reviews manageable

2. **Update documentation**
   - Update README if needed
   - Add JSDoc comments for new functions
   - Update relevant docs in `/docs` folder

3. **Test thoroughly**
   - Run `npm run lint` for type checking
   - Test in development: `npm run dev`
   - Test production build: `npm run build && npm run preview`

4. **Submit your PR**
   - Use the [Pull Request template](/.github/pull_request_template.md)
   - Link related issues with "Fixes #123"
   - Provide clear description of changes
   - Include screenshots for UI changes

5. **Respond to feedback**
   - Be open to suggestions
   - Explain your reasoning when needed
   - Update PR based on review feedback

### PR Review Checklist

Before submitting, ensure:
- [ ] TypeScript types are correct (`npm run lint`)
- [ ] Code follows project style guidelines
- [ ] Commit messages are clear and descriptive
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Changes are tested locally
- [ ] Related issues are linked

## 📚 Project Structure

```
.
├── src/                    # React source code
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── App.tsx            # Main app component
├── docs/                  # Documentation
├── .github/               # GitHub configs
│   ├── ISSUE_TEMPLATE/    # Issue templates
│   └── pull_request_template.md
├── server.ts              # Express server
├── firebase-blueprint.json # Firebase schema
├── vite.config.ts         # Vite configuration
└── tsconfig.json          # TypeScript config
```

## 🧪 Testing

We use Jest for unit testing. When adding features:

1. **Write tests alongside features**
2. **Run tests locally**
   ```bash
   npm test
   ```
3. **Aim for >80% coverage** for critical code
4. **Test edge cases and error scenarios**

Example test:
```typescript
describe('evaluateLesson', () => {
  it('should return structured evaluation', async () => {
    const result = await evaluateLesson({
      title: 'Test Lesson',
      content: 'Sample content',
    });
    expect(result.summary).toBeDefined();
    expect(result.category).toBeDefined();
  });
});
```

## 📖 Documentation

- Keep README.md updated
- Update relevant docs in `/docs` folder
- Add inline code comments for complex logic
- Update API documentation for endpoint changes
- Add examples for new features

## 🚀 Release Process

Maintainers follow semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## ❓ Questions?

- Check existing [Issues](https://github.com/kpierre24/School-of-Ministry-2026/issues)
- Review [Documentation](docs/README.md)
- Open a discussion in [GitHub Discussions](https://github.com/kpierre24/School-of-Ministry-2026/discussions)

## 🎉 Thank You!

Your contributions help make theological education more accessible and effective. We appreciate your time and effort!

---

**Happy Contributing!** 🙏