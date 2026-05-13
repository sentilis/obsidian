import {
	Notice,
	TFile,
	TFolder,
	parseYaml,
} from 'obsidian';

import { SentilisPluginInterface } from '../types/plugin';
import { PressPublishPayload } from '../types/publish';
import { SENTILIS_EVENTS } from '../constants/events';

import {
	buildPressFormData,
	toPressUpload,
	type PressCreateResult,
	type PressFile,
} from '@sentilis/core/press';

import {
	buildProductFormData,
	toProductUpload,
} from '@sentilis/core/market';


export class PublishService {
	plugin: SentilisPluginInterface;

	constructor(
		plugin: SentilisPluginInterface
	) {
		this.plugin = plugin;
	}

	private slugify(
		value: string
	): string {
		return value
			.toLowerCase()
			.trim()
			.replace(
				/[^\w\s-]/g,
				''
			)
			.replace(
				/\s+/g,
				'-'
			)
			.replace(
				/--+/g,
				'-'
			);
	}

	private stripFrontmatter(
		content: string
	): string {
		return content.replace(
			/^---\n[\s\S]*?\n---\n?/,
			''
		);
	}

	async validatePressFile(
		file: TFile
	): Promise<PressPublishPayload | null> {
		try {
			const content =
				await this.plugin.app.vault.read(
					file
				);

			const cache =
				this.plugin.app.metadataCache.getFileCache(
					file
				);

			const frontmatter =
				cache?.frontmatter || {};

			const inferredName =
				file.basename;

			const name =
				frontmatter.name ||
				inferredName;

			const slug =
				frontmatter.slug ||
				this.slugify(name);

				const tags = Array.isArray(
					frontmatter.tags
				)
					? frontmatter.tags
					: typeof frontmatter.tags ===
						'string'
						? frontmatter.tags
								.split(',')
								.map((tag: string) =>
									tag.trim()
								)
						: [];

				const authors = Array.isArray(
					frontmatter.authors
				)
					? frontmatter.authors
					: typeof frontmatter.authors ===
						'string'
						? frontmatter.authors
								.split(',')
								.map(
									(author: string) =>
										author.trim()
								)
						: [];

			const payload: PressPublishPayload =
				{
					name,

					slug,

					content:
						this.stripFrontmatter(
							content
						),

					status:
						frontmatter.status ||
						'published',

					visibility:
						frontmatter.visibility ||
						'public',
						
					tags,
					authors,

					image:
						frontmatter.cover ||
						frontmatter.image ||
						null,
				};

			return payload;
		} catch (error: any) {
			console.error(error);

			new Notice(
				error?.message ||
					this.plugin.t(
						'publish.validationFailed'
					)
			);

			return null;
		}
	}

	async validateMarketFile(
		file: TFile
	) {
		const content =
			await this.plugin.app.vault.read(
				file
			);

		const frontmatter =
			parseYaml(
				content.match(
					/^---\n([\s\S]*?)\n---/
				)?.[1] || ''
			) || {};

		const inferredName =
			file.basename;

		const name =
			frontmatter.name ||
			inferredName;

		const slug =
			frontmatter.slug ||
			this.slugify(name);

		if (!frontmatter.kind) {
			new Notice(
				'Missing frontmatter: kind'
			);

			return null;
		}

		if (
			frontmatter.price ===
			undefined
		) {
			new Notice(
				this.plugin.t(
					'publish.marketMissingPrice'
				)
			);

			return null;
		}

		const markdownContent =
			content.replace(
				/^---\n[\s\S]*?\n---/,
				''
			);

		const image =
			frontmatter.cover ||
			frontmatter.image ||
			null;
		

		return {
			name,

			slug,

			kind: frontmatter.kind,

			price: frontmatter.price,

			currency:
				frontmatter.currency ||
				'USD',

			category:
				frontmatter.category ||
				null,

			status:
				frontmatter.status ||
				'published',

			visibility:
				frontmatter.visibility ||
				'public',

			content: markdownContent,
			
			image,
		};
	}

	async publishPressFile(
		file: TFile
	): Promise<boolean> {
		if (
			this.plugin.networkService.getStatus()
		) {
			new Notice(
				this.plugin.t(
					'publish.offline'
				)
			);

			return false;
		}

		try {
			const payload =
				await this.validatePressFile(
					file
				);

			if (!payload) {
				return false;
			}

			const normalizedContent =
				this.plugin.assetService.normalizeMarkdown(
					payload.content
				);

			const pressFile: PressFile =
				{
					filePath: file.path,

					content:
						normalizedContent,

					metadata: {
						name: payload.name,

						slug: payload.slug,

						category: null,

						status:
							payload.status as any,

						visibility:
							payload.visibility as any,

						image:
							payload.image || null,

						tags:
							payload.tags || [],

						authors:
							payload.authors || [],
					},

					images:
						this.plugin.assetService.buildImageObjects(
							normalizedContent
						),

					videos:
						this.plugin.assetService.extractVideoLinks(
							normalizedContent
						),

					links:
						this.plugin.assetService.extractMarkdownLinks(
							payload.content,
							file
						),

				};

			const result: PressCreateResult =
				{
					main: pressFile,

					hidden: [],

					errors: [],
				};

			const upload =
				toPressUpload(result);

			const content =
				await this.plugin.app.vault.read(
					file
				);

			const normalizedRawContent =
				this.plugin.assetService.normalizeMarkdown(
					content
				);

			const assets =
				await this.plugin.assetService.buildAssetMap(
					normalizedRawContent,
					file
				);

			const formData =
				buildPressFormData(
					upload,
					assets
				);

			const profile =
				this.plugin.getCurrentProfile();

			if (!profile) {
				new Notice(
					this.plugin.t(
						'publish.noProfile'
					)
				);

				return false;
			}

			const response =
				await this.plugin.apiClient.uploadPress(
					profile.token,
					formData
				);

			if (!response.success) {
				new Notice(
					response.error ||
						this.plugin.t(
							'publish.failed'
						)
				);

				return false;
			}

			new Notice(
				this.plugin.t(
					'publish.success'
				)
			);

			this.plugin.app.workspace.trigger(
				SENTILIS_EVENTS.PRESS_PUBLISHED
			);

			return true;
		} catch (error: any) {
			console.error(error);

			new Notice(
				error?.message ||
					'Publish failed'
			);

			return false;
		}
	}
	
	async publishPressFolder(
		folder: TFolder
	): Promise<boolean> {
		try {
			const markdownFiles =
				folder.children.filter(
					(item): item is TFile =>
						item instanceof
							TFile &&
						item.extension ===
							'md'
				);

			if (
				markdownFiles.length === 0
			) {
				new Notice(
					'No markdown files found in folder'
				);

				return false;
			}

			let mainFile =
				markdownFiles.find(
					(file) =>
						file.name ===
						'index.md'
				);

			if (!mainFile) {
				if (
					markdownFiles.length >
					1
				) {
					new Notice(
						'Multiple markdown files found without index.md'
					);

					return false;
				}

				mainFile =
					markdownFiles[0];
			}

			const mainPayload =
				await this.validatePressFile(
					mainFile
				);

			if (!mainPayload) {
				return false;
			}

			const buildPressFile =
				async (
					file: TFile,
					payload: any
				): Promise<PressFile> => {
					const rawContent =
						await this.plugin.app.vault.read(
							file
						);

					const normalizedContent =
						this.plugin.assetService.normalizeMarkdown(
							this.stripFrontmatter(
								rawContent
							)
						);

					return {
						filePath:
							file.path,

						content:
							normalizedContent,

						metadata: {
							name: payload.name,

							slug: payload.slug,

							category:
								null,

							status:
								payload.status as any,

							visibility:
								payload.visibility as any,

							image:
								payload.image || null,

							tags:
								payload.tags || [],

							authors:
								payload.authors || [],
						},

						images:
							this.plugin.assetService.buildImageObjects(
								normalizedContent
							),

						videos:
							this.plugin.assetService.extractVideoLinks(
								normalizedContent
							),

						links:
							this.plugin.assetService.extractMarkdownLinks(
								payload.content,
								file
							),
					};
				};

			const mainPressFile =
				await buildPressFile(
					mainFile,
					mainPayload
				);

			const hidden: PressFile[] =
				[];

			for (const file of markdownFiles) {
				if (
					file.path ===
					mainFile.path
				) {
					continue;
				}

				const payload =
					await this.validatePressFile(
						file
					);

				if (!payload) {
					continue;
				}

				payload.status =
					mainPayload.status;

				payload.visibility =
					mainPayload.visibility;

				const hiddenFile =
					await buildPressFile(
						file,
						payload
					);

				hidden.push(
					hiddenFile
				);
			}

			const result: PressCreateResult =
				{
					main: mainPressFile,

					hidden,

					errors: [],
				};

			const upload =
				toPressUpload(
					result
				);

			const allContent =
				await Promise.all(
					markdownFiles.map(
						async (
							file
						) =>
							await this.plugin.app.vault.read(
								file
							)
					)
				);

			const assets =
				new Map<
					string,
					Uint8Array
				>();

			for (
				let i = 0;
				i <
				markdownFiles.length;
				i++
			) {
				const normalized =
					this.plugin.assetService.normalizeMarkdown(
						allContent[i]
					);

				const assetMap =
					await this.plugin.assetService.buildAssetMap(
						normalized,
						markdownFiles[i]
					);

				assetMap.forEach(
					(
						value,
						key
					) => {
						assets.set(
							key,
							value
						);
					}
				);
			}

			const formData =
				buildPressFormData(
					upload,
					assets
				);

			const profile =
				this.plugin.getCurrentProfile();

			if (!profile) {
				new Notice(
					this.plugin.t(
						'publish.noProfile'
					)
				);

				return false;
			}

			const response =
				await this.plugin.apiClient.uploadPress(
					profile.token,
					formData
				);

			if (!response.success) {
				new Notice(
					response.error ||
						this.plugin.t(
							'publish.failed'
						)
				);

				return false;
			}

			new Notice(
				'Folder published successfully'
			);

			this.plugin.app.workspace.trigger(
				SENTILIS_EVENTS.PRESS_PUBLISHED
			);

			return true;
		} catch (error: any) {
			console.error(error);

			new Notice(
				error?.message ||
					'Folder publish failed'
			);

			return false;
		}
	}

	async publishMarketFile(
		file: TFile
	): Promise<boolean> {
		if (
			this.plugin.networkService.getStatus()
		) {
			new Notice(
				this.plugin.t(
					'publish.offline'
				)
			);

			return false;
		}

		const profile =
			this.plugin.getCurrentProfile();

		if (!profile) {
			new Notice(
				this.plugin.t(
					'publish.noProfile'
				)
			);

			return false;
		}

		const validated =
			await this.validateMarketFile(
				file
			);

		if (!validated) {
			return false;
		}

		const normalizedContent =
			this.plugin.assetService.normalizeMarkdown(
				validated.content
			);

		const upload =
			toProductUpload({
				main: {
					metadata: {
						name: validated.name,

						slug: validated.slug,

						kind: validated.kind,

						price:
							validated.price,

						currency:
							validated.currency,

						category:
							validated.category,

						status:
							validated.status,

						visibility:
							validated.visibility,

						image:
							validated.image || null,

						attachment: null,
					},

					content:
						normalizedContent,

					images:
						this.plugin.assetService.buildImageObjects(
							normalizedContent
						),

					videos:
						this.plugin.assetService.extractVideoLinks(
							normalizedContent
						),

					links:
						this.plugin.assetService.extractMarkdownLinks(
							validated.content,
							file
						),
				},
			} as any);

		const rawContent =
			await this.plugin.app.vault.read(
				file
			);

		const normalizedRawContent =
			this.plugin.assetService.normalizeMarkdown(
				rawContent
			);

		const assets =
			await this.plugin.assetService.buildAssetMap(
				normalizedRawContent,
				file
			);

		const formData =
			buildProductFormData(
				upload,
				assets
			);

		const response =
			await this.plugin.apiClient.uploadProduct(
				profile.token,
				formData
			);

		if (!response.success) {
			console.error(
				'MARKET PUBLISH ERROR',
				response
			);

			new Notice(
				`${this.plugin.t(
					'publish.failed'
				)}: ${response.error}`
			);

			return false;
		}

		new Notice(
			`Market published: ${response.data.slug}`
		);

		this.plugin.app.workspace.trigger(
			SENTILIS_EVENTS.PRESS_PUBLISHED
		);

		return true;
	}

	async deletePress(
		id: string
	): Promise<boolean> {
		const profile =
			this.plugin.getCurrentProfile();

		if (!profile) {
			new Notice(
				this.plugin.t(
					'publish.noProfile'
				)
			);

			return false;
		}

		const response =
			await this.plugin.apiClient.removePress(
				profile.token,
				id
			);

		if (!response.success) {
			new Notice(
				`${this.plugin.t(
					'publish.deleteFailed'
				)}: ${response.error}`
			);

			return false;
		}

		new Notice(
			this.plugin.t(
				'publish.pressDeleted'
			)
		);

		this.plugin.app.workspace.trigger(
			SENTILIS_EVENTS.PRESS_PUBLISHED
		);

		return true;
	}

	async deleteMarket(
		id: string
	): Promise<boolean> {
		const profile =
			this.plugin.getCurrentProfile();

		if (!profile) {
			new Notice(
				this.plugin.t(
					'publish.noProfile'
				)
			);

			return false;
		}

		const response =
			await this.plugin.apiClient.removeProduct(
				profile.token,
				id
			);

		if (!response.success) {
			new Notice(
				`${this.plugin.t(
					'publish.deleteFailed'
				)}: ${response.error}`
			);

			return false;
		}

		new Notice(
			this.plugin.t(
				'publish.marketDeleted'
			)
		);

		this.plugin.app.workspace.trigger(
			SENTILIS_EVENTS.PRESS_PUBLISHED
		);

		return true;
	}
}