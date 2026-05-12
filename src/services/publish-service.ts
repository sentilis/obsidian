import {
	Notice,
	TFile,
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
				cache?.frontmatter;

			if (!frontmatter) {
				new Notice(
					[
						'This markdown file is missing Sentilis frontmatter.',
						'',
						'Add this at the top of your file:',
						'',
						'---',
						'name: My Post',
						'slug: my-post',
						'status: published',
						'visibility: public',
						'---',
					].join('\n'),
					10000
				);

				return null;
			}

			if (!frontmatter.name) {
				new Notice(
					[
						'Missing required field: "name"',
						'',
						'Example:',
						'name: My Awesome Post',
					].join('\n'),
					10000
				);

				return null;
			}

			if (!frontmatter.slug) {
				new Notice(
					[
						'Missing required field: "slug"',
						'',
						'Example:',
						'slug: my-awesome-post',
					].join('\n'),
					10000
				);

				return null;
			}

			const payload: PressPublishPayload =
				{
					name: frontmatter.name,

					slug: frontmatter.slug,

					content:
						this.stripFrontmatter(
							content
						),

					status:
						frontmatter.status ||
						'draft',

					visibility:
						frontmatter.visibility ||
						'private',
				};

			new Notice(
				this.plugin.t(
					'publish.validationSuccess'
				)
			);

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
			);

		if (!frontmatter.name) {
			new Notice(
				this.plugin.t(
					'publish.marketMissingName'
				)
			);

			return null;
		}

		if (!frontmatter.slug) {
			new Notice(
				this.plugin.t(
					'publish.marketMissingSlug'
				)
			);

			return null;
		}

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
			this.plugin.t(
				'publish.marketMissingPrice'
			)

			return null;
		}

		const markdownContent =
			content.replace(
				/^---\n[\s\S]*?\n---/,
				''
			);

		return {
			name: frontmatter.name,

			slug: frontmatter.slug,

			kind: frontmatter.kind,

			price: frontmatter.price,

			currency:
				frontmatter.currency ||
				null,

			category:
				frontmatter.category ||
				null,

			status:
				frontmatter.status ||
				'draft',

			visibility:
				frontmatter.visibility ||
				'public',

			content: markdownContent,
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

						image: null,

						tags: [],

						authors: [],
					},

					images:
						this.plugin.assetService.buildImageObjects(
							normalizedContent
						),

					videos: [],

					links: [],
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

						image: null,

						attachment: null,
					},

					content:
						normalizedContent,

					images:
						this.plugin.assetService.buildImageObjects(
							normalizedContent
						),

					videos: [],

					links: [],
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