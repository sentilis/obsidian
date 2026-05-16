import {
	Notice,
	TFile,
	TFolder,
	parseYaml,
	normalizePath,
} from 'obsidian';

import { SentilisPluginInterface } from '../types/plugin';
import { PressPublishPayload } from '../types/publish';
import {
	DryRunReport,
	DryRunIssue,
} from '../types/dry-run';
import { SENTILIS_EVENTS } from '../constants/events';

import type {
	LifecycleStatus,
	LifecycleVisibility,
} from '@sentilis/core';

import {
	buildPressFormData,
	toPressUpload,
	type PressCreateResult,
	type PressFile,
} from '@sentilis/core/press';

import {
	buildProductFormData,
	toProductUpload,
	type ProductFile,
	type ProductType,
} from '@sentilis/core/market';

interface PressFrontmatter {
	name?: unknown;
	slug?: unknown;
	status?: unknown;
	visibility?: unknown;
	tags?: unknown;
	authors?: unknown;
	cover?: unknown;
	image?: unknown;
}

interface MarketFrontmatter extends PressFrontmatter {
	kind?: unknown;
	price?: unknown;
	currency?: unknown;
	category?: unknown;
	attachment?: unknown;
}

interface MarketPublishPayload {
	name: string;
	slug: string;
	kind: ProductType;
	price: number;
	currency: string;
	category: string | null;
	status: LifecycleStatus;
	visibility: LifecycleVisibility;
	content: string;
	image: string | null;
	attachment: string | null;
}

const VALID_STATUS: ReadonlySet<LifecycleStatus> = new Set<LifecycleStatus>([
	'draft',
	'published',
	'archived',
]);

const VALID_VISIBILITY: ReadonlySet<LifecycleVisibility> = new Set<LifecycleVisibility>([
	'public',
	'private',
	'protected',
	'prime',
]);

const VALID_PRODUCT_KIND: ReadonlySet<ProductType> = new Set<ProductType>([
	'service',
	'product',
	'digital',
]);

function asString(value: unknown): string | null {
	return typeof value === 'string' ? value : null;
}

function asStringList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.filter(
			(item): item is string => typeof item === 'string'
		);
	}

	if (typeof value === 'string') {
		return value
			.split(',')
			.map((item) => item.trim())
			.filter((item) => item.length > 0);
	}

	return [];
}

function asStatus(value: unknown): LifecycleStatus {
	if (
		typeof value === 'string' &&
		VALID_STATUS.has(value as LifecycleStatus)
	) {
		return value as LifecycleStatus;
	}

	return 'published';
}

function asVisibility(value: unknown): LifecycleVisibility {
	if (
		typeof value === 'string' &&
		VALID_VISIBILITY.has(value as LifecycleVisibility)
	) {
		return value as LifecycleVisibility;
	}

	return 'public';
}

function asProductKind(value: unknown): ProductType | null {
	if (
		typeof value === 'string' &&
		VALID_PRODUCT_KIND.has(value as ProductType)
	) {
		return value as ProductType;
	}

	return null;
}


export class PublishService {
	plugin: SentilisPluginInterface;

	constructor(
		plugin: SentilisPluginInterface
	) {
		this.plugin = plugin;
	}

	private async withUploadIndicator<T>(
		uploadFn: () => Promise<T>
	): Promise<T> {
		const loading = new Notice(
			this.plugin.t(
				'publish.uploading'
			),
			0
		);

		try {
			return await uploadFn();
		} finally {
			loading.hide();
		}
	}

	private notifyPublishError(
		rawError: string | undefined
	) {
		console.error(
			'[Sentilis] publish failed:',
			rawError
		);

		new Notice(
			this.plugin.t(
				'publish.failedHint'
			)
		);
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

	private parseMarketFrontmatter(
		content: string
	): MarketFrontmatter {
		const raw = parseYaml(
			content.match(
				/^---\n([\s\S]*?)\n---/
			)?.[1] || ''
		) as unknown;

		if (raw && typeof raw === 'object') {
			return raw as MarketFrontmatter;
		}

		return {};
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
				(cache?.frontmatter as PressFrontmatter | undefined) ?? {};

			const inferredName =
				file.basename;

			const name =
				asString(frontmatter.name) ??
				inferredName;

			const slug =
				asString(frontmatter.slug) ??
				this.slugify(name);

			const tags = asStringList(frontmatter.tags);
			const authors = asStringList(frontmatter.authors);

			const payload: PressPublishPayload =
				{
					name,

					slug,

					content:
						this.stripFrontmatter(
							content
						),

					status: asStatus(frontmatter.status),

					visibility: asVisibility(frontmatter.visibility),

					tags,
					authors,

					image:
						asString(frontmatter.cover) ??
						asString(frontmatter.image) ??
						null,
				};

			return payload;
		} catch (error) {
			console.error(error);

			new Notice(
				(error as Error)?.message ||
					this.plugin.t(
						'publish.validationFailed'
					)
			);

			return null;
		}
	}

	async validateMarketFile(
		file: TFile,
		folder?: TFolder
	): Promise<MarketPublishPayload | null> {
		const content =
			await this.plugin.app.vault.read(
				file
			);

		const frontmatter =
			this.parseMarketFrontmatter(content);

		const inferredName =
			file.basename;

		const name =
			asString(frontmatter.name) ??
			inferredName;

		const slug =
			asString(frontmatter.slug) ??
			this.slugify(name);

		const kind = asProductKind(frontmatter.kind);

		if (!kind) {
			new Notice(
				'Missing frontmatter: kind'
			);

			return null;
		}

		if (
			typeof frontmatter.price !== 'number'
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

		const autoDetected =
			folder
				? this.plugin.assetService.autoDetectMarketAssets(
						folder.path
				)
				: {
						image: null,
						attachment: null,
				};

		const image =
			asString(frontmatter.cover) ??
			asString(frontmatter.image) ??
			autoDetected.image;

		const attachment =
			asString(frontmatter.attachment) ??
			autoDetected.attachment;


		return {
			name,

			slug,

			kind,

			price: frontmatter.price,

			currency:
				asString(frontmatter.currency) ??
				'USD',

			category:
				asString(frontmatter.category),

			status: asStatus(frontmatter.status),

			visibility: asVisibility(frontmatter.visibility),

			content: markdownContent,

			image,
			attachment,
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

						status: payload.status,

						visibility: payload.visibility,

						cover:
							payload.image,

						tags: payload.tags,

						authors: payload.authors,
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
				await this.withUploadIndicator(
					() =>
						this.plugin.apiClient.uploadPress(
							profile.token,
							formData
						)
				);

			if (!response.success) {
				this.notifyPublishError(
					response.error
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
		} catch (error) {
			this.notifyPublishError(
				(error as Error)?.message
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
					'No Markdown files found in folder'
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
						'Multiple Markdown files found without index.md'
					);

					return false;
				}

				mainFile =
					markdownFiles[0];
			}

			if (!mainFile) {
				return false;
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
					payload: PressPublishPayload
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

							status: payload.status,

							visibility: payload.visibility,

							cover:
								payload.image,

							tags: payload.tags,

							authors: payload.authors,
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
					!mainFile ||
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
				const content = allContent[i];
				const file = markdownFiles[i];

				if (!content || !file) {
					continue;
				}

				const normalized =
					this.plugin.assetService.normalizeMarkdown(
						content
					);

				const assetMap =
					await this.plugin.assetService.buildAssetMap(
						normalized,
						file
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
				await this.withUploadIndicator(
					() =>
						this.plugin.apiClient.uploadPress(
							profile.token,
							formData
						)
				);

			if (!response.success) {
				this.notifyPublishError(
					response.error
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
		} catch (error) {
			this.notifyPublishError(
				(error as Error)?.message
			);

			return false;
		}
	}

	private buildProductFile(
		file: TFile,
		validated: MarketPublishPayload,
		normalizedContent: string
	): ProductFile {
		return {
			filePath: file.path,

			content: normalizedContent,

			metadata: {
				name: validated.name,

				slug: validated.slug,

				kind: validated.kind,

				price: validated.price,

				currency: validated.currency,

				category: validated.category,

				status: validated.status,

				visibility: validated.visibility,

				image: validated.image,

				attachment: validated.attachment,

				pressUrl: null,

				description: null,
			},

			images:
				this.plugin.assetService.buildImageObjects(
					normalizedContent
				),

			videos:
				this.plugin.assetService.extractVideoLinks(
					normalizedContent
				),
		};
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
				file,
				file.parent instanceof TFolder ? file.parent : undefined
			);

		if (!validated) {
			return false;
		}

		const normalizedContent =
			this.plugin.assetService.normalizeMarkdown(
				validated.content
			);

		const productFile =
			this.buildProductFile(
				file,
				validated,
				normalizedContent
			);

		const upload = toProductUpload(productFile);

		const assets =
			await this.plugin.assetService.buildAssetMap(
				normalizedContent,
				file
			);

		const formData =
			buildProductFormData(
				upload,
				assets
			);

		const response =
			await this.withUploadIndicator(
				() =>
					this.plugin.apiClient.uploadProduct(
						profile.token,
						formData
					)
			);

		if (!response.success) {
			this.notifyPublishError(
				response.error
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
	}

	async publishMarketFolder(
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
					'No Markdown files found in folder'
				);

				return false;
			}

			if (
				markdownFiles.length > 1
			) {
				new Notice(
					'Market supports only one Markdown file'
				);

				return false;
			}

			const file =
				markdownFiles[0];

			if (!file) {
				return false;
			}

			const validated =
				await this.validateMarketFile(
					file,
					folder
				);

			if (!validated) {
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

			const normalizedContent =
				this.plugin.assetService.normalizeMarkdown(
					validated.content
				);

			const productFile =
				this.buildProductFile(
					file,
					validated,
					normalizedContent
				);

			const upload = toProductUpload(productFile);

			const rawContent =
				await this.plugin.app.vault.read(
					file
				);

			const assets =
				await this.plugin.assetService.buildAssetMap(
					rawContent,
					file
				);

			if (validated.attachment) {
				const fullAttachmentPath =
					normalizePath(
						`${folder.path}/${validated.attachment.replace(
							'./',
							''
						)}`
					);

				const attachmentFile =
					this.plugin.app.vault.getAbstractFileByPath(
						fullAttachmentPath
					);

				if (attachmentFile instanceof TFile) {
					const attachmentData =
						await this.plugin.app.vault.readBinary(
							attachmentFile
						);

					assets.set(
						validated.attachment,
						new Uint8Array(
							attachmentData
						)
					);
				}
			}

			const formData =
				buildProductFormData(
					upload,
					assets
				);

			const response =
				await this.withUploadIndicator(
					() =>
						this.plugin.apiClient.uploadProduct(
							profile.token,
							formData
						)
				);

			if (!response.success) {
				this.notifyPublishError(
					response.error
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
		} catch (error) {
			this.notifyPublishError(
				(error as Error)?.message
			);

			return false;
		}
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

	private collectMarkdownFiles(
		target: TFile | TFolder
	): TFile[] {
		if (target instanceof TFile) {
			return target.extension === 'md'
				? [target]
				: [];
		}

		return target.children.filter(
			(item): item is TFile =>
				item instanceof TFile &&
				item.extension === 'md'
		);
	}

	private async collectAssetIssues(
		file: TFile,
		content: string
	): Promise<{
		refs: string[];
		issues: DryRunIssue[];
	}> {
		const normalized =
			this.plugin.assetService.normalizeMarkdown(
				content
			);

		const imageRefs =
			this.plugin.assetService.extractImageRefs(
				normalized
			);

		const frontmatterRefs =
			this.plugin.assetService.extractFrontmatterAssets(
				content
			);

		const allRefs = Array.from(
			new Set([
				...imageRefs,
				...frontmatterRefs,
			])
		);

		const issues: DryRunIssue[] = [];

		for (const ref of allRefs) {
			if (
				ref.startsWith('http://') ||
				ref.startsWith('https://')
			) {
				continue;
			}

			const asset =
				this.plugin.app.metadataCache.getFirstLinkpathDest(
					ref,
					file.path
				);

			if (!(asset instanceof TFile)) {
				issues.push({
					severity: 'error',
					message: `Missing asset "${ref}" referenced in ${file.name}`,
				});
			}
		}

		return {
			refs: allRefs,
			issues,
		};
	}

	async dryRunPress(
		target: TFile | TFolder
	): Promise<DryRunReport> {
		const issues: DryRunIssue[] = [];
		const summary: DryRunReport['summary'] =
			[];

		const files =
			this.collectMarkdownFiles(target);

		if (files.length === 0) {
			issues.push({
				severity: 'error',
				message:
					target instanceof TFile
						? 'Only Markdown files can be published'
						: 'No Markdown files found in folder',
			});

			return {
				target: target.name,
				kind: 'press',
				summary,
				issues,
			};
		}

		summary.push({
			label: 'Markdown files',
			value: String(files.length),
		});

		if (target instanceof TFolder) {
			const indexFile = files.find(
				(f) => f.name === 'index.md'
			);

			if (
				!indexFile &&
				files.length > 1
			) {
				issues.push({
					severity: 'error',
					message:
						'Multiple Markdown files found without index.md',
				});
			}

			summary.push({
				label: 'Main file',
				value: indexFile
					? indexFile.name
					: files[0]?.name || '-',
			});
		}

		let totalRefs = 0;

		for (const file of files) {
			const content =
				await this.plugin.app.vault.read(
					file
				);

			const cache =
				this.plugin.app.metadataCache.getFileCache(
					file
				);

			const frontmatter =
				(cache?.frontmatter as PressFrontmatter | undefined) ?? {};

			if (!frontmatter.status) {
				issues.push({
					severity: 'info',
					message: `${file.name}: status not set, defaults to "published"`,
				});
			}

			if (!frontmatter.visibility) {
				issues.push({
					severity: 'info',
					message: `${file.name}: visibility not set, defaults to "public"`,
				});
			}

			const assetCheck =
				await this.collectAssetIssues(
					file,
					content
				);

			totalRefs += assetCheck.refs.length;

			issues.push(
				...assetCheck.issues
			);
		}

		summary.push({
			label: 'Local asset refs',
			value: String(totalRefs),
		});

		return {
			target: target.name,
			kind: 'press',
			summary,
			issues,
		};
	}

	async dryRunMarket(
		target: TFile | TFolder
	): Promise<DryRunReport> {
		const issues: DryRunIssue[] = [];
		const summary: DryRunReport['summary'] =
			[];

		const files =
			this.collectMarkdownFiles(target);

		if (files.length === 0) {
			issues.push({
				severity: 'error',
				message:
					target instanceof TFile
						? 'Only Markdown files can be published'
						: 'No Markdown files found in folder',
			});

			return {
				target: target.name,
				kind: 'market',
				summary,
				issues,
			};
		}

		if (files.length > 1) {
			issues.push({
				severity: 'error',
				message:
					'Market supports only one Markdown file',
			});
		}

		const file = files[0];

		if (!file) {
			return {
				target: target.name,
				kind: 'market',
				summary,
				issues,
			};
		}

		const content =
			await this.plugin.app.vault.read(
				file
			);

		const frontmatter =
			this.parseMarketFrontmatter(content);

		if (!frontmatter.kind) {
			issues.push({
				severity: 'error',
				message:
					'Missing frontmatter: kind',
			});
		}

		if (
			typeof frontmatter.price !== 'number'
		) {
			issues.push({
				severity: 'error',
				message:
					'Missing frontmatter: price',
			});
		}

		if (!frontmatter.currency) {
			issues.push({
				severity: 'info',
				message:
					'currency not set, defaults to "USD"',
			});
		}

		if (!frontmatter.status) {
			issues.push({
				severity: 'info',
				message:
					'status not set, defaults to "published"',
			});
		}

		if (!frontmatter.visibility) {
			issues.push({
				severity: 'info',
				message:
					'visibility not set, defaults to "public"',
			});
		}

		summary.push({
			label: 'File',
			value: file.name,
		});

		const kindString = asString(frontmatter.kind);
		if (kindString) {
			summary.push({
				label: 'Kind',
				value: kindString,
			});
		}

		if (
			typeof frontmatter.price === 'number'
		) {
			const currencyString =
				asString(frontmatter.currency) ?? 'USD';

			summary.push({
				label: 'Price',
				value: `${frontmatter.price} ${currencyString}`,
			});
		}

		const folder =
			target instanceof TFolder
				? target
				: file.parent;

		const autoDetected = folder
			? this.plugin.assetService.autoDetectMarketAssets(
					folder.path
				)
			: {
					image: null,
					attachment: null,
				};

		const image =
			asString(frontmatter.cover) ??
			asString(frontmatter.image) ??
			autoDetected.image;

		const attachment =
			asString(frontmatter.attachment) ??
			autoDetected.attachment;

		if (!image) {
			issues.push({
				severity: 'warning',
				message:
					'No cover image detected',
			});
		} else {
			summary.push({
				label: 'Image',
				value: image,
			});
		}

		if (attachment) {
			summary.push({
				label: 'Attachment',
				value: attachment,
			});
		}

		const assetCheck =
			await this.collectAssetIssues(
				file,
				content
			);

		issues.push(...assetCheck.issues);

		summary.push({
			label: 'Local asset refs',
			value: String(
				assetCheck.refs.length
			),
		});

		return {
			target: target.name,
			kind: 'market',
			summary,
			issues,
		};
	}
}
