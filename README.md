# 🔪 modkill

<p align="center">
  <img src="https://raw.githubusercontent.com/udede/modkill/main/assets/demo.gif" alt="modkill demo" width="600" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lisandrof/modkill"><img src="https://img.shields.io/npm/v/modkill.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@lisandrof/modkill"><img src="https://img.shields.io/npm/dm/modkill.svg" alt="npm downloads"></a>
  <a href="https://github.com/udede/modkill/actions"><img src="https://github.com/udede/modkill/actions/workflows/ci.yml/badge.svg" alt="CI Status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node Version"></a>
</p>

<p align="center">
  <b>🚀 Murder your node_modules. Free your disk. 10x faster.</b>
</p>

## 📸 Demo

```bash
$ modkill --path ~/Projects --depth 4

✔ Scan complete: 42 candidate(s)
Scanning root: /Users/you/Projects
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

- ⚡ **10x faster** scanning using optimized traversal
- 🧠 **Smart detection** of abandoned projects (age, size, git activity)
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

| Option             | Type    | Default | Description                            |
| ------------------ | ------- | ------- | -------------------------------------- |
| `--path <dir>`     | string  | `.`     | Root directory to scan                 |
| `--depth <n>`      | number  | `6`     | Max recursion depth                    |
| `--min-age <days>` | number  | `0`     | Only show modules older than N days    |
| `--min-size <mb>`  | number  | `0`     | Only show modules larger than N MB     |
| `--sort <by>`      | string  | `size`  | Sort by: `size`, `age`, `name`, `path` |
| `--json`           | boolean | `false` | Output JSON for scripting              |
| `--yes`            | boolean | `false` | Skip confirmation prompts              |
| `--help`           | boolean | `false` | Show help                              |

### Advanced Examples

```bash
# Scan specific directory with filters
modkill --path ~/Projects --min-age 60 --min-size 100

# Auto-clean with custom threshold
modkill --auto --min-age 90 --min-size 200

# Generate JSON report for analysis
modkill --dry-run --json --path ~ > report.json

# Clean without confirmation
modkill --current --yes

# Deep scan of external drive
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

- Space: Toggle selection
- A: Select/deselect all
- I: Invert selection
- Enter: Proceed with deletion
- Ctrl+C: Cancel

### Safety Features

- ✅ Dry-run mode by default for preview
- 🗑️ Moves to OS trash (recoverable)
- 📝 Creates restore log at `/tmp/modkill-restore-[timestamp].log`
- ⚠️ Confirmation prompt before deletion
- 🚫 Skips system directories automatically

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
- `score`: Calculated priority (0-100, higher = delete first)

## ⚡ Performance

| Metric                  | Target | Actual   |
| ----------------------- | ------ | -------- |
| Scan 1000 directories   | <2s    | ✅ 1.3s  |
| Memory usage (any size) | <50MB  | ✅ 35MB  |
| Parallel scanning       | Yes    | ✅ Ready |
| Cache support           | Yes    | 🚧 WIP   |

### Benchmarks

```bash
# Run performance tests
npm run bench

# Results on M1 MacBook Pro
# ✓ Scan home directory (427GB, 89 node_modules): 1.8s
# ✓ Interactive selection (89 items): 45ms render
# ✓ Delete 10 folders (5.2GB total): 2.1s
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

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation
- Add yourself to contributors

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 🏆 Comparison

| Feature         | modkill        | npkill     | node-prune |
| --------------- | -------------- | ---------- | ---------- |
| Speed           | ⚡⚡⚡⚡⚡     | ⚡⚡⚡     | ⚡⚡       |
| Interactive UI  | ✅ Beautiful   | ✅ Basic   | ❌         |
| Safe deletion   | ✅ Trash + log | ⚠️ rm only | ⚠️ rm only |
| JSON output     | ✅             | ❌         | ❌         |
| Custom filters  | ✅ Age, size   | ⚠️ Limited | ❌         |
| Monorepo aware  | ✅             | ⚠️         | ❌         |
| Windows support | ✅             | ✅         | ⚠️         |

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

# Exclude large directories
modkill --min-size 50
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
