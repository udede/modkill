#!/usr/bin/env node
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { config } from 'dotenv';

// Load env vars from .env if exists
config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!ANTHROPIC_API_KEY && !OPENAI_API_KEY) {
  console.error('❌ Error: No AI API key found!');
  console.error('');
  console.error('Set one of:');
  console.error('  export ANTHROPIC_API_KEY=sk-...');
  console.error('  export OPENAI_API_KEY=sk-...');
  console.error('');
  console.error('Or create a .env file with the key.');
  process.exit(1);
}

console.log('🤖 Analyzing changes with AI...\n');

// Get changes
const diff = execSync('git diff HEAD').toString();
const staged = execSync('git diff --staged').toString();
const commits = execSync('git log origin/main..HEAD --oneline 2>/dev/null || echo "No commits"').toString();
const files = execSync('git diff --name-only HEAD 2>/dev/null || git diff --cached --name-only').toString();

const changes = staged || diff;

if (!changes) {
  console.log('ℹ️  No changes detected. Make some changes first!');
  process.exit(0);
}

// Build prompt
const prompt = `You are a helpful assistant that generates changesets for npm packages.

Analyze these changes and generate a changeset:

**Files Changed:**
${files}

**Git Diff:**
${changes.slice(0, 3000)}

**Recent Commits:**
${commits}

Determine:
1. **Type**: "patch" (bug fix), "minor" (new feature), or "major" (breaking change)
2. **Description**: Clear, user-facing description for CHANGELOG (1-2 sentences, no technical jargon)

Rules:
- If adds new functionality: "minor"
- If fixes bugs without new features: "patch"  
- If breaks existing API: "major"
- Description should explain WHAT users can do now, not HOW you implemented it

Respond with ONLY a valid JSON object (no markdown, no explanation):
{"type":"patch|minor|major","description":"User-friendly description"}`;

// Call AI
async function generateChangeset() {
  let result;

  try {
    if (ANTHROPIC_API_KEY) {
      console.log('Using Claude (Anthropic)...');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.content[0].text.trim();
      // Remove markdown code blocks if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    } else if (OPENAI_API_KEY) {
      console.log('Using GPT-4 (OpenAI)...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      result = JSON.parse(data.choices[0].message.content);
    }

    // Validate result
    if (!result.type || !result.description) {
      throw new Error('Invalid AI response format');
    }

    if (!['patch', 'minor', 'major'].includes(result.type)) {
      throw new Error(`Invalid type: ${result.type}`);
    }

    // Generate changeset file
    const changesetContent = `---
'@lisandrof/modkill': ${result.type}
---

${result.description}
`;

    const timestamp = Date.now();
    const filename = `.changeset/ai-${result.type}-${timestamp}.md`;
    writeFileSync(filename, changesetContent);

    console.log('\n✅ Changeset generated!\n');
    console.log(`📄 File: ${filename}`);
    console.log(`📦 Type: ${result.type}`);
    console.log(`📝 Description: ${result.description}\n`);
    console.log('💡 Review the file and commit when ready!');
    console.log(`   git add ${filename}`);
    console.log(`   git commit -m "chore: add changeset"`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Fallback to manual changeset:');
    console.error('   npm run changeset');
    process.exit(1);
  }
}

generateChangeset();

