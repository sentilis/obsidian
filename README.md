<p align="center">
  <h1 align="center">@sentilis/obsidian</h1>
</p>

<p align="center">
  <strong>The official Obsidian plugin for the Sentilis platform.</strong>
</p>

<p align="center">
<a href="./LICENSE" target="_blank"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
<a href="https://obsidian.md" target="_blank"><img src="https://img.shields.io/badge/obsidian-1.5.0%2B-7c3aed.svg" alt="Obsidian Version" /></a>
<a href="https://www.npmjs.com/package/@sentilis/core" target="_blank"><img src="https://img.shields.io/npm/v/@sentilis/core.svg?label=%40sentilis%2Fcore" alt="Core Version" /></a>
</p>

## Description

The **Sentilis Obsidian Plugin** brings the Sentilis platform directly into your vault. Built on top of [`@sentilis/core`](https://www.npmjs.com/package/@sentilis/core), it lets you author, validate, and publish **Press** articles and **Market** products from your Markdown notes — without ever leaving Obsidian.

## Features

- **Press publishing** — push Markdown notes to Sentilis Press with full asset support.
- **Market publishing** — turn a note into a Sentilis Market product in one click.
- **Sidebar view** — browse and manage your published Press and Market entries from a dedicated panel.
- **Context menu actions** — publish, view details, open online, or delete content directly from the file explorer.
- **Multi-profile support** — switch between Sentilis accounts on the fly.
- **Obsidian-native assets** — `![[image.png]]` embeds, standard Markdown images, frontmatter covers, and file attachments are all resolved automatically.
- **i18n** — English and Spanish out of the box.
- **Network detection & auto-refresh** — the sidebar stays in sync with your account.

## Installation

### From source (current)

1.  Clone the repository into your vault's plugins folder:
    ```bash
    $ git clone <REPO_URL> <VAULT>/.obsidian/plugins/sentilis
    ```
2.  Install dependencies and build:
    ```bash
    $ cd <VAULT>/.obsidian/plugins/sentilis
    $ npm install
    $ npm run build
    ```
3.  In Obsidian, open **Settings → Community Plugins**, reload the plugin list, and enable **Sentilis**.

*Tip: for development, symlink the repository into your vault instead of cloning — see [Development](#development).*

## Getting Started

### 1. Configure a Profile

Open **Settings → Sentilis** and add a profile with:

- **Username** — your Sentilis handle.
- **API Token** — generated from your Sentilis account.

You can register multiple profiles and switch between them using the command palette:

```text
Sentilis: Change profile
```

### 2. Open the Sidebar

Run the command:

```text
Sentilis: Open sidebar
```

The sidebar lists your Press entries and Market products for the active profile, with quick actions to view details, open the online URL, or delete an item.

### 3. Publish Press

Create a Markdown file with Sentilis frontmatter. Read [What is a Press?](https://about.sentilis.me/press?utm_source=obsidian&utm_medium=readme&utm_campaign=plugin-docs&utm_content=press-section) for the full schema.

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

Right-click the file in the explorer and choose:

```text
Sentilis → Publish to Press
```

### 4. Publish Market

Create a Markdown file describing your product. Read [What is Market?](https://about.sentilis.me/market?utm_source=obsidian&utm_medium=readme&utm_campaign=plugin-docs&utm_content=market-section) for the full schema.

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

Right-click the file and choose:

```text
Sentilis → Publish to Market
```

## Assets

The plugin resolves assets against your vault so you can reference files exactly the way Obsidian does:

```md
![[image.png]]            <!-- Obsidian embed -->
![](Assets/image.png)     <!-- Standard Markdown -->
```

Supported asset sources:

- Obsidian embeds (`![[file]]`)
- Standard Markdown images
- Frontmatter cover image
- Attachments (PDF, ZIP, etc.)

All referenced files must exist inside the active vault.

## Development

### Requirements

- Node.js 20+
- npm
- Obsidian 1.5.0+
- A Sentilis account

### Symlink the plugin (recommended)

Develop directly from the repository by symlinking it into your vault:

**Linux / macOS**

```bash
$ ln -s /path/to/sentilis.obsidian /path/to/vault/.obsidian/plugins/sentilis
```

**Windows (PowerShell as Administrator)**

```powershell
New-Item -ItemType SymbolicLink `
  -Path "C:\Vault\.obsidian\plugins\sentilis" `
  -Target "C:\Projects\sentilis.obsidian"
```

### Scripts

| Script          | Description                                         |
| --------------- | --------------------------------------------------- |
| `npm run dev`   | Build in watch mode — regenerates `main.js` on save. |
| `npm run build` | Type-check and produce a production build.          |
| `npm run lint`  | Run ESLint with the Obsidian plugin rules.          |

After rebuilding, reload the plugin in Obsidian (disable/enable it, or run `Ctrl+P → Reload app without saving`).

### Tech Stack

- TypeScript
- Obsidian Plugin API
- [`@sentilis/core`](https://www.npmjs.com/package/@sentilis/core) SDK
- esbuild

## Related Packages

- **[@sentilis/core](https://www.npmjs.com/package/@sentilis/core)** — TypeScript SDK for parsing Sentilis-flavored Markdown and talking to the platform.
- **[@sentilis/cli](https://www.npmjs.com/package/@sentilis/cli)** — Command-line companion for terminal-based workflows.

## Stay in touch

- Website — [https://about.sentilis.me](https://about.sentilis.me?utm_source=obsidian&utm_medium=readme&utm_campaign=plugin-docs&utm_content=stay-in-touch-website)
- X — [https://x.com/SentilisMe](https://x.com/SentilisMe)

## Support

For issues and feature requests, please use the GitHub Issues page.

## License

Sentilis Obsidian Plugin is [MIT licensed](./LICENSE).
