# 📦 Release Process (Automated with GitHub Actions)

This project uses **automated releases** via GitHub Actions and [changesets](https://github.com/changesets/changesets).

## 🎯 TL;DR - For Contributors

1. Make your changes
2. Run `npm run changeset` to describe your changes
3. Commit and push (including the changeset file)
4. Open a PR
5. **That's it!** Release happens automatically when PR is merged ✨

---

## 🤖 How Automation Works

### 1️⃣ **When You Push Changes to a PR**

GitHub Actions runs automatically:

- ✅ Runs tests on Node 18, 20, 22
- ✅ Tests on Linux, macOS, Windows
- ✅ Checks linting and types
- ✅ Generates coverage report

### 2️⃣ **When PR is Merged to Main**

The **Changesets Bot** automatically:

1. Detects changeset files
2. Creates/updates a **"Release PR"** that:
   - Bumps version in `package.json`
   - Updates `CHANGELOG.md`
   - Deletes changeset files

### 3️⃣ **When Release PR is Merged**

GitHub Actions automatically:

1. Runs full test suite
2. Builds the package
3. **Publishes to npm** 🚀
4. Creates a GitHub Release
5. Tags the commit

**You never run `npm publish` manually!** 🎉

---

## 📝 Creating a Changeset

When you make changes that affect users, create a changeset:

```bash
npm run changeset
```

### Interactive Prompts

**1. What type of change?**

```
? Which packages would you like to include?
  ◉ @lisandrof/modkill
```

**2. Semver bump type:**

```
? What kind of change is this for @lisandrof/modkill?
  ○ patch   - Bug fix (0.1.0 → 0.1.1)
  ◉ minor   - New feature (0.1.0 → 0.2.0)
  ○ major   - Breaking change (0.1.0 → 1.0.0)
```

**3. Summary:**

```
? Please enter a summary for this change
  Added support for custom trash directories
```

This creates a file: `.changeset/random-name-abc123.md`

**Commit this file with your changes!**

---

## 🔄 Complete Workflow Example

```bash
# 1. Create feature branch
git checkout -b feat/custom-trash-dir

# 2. Make your changes
# ... code code code ...

# 3. Create changeset
npm run changeset
# Select: minor
# Write: "Added support for custom trash directories"

# 4. Commit everything (including .changeset/*.md)
git add .
git commit -m "feat: add custom trash directory support"

# 5. Push and open PR
git push origin feat/custom-trash-dir
# Open PR on GitHub

# 6. After PR is reviewed and merged...
# The bot automatically creates a "Release PR"

# 7. Maintainer merges the "Release PR"
# → Package is automatically published to npm! 🎉
```

---

## 🏗️ Version Types Explained

### Patch (0.1.0 → 0.1.1)

Bug fixes, documentation, internal improvements:

```bash
npm run changeset
# Select: patch
```

**Examples:**

- Fixed crash when scanning system directories
- Updated README examples
- Improved error messages

### Minor (0.1.0 → 0.2.0)

New features (backwards compatible):

```bash
npm run changeset
# Select: minor
```

**Examples:**

- Added `--exclude` flag
- New JSON output format
- Support for pnpm workspaces

### Major (0.1.0 → 1.0.0)

Breaking changes:

```bash
npm run changeset
# Select: major
```

**Examples:**

- Changed CLI argument names
- Removed deprecated flags
- Changed output format

---

## 🔧 Setup for Maintainers

### Required GitHub Secrets

In your GitHub repo settings (`Settings → Secrets and variables → Actions`), add:

#### 1. `NPM_TOKEN` (Required for publishing)

Get your npm token:

```bash
npm login
npm token create --cidr=0.0.0.0/0
```

Or on [npmjs.com](https://www.npmjs.com/settings/YOUR_USERNAME/tokens):

- Click "Generate New Token"
- Choose "Automation"
- Copy the token

Add to GitHub:

- Name: `NPM_TOKEN`
- Value: `npm_xxxxxxxxxxxxxxxxxxxx`

#### 2. `CODECOV_TOKEN` (Optional - for coverage reports)

Get from [codecov.io](https://codecov.io/) after connecting your repo.

### Verify Automation is Working

1. **Push a test change** with a changeset
2. **Check GitHub Actions** tab - CI should run
3. **Merge a PR** - Release PR should be created
4. **Merge Release PR** - Package should publish

---

## 📊 What Gets Generated

### `.changeset/*.md` Files

Temporary change descriptions:

```md
---
'@lisandrof/modkill': minor
---

Added support for custom trash directories
```

### CHANGELOG.md

Auto-generated from changesets:

```md
## 0.2.0

### Minor Changes

- Added support for custom trash directories

### Patch Changes

- Fixed crash when scanning system directories
- Updated README examples
```

### GitHub Release

Automatically created with:

- Version tag (e.g., `v0.2.0`)
- Release notes from CHANGELOG
- Link to npm package

---

## 🚫 What NOT to Do

❌ **Don't manually edit `CHANGELOG.md`** - it's auto-generated
❌ **Don't manually bump `package.json` version** - changesets handles it
❌ **Don't run `npm publish`** - GitHub Actions does it
❌ **Don't commit `node_modules/`** or `dist/` - they're gitignored
❌ **Don't skip creating changesets** - they're required for releases

---

## ✅ Checklist for Contributors

Before opening a PR, ensure:

- [ ] Code changes are complete
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Types are correct (`npm run typecheck`)
- [ ] **Changeset created** (`npm run changeset`)
- [ ] Changeset file committed (`.changeset/*.md`)
- [ ] PR description explains the change

---

## 🆘 Troubleshooting

### "Release PR not created"

**Cause:** No changesets were merged
**Fix:** Make sure you committed the `.changeset/*.md` file

### "npm publish failed"

**Causes:**

1. `NPM_TOKEN` secret not set
2. Token expired or invalid
3. Version already published

**Fix:** Check GitHub Actions logs for details

### "Tests failed in CI but pass locally"

**Causes:**

- Platform-specific issue (Windows vs Mac vs Linux)
- Node version difference
- Missing dependency

**Fix:** Check the failing matrix combination in Actions logs

### "Can't merge Release PR"

**Cause:** CI checks haven't passed
**Fix:** Wait for checks to complete or fix failing tests

---

## 📚 Learn More

- [Changesets Documentation](https://github.com/changesets/changesets)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [npm Publishing](https://docs.npmjs.com/cli/v8/commands/npm-publish)

---

## 🎉 Benefits of This Setup

✅ **No manual version bumps** - automated
✅ **Consistent changelog** - generated from changesets
✅ **Multiple contributors** - everyone can trigger releases
✅ **Rollback friendly** - git history shows exact changes
✅ **CI/CD integrated** - tests before every release
✅ **Transparent** - all releases visible in PRs

---

**Questions?** Check [CONTRIBUTING.md](.github/CONTRIBUTING.md) or open an issue!
