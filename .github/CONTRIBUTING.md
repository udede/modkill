# Contributing to modkill

Thank you for your interest in contributing to modkill! 🎉

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Commit Guidelines](#commit-guidelines)
- [Testing](#testing)
- [Release Process](#release-process)

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/modkill.git
   cd modkill
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Create a branch** for your changes:
   ```bash
   git checkout -b feat/my-awesome-feature
   ```

## 💻 Development Workflow

### Available Scripts

```bash
# Development mode with watch
npm run dev

# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Check test coverage
npm run test:coverage

# Lint and auto-fix
npm run lint

# Type check
npm run typecheck

# Format code
npm run format
```

### Project Structure

```
modkill/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── commands/           # Command implementations
│   ├── core/              # Core business logic
│   ├── ui/                # UI components (logger, etc.)
│   └── utils/             # Utility functions
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
└── dist/                  # Build output (generated)
```

## 🔄 Pull Request Process

1. **Update your fork** before starting:

   ```bash
   git remote add upstream https://github.com/udede/modkill.git
   git fetch upstream
   git merge upstream/main
   ```

2. **Make your changes** and ensure:
   - ✅ Tests pass: `npm test`
   - ✅ Linting passes: `npm run lint`
   - ✅ Types are correct: `npm run typecheck`
   - ✅ Build succeeds: `npm run build`

3. **Add tests** for new features

4. **Create a changeset** to describe your changes:

   ```bash
   npm run changeset
   ```

   - Choose the appropriate change type (patch/minor/major)
   - Write a clear description (this will appear in the changelog)

5. **Commit your changes**:

   ```bash
   git add .
   git commit -m "feat: add awesome feature"
   ```

6. **Push to your fork**:

   ```bash
   git push origin feat/my-awesome-feature
   ```

7. **Open a Pull Request** on GitHub with:
   - Clear title describing the change
   - Description of what changed and why
   - Link to related issues (if any)

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style (formatting, semicolons, etc.)
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `perf:` Performance improvement
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, dependencies, etc.

### Examples

```bash
feat: add support for custom scan depth
fix: handle permission errors gracefully
docs: update README with new examples
test: add tests for scanner edge cases
chore: update dependencies
```

## 🧪 Testing

### Writing Tests

- Place tests in `tests/unit/`, `tests/integration/`, or `tests/e2e/`
- Test files should end with `.test.ts`
- Aim for >80% coverage for new code

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { YourFunction } from '../src/your-module';

describe('YourFunction', () => {
  it('should do something correctly', () => {
    const result = YourFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(() => YourFunction(null)).toThrow();
  });
});
```

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific file
npm test scanner
```

## 📦 Release Process

Releases are **automated** via GitHub Actions and changesets:

1. Developers create changesets with their PRs (`npm run changeset`)
2. When PR is merged, a bot creates/updates a "Release PR"
3. When the "Release PR" is merged:
   - Version is bumped automatically
   - CHANGELOG.md is updated
   - Package is published to npm
   - GitHub release is created

**You don't need to manually handle releases!** 🎉

## 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/udede/modkill/issues/new) with:

- **Title**: Clear, descriptive summary
- **Description**: What happened vs. what you expected
- **Steps to reproduce**: Detailed steps
- **Environment**:
  - OS (macOS, Windows, Linux)
  - Node.js version (`node --version`)
  - modkill version (`modkill --version`)
- **Error messages/screenshots** if applicable

## 💡 Feature Requests

Have an idea? [Open an issue](https://github.com/udede/modkill/issues/new) with:

- **Clear description** of the feature
- **Use case**: Why is this needed?
- **Proposed solution** (optional)
- **Alternatives considered** (optional)

## ❓ Questions

- Check [README.md](../README.md) first
- Check existing [issues](https://github.com/udede/modkill/issues)
- Open a new issue with the `question` label

## 🏆 Recognition

Contributors are automatically added to the release notes! Thank you for making modkill better! 🙏

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
