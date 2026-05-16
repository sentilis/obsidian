import tseslint from 'typescript-eslint';
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						'eslint.config.js',
						'manifest.json'
					]
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json']
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		plugins: {
			obsidianmd,
		},
		rules: {
			"obsidianmd/ui/sentence-case": [
				"error",
				{
					brands: [
						"Sentilis",
						"Press",
						"Market",
						"iOS",
						"iPadOS",
						"macOS",
						"Windows",
						"Android",
						"Linux",
						"Obsidian",
						"Obsidian Sync",
						"Obsidian Publish",
						"Google Drive",
						"Dropbox",
						"OneDrive",
						"iCloud Drive",
						"YouTube",
						"Slack",
						"Discord",
						"Telegram",
						"WhatsApp",
						"Twitter",
						"X",
						"Readwise",
						"Zotero",
						"Excalidraw",
						"Mermaid",
						"Markdown",
						"LaTeX",
						"JavaScript",
						"TypeScript",
						"Node.js",
						"npm",
						"pnpm",
						"Yarn",
						"Git",
						"GitHub",
						"GitLab",
						"Notion",
						"Evernote",
						"Roam Research",
						"Logseq",
						"Anki",
						"Reddit",
						"VS Code",
						"Visual Studio Code",
						"IntelliJ IDEA",
						"WebStorm",
						"PyCharm",
					],
				},
			],
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"eslint.config.js",
		"version-bump.mjs",
		"versions.json",
		"main.js",
	]),
);
