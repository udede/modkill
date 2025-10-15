# 🚀 Project Setup Guide

Quick guide for setting up this project for automated releases.

## 📋 Prerequisites

- GitHub account
- npm account ([signup here](https://www.npmjs.com/signup))
- Repository on GitHub

## 🔑 Step 1: Configure npm Token

### Create npm Token

1. Login to npm:

   ```bash
   npm login
   ```

2. Create an automation token:

   ```bash
   npm token create
   ```

   Or via web:
   - Go to [npmjs.com/settings/YOUR_USERNAME/tokens](https://www.npmjs.com/settings/)
   - Click "Generate New Token"
   - Select "**Automation**" type
   - Copy the token (starts with `npm_`)

### Add to GitHub Secrets

1. Go to your GitHub repo
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_MODKILL_TOKEN`
5. Value: Paste your npm token
6. Click **Add secret**

## 📊 Step 2: Configure Codecov (Optional)

For code coverage reports:

1. Go to [codecov.io](https://codecov.io/)
2. Sign in with GitHub
3. Add your repository
4. Copy the upload token
5. Add to GitHub Secrets as `CODECOV_TOKEN`

## ⚙️ Step 3: Enable GitHub Actions

1. Go to your repo's **Actions** tab
2. If prompted, click "**I understand my workflows, go ahead and enable them**"

## 🏷️ Step 4: Configure Repository Settings

### Branch Protection (Recommended)

1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
5. Select status checks:
   - ✅ All test matrix combinations
6. Save changes

### General Settings

1. **Settings** → **General**
2. Enable:
   - ✅ Allow merge commits
   - ✅ Allow squash merging
   - ✅ Automatically delete head branches

## 📦 Step 5: Verify Package Configuration

Check `package.json`:

```json
{
  "name": "@lisandrof/modkill",
  "version": "0.1.0",
  "description": "🔪 Murder your node_modules. Free your disk. 10x faster.",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/udede/modkill.git"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

For **scoped packages** (@username/package), ensure `publishConfig.access` is `"public"`.

## 🧪 Step 6: Test the Workflow

### Create a Test PR

```bash
# 1. Create a branch
git checkout -b test/automation

# 2. Make a small change (e.g., update README)
echo "\n## Test" >> README.md

# 3. Create a changeset
npm run changeset
# Select: patch
# Write: "Test automation setup"

# 4. Commit and push
git add .
git commit -m "test: verify automation"
git push origin test/automation

# 5. Open PR on GitHub
```

### What Should Happen

1. **CI runs** automatically
   - Tests on multiple Node versions
   - Tests on Linux, macOS, Windows
   - Linting and type checking

2. **After merging PR:**
   - Changesets bot creates a "Release PR"
   - Release PR shows version bump and changelog

3. **After merging Release PR:**
   - Package publishes to npm
   - GitHub release created
   - Git tag created

## ✅ Verification Checklist

- [ ] `NPM_MODKILL_TOKEN` secret added to GitHub
- [ ] GitHub Actions enabled
- [ ] Branch protection rules configured
- [ ] Test PR created and merged
- [ ] Release PR created automatically
- [ ] Package published to npm successfully

## 🆘 Common Issues

### Issue: CI fails with "npm ci" error

**Solution:**

```bash
# Locally, regenerate lock file
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "chore: update lockfile"
```

### Issue: "npm publish" fails with 403

**Causes:**

1. `NPM_MODKILL_TOKEN` not set or invalid
2. Package name already taken
3. No permission for scoped package

**Solutions:**

- Verify token in GitHub Secrets
- Change package name if taken
- Ensure `publishConfig.access: "public"` for scoped packages

### Issue: No Release PR created

**Cause:** No changeset files in merged PR

**Solution:** Always run `npm run changeset` and commit the file

### Issue: Codecov upload fails

**Solution:** This is optional and can be ignored, or:

1. Check `CODECOV_TOKEN` is correct
2. Repository is added to Codecov
3. Coverage report is being generated

## 📚 Next Steps

Once setup is complete:

1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Review [RELEASE.md](../RELEASE.md)
3. Start contributing!

## 🔒 Security Notes

- **Never commit secrets** to git
- Rotate tokens periodically
- Use automation tokens (not classic tokens)
- Enable 2FA on npm account
- Review GitHub Actions logs for sensitive data

## 🆘 Need Help?

- Check [GitHub Actions logs](../../actions)
- Review [changesets docs](https://github.com/changesets/changesets)
- Open an issue

---

**Setup complete?** 🎉 You're ready for automated releases!
