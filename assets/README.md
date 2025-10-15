# Assets

This directory contains images and media for the project.

## Files

- `logo.png` - Main logo (512x512 recommended)
- `logo.svg` - Vector version (scalable)
- `demo.gif` - CLI demo animation
- `banner.png` - Social media banner (1200x630)

## Usage in README

```markdown
![Logo](https://raw.githubusercontent.com/udede/modkill/main/assets/logo.png)
```

## Creating Assets

### Logo Ideas for modkill

**Concept:**

- 🔪 Knife/dagger cutting through "node_modules"
- ⚡ Lightning bolt + folder
- 🗑️ Trash can with npm logo
- 💀 Skull with terminal aesthetic

**Tools:**

- [Figma](https://figma.com) - Professional design
- [Canva](https://canva.com) - Quick & easy
- [LogoMakr](https://logomakr.com) - Simple logos
- AI: DALL-E, Midjourney, Stable Diffusion

**Specs:**

- Size: 512x512px minimum
- Format: PNG with transparency OR SVG
- Colors: Match terminal aesthetic (dark mode friendly)
- Simple: Must work at small sizes (favicon)

### Demo GIF

Use `asciinema` to record terminal:

```bash
# Install
brew install asciinema

# Record
asciinema rec demo.cast

# Convert to GIF
npm install -g @asciinema/gif-generator
asciinema-gif demo.cast demo.gif
```

Or use: https://terminalizer.com/
