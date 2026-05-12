import {
	TFile,
	parseYaml,
} from 'obsidian';

import { SentilisPluginInterface } from '../types/plugin';

export class AssetService {
	plugin: SentilisPluginInterface;

	constructor(
		plugin: SentilisPluginInterface
	) {
		this.plugin = plugin;
	}

	extractImageRefs(
		content: string
	): string[] {
		const refs: string[] = [];

		// Markdown images
		const markdownRegex =
			/!\[[^\]]*?\]\((.*?)\)/g;

		let match;

		while (
			(match =
				markdownRegex.exec(
					content
				)) !== null
		) {
			if (match[1]) {
				refs.push(match[1]);
			}
		}

		// Obsidian embeds
		const obsidianRegex =
			/!\[\[(.*?)\]\]/g;

		while (
			(match =
				obsidianRegex.exec(
					content
				)) !== null
		) {
			if (match[1]) {
				refs.push(match[1]);
			}
		}

		return refs;
	}

	buildImageObjects(
		content: string
	) {
		const refs =
			this.extractImageRefs(
				content
			);

		return refs.map((ref) => ({
			src: ref,
			alt: '',
		}));
	}

    normalizeMarkdown(
		content: string
	): string {
		// Convert Obsidian image embeds
		content = content.replace(
			/!\[\[(.*?)\]\]/g,
			'![]($1)'
		);

		// Convert Obsidian wikilinks
		content = content.replace(
			/\[\[(.*?)\]\]/g,
			'[$1]($1)'
		);

		return content;
	}

	extractFrontmatterAssets(
		content: string
	): string[] {
		const refs: string[] = [];

		const frontmatterMatch =
			content.match(
				/^---\n([\s\S]*?)\n---/
			);

		if (!frontmatterMatch) {
			return refs;
		}

		const frontmatter =
			parseYaml(
				frontmatterMatch[1]
			);

		if (
			frontmatter?.image
		) {
			refs.push(
				frontmatter.image
			);
		}

		if (
			frontmatter?.attachment
		) {
			refs.push(
				frontmatter.attachment
			);
		}

		return refs;
	}

	async buildAssetMap(
		content: string,
		file: TFile
	): Promise<
		Map<string, Uint8Array>
	> {
		const assets =
			new Map<
				string,
				Uint8Array
			>();

		const refs = [
			...this.extractImageRefs(
				content
			),

			...this.extractFrontmatterAssets(
				content
			),
		];

		for (const ref of refs) {
			try {
				const assetFile =
					this.plugin.app.metadataCache.getFirstLinkpathDest(
						ref,
						file.path
					);

				if (
					!(
						assetFile instanceof
						TFile
					)
				) {
					console.warn(
						'Asset not found:',
						ref
					);

					continue;
				}

				const binary =
					await this.plugin.app.vault.adapter.readBinary(
						assetFile.path
					);

				assets.set(
					ref,
					new Uint8Array(
						binary
					)
				);

			} catch (error) {
				console.error(
					'Failed loading asset',
					ref,
					error
				);
			}
		}

		return assets;
	}
}