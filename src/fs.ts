import { type App, TFile, TFolder, type Vault } from 'obsidian';
import type { FileSystem, StatInfo } from '@sentilis/core';

/**
 * Adapter from the Sentilis core `FileSystem` to the Obsidian vault.
 *
 * Obsidian uses vault-relative POSIX paths everywhere, which matches the
 * convention the core walker expects. Two Obsidian-specific behaviors
 * worth noting:
 *
 *  - `readText` returns the markdown with Obsidian-only syntax
 *    (`![[wikilink]]`, `[[link]]`) rewritten to standard markdown, with
 *    asset paths resolved through Obsidian's link cache so they match
 *    the core walker's `<noteDir>/attachments/` convention.
 *  - `realpath` is a no-op — the vault has no symlinks, so the symlink
 *    escape check in the walker is effectively bypassed (still cheap to
 *    keep the same code path).
 */
export class ObsidianFileSystem implements FileSystem {
	private app: App;
	private vault: Vault;

	constructor(app: App) {
		this.app = app;
		this.vault = app.vault;
	}

	async stat(path: string): Promise<StatInfo | null> {
		const item = this.lookup(path);
		if (!item) return null;
		return {
			isFile: item instanceof TFile,
			isDirectory: item instanceof TFolder,
		};
	}

	async readText(path: string): Promise<string> {
		const file = this.lookup(path);
		if (!(file instanceof TFile)) {
			throw new Error(`File not found: ${path}`);
		}
		const raw = await this.vault.read(file);
		return normalizeMarkdown(raw, file.path, this.app);
	}

	async readBinary(path: string): Promise<Uint8Array> {
		const file = this.lookup(path);
		if (!(file instanceof TFile)) {
			throw new Error(`File not found: ${path}`);
		}
		const buf = await this.vault.readBinary(file);
		return new Uint8Array(buf);
	}

	async readDir(path: string): Promise<string[]> {
		const folder = this.lookup(path);
		if (!(folder instanceof TFolder)) {
			throw new Error(`Directory not found: ${path}`);
		}
		return folder.children.map((c) => c.name);
	}

	async exists(path: string): Promise<boolean> {
		return this.lookup(path) !== null;
	}

	async realpath(path: string): Promise<string> {
		return path;
	}

	private lookup(path: string) {
		// Vault root is represented as the empty string in Obsidian.
		const normalized = path === '.' || path === '/' ? '' : stripLeading(path);
		return this.vault.getAbstractFileByPath(normalized);
	}
}

function stripLeading(p: string): string {
	return p.startsWith('./') ? p.slice(2) : p;
}

/**
 * Convert Obsidian-only syntax into standard markdown so the core walker
 * sees the same shape it gets from the CLI. Wikilink refs (`![[name]]`,
 * `[[name]]`) and bare markdown image refs are resolved through Obsidian's
 * link cache so they end up as paths the walker can locate inside
 * `<noteDir>/attachments/`.
 */
function normalizeMarkdown(content: string, sourcePath: string, app: App): string {
	const sourceDir = posixDirname(sourcePath);

	const resolveLinktext = (linktext: string): string | null => {
		const target = linktext.split('#', 2)[0] ?? '';
		const cleanTarget = target.trim();
		if (!cleanTarget) return null;
		const dest = app.metadataCache.getFirstLinkpathDest(cleanTarget, sourcePath);
		if (!dest) return null;
		return posixRelative(sourceDir, dest.path);
	};

	let out = content.replace(
		/!\[\[([^\]]+?)\]\]/g,
		(match, inner: string) => {
			const [linktextRaw, displayRaw] = inner.split('|', 2);
			const linktext = linktextRaw ?? '';
			const display = displayRaw?.trim() ?? '';
			const resolved = resolveLinktext(linktext);
			if (!resolved) return match;
			return `![${display}](${resolved})`;
		},
	);

	out = out.replace(
		/(?<!!)\[\[([^\]]+?)\]\]/g,
		(match, inner: string) => {
			const [linktextRaw, displayRaw] = inner.split('|', 2);
			const linktext = linktextRaw ?? '';
			const display = displayRaw?.trim() ?? linktext;
			const resolved = resolveLinktext(linktext);
			if (!resolved) return match;
			return `[${display}](${resolved})`;
		},
	);

	out = out.replace(
		/!\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g,
		(match, alt: string, href: string, title: string | undefined) => {
			if (isExternalOrAbsolute(href)) return match;
			if (href.startsWith('./') || href.startsWith('../') || href.includes('/')) {
				return match;
			}
			const dest = app.metadataCache.getFirstLinkpathDest(
				decodeRefSafe(href),
				sourcePath,
			);
			if (!dest) return match;
			const rel = posixRelative(sourceDir, dest.path);
			return `![${alt}](${rel}${title ?? ''})`;
		},
	);

	return out;
}

function isExternalOrAbsolute(href: string): boolean {
	return (
		href.startsWith('http://') ||
		href.startsWith('https://') ||
		href.startsWith('data:') ||
		href.startsWith('#') ||
		href.startsWith('/')
	);
}

function decodeRefSafe(ref: string): string {
	try {
		return decodeURIComponent(ref);
	} catch {
		return ref;
	}
}

function posixDirname(p: string): string {
	const i = p.lastIndexOf('/');
	return i === -1 ? '' : p.slice(0, i);
}

function posixRelative(from: string, to: string): string {
	const fromParts = from === '' ? [] : from.split('/').filter(Boolean);
	const toParts = to.split('/').filter(Boolean);
	let i = 0;
	while (
		i < fromParts.length &&
		i < toParts.length &&
		fromParts[i] === toParts[i]
	) {
		i++;
	}
	const up: string[] = new Array<string>(fromParts.length - i).fill('..');
	const down = toParts.slice(i);
	const joined = [...up, ...down].join('/');
	return joined === '' ? '.' : joined;
}
