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

	extractVideoLinks(
		content: string
	) {
		const links: {
			src: string;
			alt: string;
		}[] = [];

		const regex =
			/(https?:\/\/[^\s]+(?:youtube\.com|youtu\.be|vimeo\.com)[^\s]*)/g;

		let match;

		while (
			(match =
				regex.exec(
					content
				)) !== null
		) {
			if (match[1]) {
				links.push({
					src: match[1],
					alt: '',
				});
			}
		}

		return links;
	}

	extractMarkdownLinks(
		content: string,
		file: TFile
	) {
		const links: {
			alt: string;
			href: string;
			targetSlug: string;
		}[] = [];

		const regex =
			/\[([^\]]+)\]\((.*?)\)/g;

		let match;

		while (
			(match =
				regex.exec(
					content
				)) !== null
		) {
			const label =
				match[1];

			const target =
				match[2];

			if (
				!target ||
				target.startsWith(
					'http'
				)
			) {
				continue;
			}

			const linkedFile =
				this.plugin.app.metadataCache.getFirstLinkpathDest(
					target,
					file.path
				);

			if (
				!(
					linkedFile instanceof
					TFile
				)
			) {
				continue;
			}

			const slug = linkedFile.basename
						.toLowerCase()
						.replace(
							/[^\w\s-]/g,
							''
						)
						.replace(
							/\s+/g,
							'-'
						);

			links.push({
				alt: label || '',
				href: slug,
				targetSlug: slug,
			});
		}

		return links;
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
				frontmatterMatch[1] || ''
			) as Record<string, unknown> | null | undefined;

		if (
			typeof frontmatter?.image === 'string'
		) {
			refs.push(
				frontmatter.image
			);
		}

		if (
			typeof frontmatter?.attachment === 'string'
		) {
			refs.push(
				frontmatter.attachment
			);
		}

		return refs;
	}

	autoDetectMarketAssets(
		folderPath: string
	) {
		const imageCandidates = [
			'attachments/image.png',
			'attachments/image.jpg',
			'attachments/image.jpeg',
			'attachments/image.webp',
		];

		const attachmentCandidates =
			[
				'attachments/attachment.zip',
			];

		let image: string | null =
			null;

		let attachment:
			| string
			| null = null;

		for (const candidate of imageCandidates) {
			const file =
				this.plugin.app.vault.getAbstractFileByPath(
					`${folderPath}/${candidate}`
				);

			if (file instanceof TFile) {
				image = `./${candidate}`;
				break;
			}
		}

		for (const candidate of attachmentCandidates) {
			const file =
				this.plugin.app.vault.getAbstractFileByPath(
					`${folderPath}/${candidate}`
				);

			if (file instanceof TFile) {
				attachment = `./${candidate}`;
				break;
			}
		}

		return {
			image,
			attachment,
		};
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