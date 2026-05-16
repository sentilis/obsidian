# Sentilis Obsidian Plugin

Plugin to integrate Obsidian with Sentilis and publish Press and Market content directly from Markdown files.

---

# Features

## Press
- Publish Markdown files to Sentilis Press
- Image/assets support
- View Details
- Delete Press
- Open Link

## Market
- Publish products to Sentilis Market
- Image/assets support
- View Details
- Delete Product
- Open Link

## General
- Multi-profile support
- Custom sidebar
- Context menu actions
- i18n (English / Spanish)
- Network detection
- Auto refresh
- Obsidian markdown support (`![[image.png]]`)

---

# Requirements

- Node.js 20+
- npm
- Obsidian
- Sentilis account

---

# Installation

## 1. Clone repository

```bash
git clone <REPO_URL>
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Start development mode

```bash
npm run dev
```

This will automatically generate:

```text
main.js
```

---

# Install plugin inside Obsidian

Copy the project into:

```text
<VAULT>/.obsidian/plugins/sentilis-plugin/
```

Example:

```text
/ObsidianVaults/MyVault/.obsidian/plugins/sentilis-plugin/
```

---

# Optional: Use a Symlink (Recommended for Development)

Instead of copying files manually every time, you can create a symbolic link between your development repository and the Obsidian plugins folder.

## Linux / macOS

```bash
ln -s /path/to/project /path/to/vault/.obsidian/plugins/sentilis-plugin
```

Example:

```bash
ln -s /var/www/sentilis-plugin /ObsidianVaults/MyVault/.obsidian/plugins/sentilis-plugin
```

---

## Windows (PowerShell as Administrator)

```powershell
New-Item -ItemType SymbolicLink `
  -Path "C:\Vault\.obsidian\plugins\sentilis-plugin" `
  -Target "C:\Projects\sentilis-plugin"
```

This allows live development directly from your repository.

---

# Required Files

Make sure these files exist:

```text
main.js
manifest.json
styles.css
```

---

# Enable Plugin

1. Open Obsidian
2. Go to Settings
3. Community Plugins
4. Enable Community Plugins
5. Search for "Sentilis Plugin"
6. Enable it

---

# Configure Profile

Open:

```text
Settings → Sentilis Plugin
```

Add:

- Username
- API Token

Select an active profile.

---

# Publishing Press

Create a markdown file:

```md
---
name: My First Press
slug: my-first-press
status: published
visibility: public
image: cover.png
---

# Hello Sentilis

![[cover.png]]
```

Right click the file:

```text
Sentilis → Publish to Press
```

---

# Publishing Market

Create a markdown file:

```md
---
name: My Product
slug: my-product
kind: digital
price: 29
currency: USD
status: published
visibility: public
image: cover.png
---

# Product Description

![[cover.png]]
```

Right click the file:

```text
Sentilis → Publish to Market
```

---

# Assets Support

The plugin supports:

- Markdown images
- Obsidian embeds
- Frontmatter image
- Attachments

Examples:

```md
![[image.png]]
```

```md
![](Assets/image.png)
```

Images must exist inside the Obsidian Vault.

---

# Development Notes

## Rebuild Plugin

Whenever you make changes:

```bash
npm run dev
```

---

## Reload Plugin

Inside Obsidian:

```text
Settings → Community Plugins
```

Disable and enable the plugin again.

Or:

```text
CTRL + P → Reload app without saving
```

---

# Tech Stack

- TypeScript
- Obsidian API
- Sentilis SDK
- esbuild

---

# License

Private / Internal Project