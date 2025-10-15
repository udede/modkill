# 🤖 AI-Powered Changeset Generation

This project supports **AI-powered automatic changeset generation**!

## 🚀 Quick Start

### Local Usage (Recommended)

```bash
# 1. Set API key (one-time setup)
export ANTHROPIC_API_KEY=sk-ant-your-key-here
# or
export OPENAI_API_KEY=sk-your-key-here

# 2. Make your changes
# ... code code code ...

# 3. Generate changeset with AI
npm run changeset:ai

# 4. Review and commit
git add .changeset
git commit -m "chore: add changeset"
```

### GitHub Actions (Automatic on PR)

When you open a PR without a changeset:

1. 🤖 AI automatically analyzes your changes
2. 📝 Generates appropriate changeset
3. 💬 Comments on PR with details
4. ✅ Commits changeset to your PR branch

**Zero effort!**

---

## 🔧 Setup

### Option 1: Anthropic Claude (Recommended)

**Why Claude?**

- More accurate at analyzing code
- Better at understanding semantic changes
- Clearer descriptions

**Get API Key:**

1. Go to https://console.anthropic.com/
2. Sign up / Login
3. Create API key
4. Copy key (starts with `sk-ant-`)

**Set locally:**

```bash
# Add to .env
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > .env

# Or export in shell
export ANTHROPIC_API_KEY=sk-ant-your-key
```

**Set on GitHub:**

1. Go to: https://github.com/udede/modkill/settings/secrets/actions
2. New secret: `ANTHROPIC_API_KEY`
3. Paste your key

### Option 2: OpenAI GPT-4

**Get API Key:**

1. Go to https://platform.openai.com/api-keys
2. Create new key
3. Copy key

**Set locally:**

```bash
export OPENAI_API_KEY=sk-your-key
```

**Set on GitHub:**
Add `OPENAI_API_KEY` secret.

---

## 💡 How It Works

### AI Analysis

The AI analyzes:

- 📄 **Files changed** - what parts of codebase affected
- 📊 **Git diff** - actual code changes
- 💬 **Commit messages** - developer intent
- 🔍 **Code context** - semantic meaning

Then determines:

1. **Type**: patch/minor/major
   - Breaking API changes → major
   - New features → minor
   - Bug fixes → patch

2. **Description**: User-friendly changelog entry
   - Focus on WHAT users can do
   - Not HOW it's implemented
   - Clear and concise

### Example Output

**Your changes:**

```diff
+ export function excludePath(path: string) { ... }
+ // Added --exclude flag to CLI
```

**AI generates:**

```markdown
---
'@lisandrof/modkill': minor
---

Added --exclude option to skip specific paths during scanning
```

---

## 📋 Usage Examples

### Example 1: Bug Fix

```bash
# Fix a bug
vim src/core/scanner.ts

# AI changeset
npm run changeset:ai

# Output:
# Type: patch
# Description: Fixed crash when scanning directories with special characters
```

### Example 2: New Feature

```bash
# Add feature
vim src/commands/watch.command.ts

# AI changeset
npm run changeset:ai

# Output:
# Type: minor
# Description: Added real-time monitoring mode with --watch flag
```

### Example 3: Breaking Change

```bash
# Change API
vim src/index.ts

# AI changeset
npm run changeset:ai

# Output:
# Type: major
# Description: Changed CLI arguments format (--path renamed to --directory)
```

---

## 🎯 Comparison

| Method                                | Speed              | Accuracy       | Control     |
| ------------------------------------- | ------------------ | -------------- | ----------- |
| **Manual** (`npm run changeset`)      | ⚡ Fast            | ⭐⭐⭐ Perfect | 🎛️ Full     |
| **AI Local** (`npm run changeset:ai`) | ⚡⚡ Instant       | ⭐⭐ Great     | 🎛️ Review   |
| **AI GitHub** (automatic on PR)       | ⚡⚡⚡ Zero effort | ⭐⭐ Great     | 🎛️ Can edit |

---

## 🔒 Security & Privacy

- ✅ API keys stored securely (GitHub Secrets / local .env)
- ✅ Code diff sent to AI (your choice of provider)
- ✅ No code stored by AI providers (per their policies)
- ✅ Can review/edit generated changeset before committing

**Sensitive code?** Just use manual changesets:

```bash
npm run changeset  # Traditional method
```

---

## 💰 Cost

### Anthropic Claude

- ~$0.003 per changeset (3/10 of a cent)
- Free tier: $5 credit

### OpenAI GPT-4

- ~$0.01 per changeset (1 cent)
- Pay as you go

**For typical usage:** <$1/month even with many PRs!

---

## 🆘 Troubleshooting

### "No AI API key found"

**Solution:**

```bash
# Set environment variable
export ANTHROPIC_API_KEY=sk-ant-your-key

# Or create .env file
cp env.example .env
# Edit .env with your key
```

### "AI API error"

**Causes:**

- Invalid API key
- Rate limit exceeded
- Network issue

**Solution:**

```bash
# Fallback to manual
npm run changeset
```

### "Generated changeset is wrong"

**Solution:**

```bash
# Delete and recreate manually
rm .changeset/ai-*.md
npm run changeset
```

---

## 🎨 Customization

Want to customize AI behavior? Edit `scripts/ai-changeset.mjs`:

```js
// Change prompt
const prompt = `Your custom instructions...`;

// Change model
model: 'claude-3-opus-20240229'; // More powerful
model: 'gpt-4-turbo-preview'; // OpenAI alternative
```

---

## 🚀 Best Practices

1. **Review AI suggestions** - They're usually accurate but not perfect
2. **Use for routine changes** - Perfect for bug fixes and small features
3. **Manual for complex** - Use manual changeset for major refactors
4. **Edit if needed** - Generated changesets are just files, edit them!

---

**Ready to try it?** Set an API key and run:

```bash
npm run changeset:ai
```

🤖 Let AI handle the boring parts!
