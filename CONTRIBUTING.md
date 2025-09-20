# Contributing to modkill

First off, thank you for considering contributing to modkill! 🎉

## Code of Conduct

Be respectful and inclusive. We're all here to make developers' lives better.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- Your OS and Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Error messages/screenshots
- Command you ran

### Suggesting Features

- Check if it's already suggested
- Provide clear use cases
- Explain why it benefits most users
- Consider implementation complexity

### Pull Requests

1. Fork the repo and create your branch from `main`
2. Run `npm install` to setup
3. Make your changes
4. Add/update tests as needed
5. Ensure `npm test` passes
6. Run `npm run lint` and fix issues
7. Update documentation if needed
8. Create a PR with clear description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/modkill.git
cd modkill

# Install dependencies
npm install

# Run in dev mode
npm run dev

# Run tests in watch mode
npm test -- --watch

# Build
npm run build

# Test the CLI locally
npm link
modkill --help
```

## Project Structure

```
src/
├── cli.ts           # Entry point
├── core/            # Core business logic
├── commands/        # Command implementations
├── ui/              # UI components
└── utils/           # Utilities
```

## Testing

- Write tests for new features
- Maintain >80% coverage
- Test edge cases
- Use meaningful test descriptions

```bash
# Run all tests
npm test

# Run specific test
npm test scanner

# Check coverage
npm run test:coverage
```

## Coding Style

- TypeScript with strict mode
- Functional style where possible
- Clear variable/function names
- JSDoc for public APIs
- Handle errors gracefully

## Commit Messages

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style (formatting)
- `refactor:` Code change that neither fixes nor adds
- `perf:` Performance improvement
- `test:` Adding tests
- `chore:` Maintenance

Examples:

```
feat: add --exclude option for custom paths
fix: handle permission errors gracefully
docs: update README with new examples
```

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create PR to main
4. After merge, manually publish to npm with `npm publish --access public`

## Questions?

Feel free to open an issue for any questions!
