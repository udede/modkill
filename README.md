# 🔪 modkill

<p align="center">
  <img src="https://raw.githubusercontent.com/udede/modkill/main/assets/poster.png" alt="modkill poster" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lisandrof/modkill"><img src="https://img.shields.io/npm/v/%40lisandrof%2Fmodkill?style=flat-square&logo=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@lisandrof/modkill"><img src="https://img.shields.io/npm/dm/%40lisandrof%2Fmodkill?style=flat-square&logo=npm" alt="downloads"></a>
  <a href="https://github.com/udede/modkill/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/udede/modkill/ci.yml?branch=main&style=flat-square&logo=github&label=tests" alt="tests"></a>
  <a href="https://github.com/udede/modkill"><img src="https://img.shields.io/badge/coverage-58%25-orange?style=flat-square" alt="coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square&logo=node.js" alt="node"></a>
</p>

<p align="center">
  <b>🚀 Murder your node_modules. Free your disk. Lightning fast.</b>
</p>

## 📸 Demo

```bash
$ modkill --path ~/Projects --depth 4

✔ Scan complete: 42 candidate(s)

Project (relative path below)                     Size         Age
◉ old-project                                   1.98 GB       482d
  old-project/frontend
◉ abandoned-poc                                  856 MB       127d
  experiments/abandoned-poc
◯ active-project                                 328 MB         3d
  work/active-project

Total to free: 2.8 GB
? Proceed to delete 2 folders? (y/N)
```

## 🎯 Why modkill?

Every developer's disk is littered with forgotten `node_modules` folders:

- **Gigabytes wasted**: Each project can have 100MB-2GB of dependencies
- **Accumulation**: Old projects, experiments, tutorials pile up over months
- **Hidden bloat**: Nested in various directories, hard to find manually

**modkill** solves this with:

- ⚡ **Fast scanning** using optimized filesystem traversal
- 🧠 **Smart detection** of abandoned projects by age and size
- 🛡️ **Safe by default** with dry-run, trash, and restore logs
- 🎨 **Beautiful UX** with interactive selection and progress indicators
- 🔧 **Flexible** with JSON output for automation

## 📦 Installation

```bash
# Quick one-time use
npx @lisandrof/modkill

# Global install
npm install -g @lisandrof/modkill

# Using Yarn
yarn global add @lisandrof/modkill

# Using pnpm
pnpm add -g @lisandrof/modkill
```

### Requirements

- Node.js 18.0.0 or higher
- macOS, Linux, or Windows
- 50MB free RAM

## 🚀 Quick Start

```bash
# Interactive mode - select what to delete
modkill

# Scan your entire home directory
modkill --path ~ --depth 4

# Auto-clean old modules (>30 days)
modkill --auto

# Preview without deleting anything
modkill --dry-run

# Clean current project only
modkill --current
```

## 📖 Commands & Options

### Basic Commands

| Command             | Description                                |
| ------------------- | ------------------------------------------ |
| `modkill`           | Interactive mode with checkbox selection   |
| `modkill --auto`    | Automatically clean old modules (>30 days) |
| `modkill --dry-run` | Preview what would be deleted              |
| `modkill --current` | Clean only current directory               |

### Options

| Option             | Type    | Default | Description                               |
| ------------------ | ------- | ------- | ----------------------------------------- |
| `--path <dir>`     | string  | `.`     | Root directory to scan                    |
| `--depth <n>`      | number  | `6`     | Max recursion depth                       |
| `--min-age <days>` | number  | `0`     | Only show modules older than N days       |
| `--min-size <mb>`  | number  | `0`     | Only show modules larger than N MB        |
| `--sort <by>`      | string  | `size`  | One of: `size`, `age`, `name`, `path`     |
| `--json`           | boolean | `false` | Output JSON for scripting                 |
| `--yes`            | boolean | `false` | Skip confirmation (interactive mode only) |
| `--help`           | boolean | `false` | Show help                                 |

### Advanced Examples

```bash
# Auto-clean with age and size filters
modkill --path ~/Projects --min-age 60 --min-size 100

# Auto-clean with custom thresholds
modkill --auto --min-age 90 --min-size 200

# Generate JSON report for analysis
modkill --dry-run --json --path ~ > report.json

# Clean current directory (no confirmation by design)
modkill --current

# Auto-clean only large modules (>200MB)
modkill --min-size 200

# Focus on abandoned projects (oldest first, interactive)
modkill --path ~ --sort age

# Deep scan of an external drive
modkill --path /Volumes/Backup --depth 10
```

## 🎨 Interactive Mode Features

### Smart Table Display

- **Project name** with color coding:
  - 🔴 Red: >60 days old
  - 🟡 Yellow: 30-60 days old
  - 🟢 Green: <30 days old
- **Size** in human-readable format (KB, MB, GB)
- **Age** in days or months
- **Path** shown as subtitle (relative to scan root)

### Selection Interface

- Space: Select/deselect item
- A: Toggle all
- I: Invert selection
- Enter: Proceed with deletion
- Ctrl+C: Cancel

### Safety Features

- ✅ Interactive preview with confirmation prompt
- 🗑️ Moves to OS trash (recoverable)
- 📝 Creates restore log in system temp directory (`modkill-restore-[timestamp].log`)
- ⚠️ Dry-run mode available for risk-free preview
- 🚫 Skips system directories automatically

### How it decides

- Filter: applies `--min-age` and `--min-size` when provided
- Sorting: default by `size` (use `--sort age|name|path` to override)
- Pre-selection (interactive): auto-selects items older than 30 days
- Scoring: weighted formula `ageScore×0.5 + sizeScore×0.4 + orphanBonus×0.1`
- Colors: 🟢 ≤30d, 🟡 31–60d, 🔴 >60d

## 📊 JSON Output Schema

```json
[
  {
    "path": "/absolute/path/to/node_modules",
    "sizeBytes": 134217728,
    "mtimeMs": 1699564800000,
    "hasPackageJson": true,
    "ageDays": 45.5,
    "score": 67.3
  }
]
```

Fields:

- `path`: Absolute path to node_modules folder
- `sizeBytes`: Total size in bytes
- `mtimeMs`: Last modified timestamp (milliseconds)
- `hasPackageJson`: Whether parent has package.json
- `ageDays`: Days since last modification
- `score`: Heuristic priority score (weighted by age, size, and orphan status)

## ⚡ Performance

| Metric              | Result   |
| ------------------- | -------- |
| Scan home (277GB)   | 52.7s    |
| Memory usage (peak) | <50MB    |
| Single project scan | 0.21s    |

### Benchmarks

Tested on M-series Mac:

```bash
# Scan home directory (277GB, depth 6)
✓ Found 54 node_modules totaling 18GB in 52.7s

# Scan projects directory
✓ Found 11 node_modules totaling 4.7GB in 47.9s

# Scan current project
✓ Found 1 node_modules in 0.21s
```

## 🛠️ Development

### Setup

```bash
# Clone repository
git clone https://github.com/udede/modkill.git
cd modkill

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Link for local testing
npm link
```

### Scripts

| Script           | Description                  |
| ---------------- | ---------------------------- |
| `npm run dev`    | Watch mode with auto-rebuild |
| `npm run build`  | Build for production         |
| `npm test`       | Run all tests                |
| `npm run lint`   | Lint and fix code            |
| `npm run format` | Format with Prettier         |
| `npm run bench`  | Run benchmarks               |

### Project Structure

```
modkill/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── core/               # Core logic
│   │   ├── scanner.ts      # Filesystem traversal
│   │   ├── analyzer.ts     # Filtering & scoring
│   │   └── cleaner.ts      # Safe deletion
│   ├── commands/           # Command handlers
│   └── ui/                 # UI components
├── tests/                  # Test suites
└── dist/                   # Built files
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific suite
npm test scanner

# E2E tests
npm run test:e2e
```

## 🤝 Contributing

We love contributions! This project uses **automated releases** with changesets.

### Quick Start

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Add tests for new features
5. Create a changeset: `npm run changeset`
6. Commit your changes (including the changeset file)
7. Push and open a Pull Request

For detailed guidelines, see:

- 📖 [Contributing Guide](.github/CONTRIBUTING.md)
- 🚀 [Release Process](RELEASE.md)
- ⚙️ [Setup Guide](.github/SETUP.md) (for maintainers)

### Automated Releases

This project uses GitHub Actions for automated releases:

- ✅ CI runs on every PR
- ✅ Changesets bot creates release PRs automatically
- ✅ Packages publish to npm automatically when release PR is merged
- ✅ Changelog is auto-generated

No manual `npm publish` needed! 🎉

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 🏆 Comparison

| Feature         | modkill                | npkill       | node-prune   |
| --------------- | ---------------------- | ------------ | ------------ |
| Speed           | ⚡⚡⚡⚡⚡ Optimized | ⚡⚡⚡       | ⚡⚡         |
| Interactive UI  | ✅ Rich & colorful  | ✅ Basic     | ❌           |
| Safe deletion   | ✅ Trash + log      | ⚠️ Permanent | ⚠️ Permanent |
| JSON output     | ✅                  | ❌           | ❌           |
| Custom filters  | ✅ Age, size        | ⚠️ Limited   | ❌           |
| Monorepo aware  | ✅ Depth control    | ⚠️           | ❌           |
| Windows support | ✅                  | ✅           | ⚠️           |

## 🐛 Troubleshooting

### Common Issues

**Permission denied**

```bash
# Run with sudo if scanning system directories
sudo modkill --path /usr/local
```

**Slow scanning**

```bash
# Reduce depth for faster scans
modkill --depth 3

# Auto-clean only large folders (>100MB) for faster cleanup
modkill --min-size 100
```

**Not finding modules**

```bash
# Increase depth
modkill --depth 10

# Check specific path
modkill --path ./my-project
```

## 📄 License

MIT © [Francesco Lisandro](https://youdede.eu)

---

<p align="center">
  Made with ❤️ by developers, for developers
  <br>
  <a href="https://github.com/udede/modkill">⭐ Star on GitHub</a>
</p>
