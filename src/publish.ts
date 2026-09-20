import { Notice, TFile, TFolder } from 'obsidian';

import { SentilisPluginInterface } from './plugin';
import { SENTILIS_EVENTS } from './events';
import { ObsidianFileSystem } from './fs';

import {
	RestClient,
	formatIssue,
	type FileSystem,
	type ValidationIssue,
} from '@sentilis/sdk';

import {
	createPress,
	publishPress,
} from '@sentilis/sdk/press';

import {
	createProduct,
	publishProduct,
} from '@sentilis/sdk/market';

import {
	createBio,
	publishBio,
} from '@sentilis/sdk/bio';

import {
	createGallery,
	publishGallery,
} from '@sentilis/sdk/gallery';

export type DryRunSeverity = 'error' | 'warning' | 'info';

export interface DryRunIssue {
	severity: DryRunSeverity;
	message: string;
	code?: string;
}

export interface DryRunReport {
	target: string;
	kind: 'press' | 'market' | 'bio' | 'gallery';
	summary: Array<{
		label: string;
		value: string;
	}>;
	issues: DryRunIssue[];
}

export type PublishResult =
	| { ok: true; url: string }
	| { ok: false; error: string };

/**
 * Wraps the core walker / publisher and surfaces results in
 * Obsidian-shaped form (Notice toasts, DryRunReport for the modal).
 *
 * All validation rules and defaults now live in `@sentilis/sdk` —
 * this class only resolves the target path, builds the report, and
 * gates uploads on the network / profile state.
 */
export class PublishService {
	plugin: SentilisPluginInterface;
	private fs: FileSystem;

	constructor(plugin: SentilisPluginInterface) {
		this.plugin = plugin;
		this.fs = new ObsidianFileSystem(plugin.app);
	}

	// ---------- Internals ----------

	private targetPath(target: TFile | TFolder): string {
		return target.path;
	}

	private translateIssue(issue: ValidationIssue): string {
		const key = `errors.${issue.code}`;
		const translated = this.plugin.t(key);
		if (translated !== key) return interpolate(translated, issue.params);
		return formatIssue(issue);
	}

	private requireProfile() {
		const profile = this.plugin.getCurrentProfile();
		if (!profile) {
			new Notice(this.plugin.t('publish.noProfile'));
			return null;
		}
		return profile;
	}

	// ---------- Press ----------

	async publishPressFile(file: TFile): Promise<PublishResult> {
		return this.publishPressPath(file.path);
	}

	async publishPressFolder(folder: TFolder): Promise<PublishResult> {
		return this.publishPressPath(folder.path);
	}

	private async publishPressPath(path: string): Promise<PublishResult> {
		if (this.plugin.networkService.getStatus()) {
			return { ok: false, error: this.plugin.t('publish.offline') };
		}
		const profile = this.plugin.getCurrentProfile();
		if (!profile) {
			return { ok: false, error: this.plugin.t('publish.noProfile') };
		}

		try {
			const result = await createPress(this.fs, path);
			const response = await publishPress(
				new RestClient(profile.token),
				this.fs,
				result,
			);
			this.plugin.app.workspace.trigger(SENTILIS_EVENTS.PRESS_PUBLISHED);
			return { ok: true, url: response.data.url };
		} catch (error) {
			console.error('[Sentilis] publish failed:', error);
			return { ok: false, error: (error as Error)?.message ?? 'Unknown error' };
		}
	}

	async dryRunPress(target: TFile | TFolder): Promise<DryRunReport> {
		return this.dryRun('press', target);
	}

	// ---------- Market ----------

	async publishMarketFile(file: TFile): Promise<PublishResult> {
		return this.publishMarketPath(file.path);
	}

	async publishMarketFolder(folder: TFolder): Promise<PublishResult> {
		return this.publishMarketPath(folder.path);
	}

	private async publishMarketPath(path: string): Promise<PublishResult> {
		if (this.plugin.networkService.getStatus()) {
			return { ok: false, error: this.plugin.t('publish.offline') };
		}
		const profile = this.plugin.getCurrentProfile();
		if (!profile) {
			return { ok: false, error: this.plugin.t('publish.noProfile') };
		}

		try {
			const result = await createProduct(this.fs, path);
			const response = await publishProduct(
				new RestClient(profile.token),
				this.fs,
				result,
			);
			this.plugin.app.workspace.trigger(SENTILIS_EVENTS.PRESS_PUBLISHED);
			return { ok: true, url: response.data.url };
		} catch (error) {
			console.error('[Sentilis] publish failed:', error);
			return { ok: false, error: (error as Error)?.message ?? 'Unknown error' };
		}
	}

	async dryRunMarket(target: TFile | TFolder): Promise<DryRunReport> {
		return this.dryRun('market', target);
	}

	// ---------- Bio ----------

	async publishBioFile(file: TFile): Promise<PublishResult> {
		return this.publishBioPath(file.path);
	}

	async publishBioFolder(folder: TFolder): Promise<PublishResult> {
		return this.publishBioPath(folder.path);
	}

	private async publishBioPath(path: string): Promise<PublishResult> {
		if (this.plugin.networkService.getStatus()) {
			return { ok: false, error: this.plugin.t('publish.offline') };
		}
		const profile = this.plugin.getCurrentProfile();
		if (!profile) {
			return { ok: false, error: this.plugin.t('publish.noProfile') };
		}

		try {
			const result = await createBio(this.fs, path);
			const client = new RestClient(profile.token);
			const response = await publishBio(client, this.fs, result);
			this.plugin.app.workspace.trigger(SENTILIS_EVENTS.PRESS_PUBLISHED);

			let url = '';
			try {
				const detail = await client.getBio(response.data.id);
				url = detail.data.url ?? '';
			} catch {
				// non-fatal: publication succeeded, URL lookup failed.
			}
			return { ok: true, url };
		} catch (error) {
			console.error('[Sentilis] publish failed:', error);
			return { ok: false, error: (error as Error)?.message ?? 'Unknown error' };
		}
	}

	async dryRunBio(target: TFile | TFolder): Promise<DryRunReport> {
		return this.dryRun('bio', target);
	}

	// ---------- Gallery ----------

	async publishGalleryFile(file: TFile): Promise<PublishResult> {
		return this.publishGalleryPath(file.path);
	}

	async publishGalleryFolder(folder: TFolder): Promise<PublishResult> {
		return this.publishGalleryPath(folder.path);
	}

	private async publishGalleryPath(path: string): Promise<PublishResult> {
		if (this.plugin.networkService.getStatus()) {
			return { ok: false, error: this.plugin.t('publish.offline') };
		}
		const profile = this.plugin.getCurrentProfile();
		if (!profile) {
			return { ok: false, error: this.plugin.t('publish.noProfile') };
		}

		try {
			const result = await createGallery(this.fs, path);
			const response = await publishGallery(
				new RestClient(profile.token),
				this.fs,
				result,
			);
			this.plugin.app.workspace.trigger(SENTILIS_EVENTS.PRESS_PUBLISHED);
			return { ok: true, url: response.data.url };
		} catch (error) {
			console.error('[Sentilis] publish failed:', error);
			return { ok: false, error: (error as Error)?.message ?? 'Unknown error' };
		}
	}

	async dryRunGallery(target: TFile | TFolder): Promise<DryRunReport> {
		return this.dryRun('gallery', target);
	}

	// ---------- Dry run ----------

	private async dryRun(
		kind: 'press' | 'market' | 'bio' | 'gallery',
		target: TFile | TFolder,
	): Promise<DryRunReport> {
		const path = this.targetPath(target);
		const issues: DryRunIssue[] = [];
		const summary: DryRunReport['summary'] = [];

		try {
			if (kind === 'press') {
				const result = await createPress(this.fs, path, {
					collectErrors: true,
				});
				const { metadata } = result.main;
				summary.push({ label: 'Name', value: metadata.name });
				summary.push({ label: 'Slug', value: metadata.slug });
				summary.push({ label: 'Status', value: metadata.status });
				summary.push({ label: 'Visibility', value: metadata.visibility });
				if (metadata.password) {
					// La contraseña no se enseña: lo que importa antes de
					// publicar es saber que la entrada va cerrada y que las
					// subpáginas se cierran con ella.
					summary.push({
						label: 'Password',
						value:
							result.hidden.length > 0
								? 'set (inherited by sub-pages)'
								: 'set',
					});
				}
				if (metadata.cover) {
					summary.push({ label: 'Cover', value: metadata.cover });
				}
				if (result.hidden.length > 0) {
					summary.push({
						label: 'Children',
						value: String(result.hidden.length),
					});
				}
				for (const i of result.issues) {
					issues.push(this.toDryRunIssue(i));
				}
			} else if (kind === 'market') {
				const result = await createProduct(this.fs, path, {
					collectErrors: true,
				});
				const { metadata } = result.main;
				summary.push({ label: 'Name', value: metadata.name });
				summary.push({ label: 'Kind', value: metadata.kind });
				summary.push({
					label: 'Price',
					value: `${metadata.price}${metadata.currency ? ' ' + metadata.currency : ''}`,
				});
				summary.push({ label: 'Status', value: metadata.status });
				summary.push({ label: 'Visibility', value: metadata.visibility });
				if (metadata.cover) {
					summary.push({ label: 'Cover', value: metadata.cover });
				}
				if (metadata.attachment) {
					summary.push({ label: 'Attachment', value: metadata.attachment });
				}
				for (const i of result.issues) {
					issues.push(this.toDryRunIssue(i));
				}
			} else if (kind === 'gallery') {
				const result = await createGallery(this.fs, path, {
					collectErrors: true,
				});
				const { metadata } = result.main;
				summary.push({ label: 'Name', value: metadata.name });
				summary.push({ label: 'Slug', value: metadata.slug });
				summary.push({
					label: 'Images',
					value: String(result.main.images.length),
				});
				if (metadata.year) {
					summary.push({ label: 'Year', value: metadata.year });
				}
				if (metadata.series) {
					summary.push({ label: 'Series', value: metadata.series });
				}
				summary.push({ label: 'Status', value: metadata.status });
				summary.push({ label: 'Visibility', value: metadata.visibility });
				for (const i of result.issues) {
					issues.push(this.toDryRunIssue(i));
				}
			} else {
				const result = await createBio(this.fs, path, {
					collectErrors: true,
				});
				const { metadata } = result.main;
				summary.push({ label: 'Name', value: metadata.name });
				summary.push({ label: 'Slug', value: metadata.slug });
				summary.push({ label: 'Language', value: metadata.language });
				summary.push({ label: 'Status', value: metadata.status });
				summary.push({ label: 'Visibility', value: metadata.visibility });
				if (metadata.role) {
					summary.push({ label: 'Role', value: metadata.role });
				}
				if (metadata.avatar) {
					summary.push({ label: 'Avatar', value: metadata.avatar });
				}
				if (result.variants.length > 0) {
					summary.push({
						label: 'Variants',
						value: result.variants.map((v) => v.metadata.language).join(', '),
					});
				}
				for (const i of result.issues) {
					issues.push(this.toDryRunIssue(i));
				}
			}
		} catch (error) {
			// Structural error: surface as a single fatal issue.
			issues.push({
				severity: 'error',
				message: (error as Error)?.message ?? String(error),
			});
		}

		return { target: target.name, kind, summary, issues };
	}

	private toDryRunIssue(issue: ValidationIssue): DryRunIssue {
		return {
			// El SDK ya marca lo que es un aviso; su criterio manda, y esta
			// tabla local queda solo para los códigos que no lo traen.
			severity: issue.severity === 'warning' ? 'warning' : severityFor(issue.code),
			message: `${issue.file ? `[${issue.file}] ` : ''}${this.translateIssue(issue)}`,
			code: issue.code,
		};
	}

	// ---------- Delete ----------

	async deletePress(id: string): Promise<boolean> {
		const profile = this.requireProfile();
		if (!profile) return false;
		try {
			await new RestClient(profile.token).removePress(id);
		} catch (error) {
			new Notice(
				`${this.plugin.t('publish.deleteFailed')}: ${(error as Error)?.message}`,
			);
			return false;
		}
		new Notice(this.plugin.t('publish.pressDeleted'));
		this.plugin.app.workspace.trigger(SENTILIS_EVENTS.PRESS_PUBLISHED);
		return true;
	}

	async deleteMarket(id: string): Promise<boolean> {
		const profile = this.requireProfile();
		if (!profile) return false;
		try {
			await new RestClient(profile.token).removeProduct(id);
		} catch (error) {
			new Notice(
				`${this.plugin.t('publish.deleteFailed')}: ${(error as Error)?.message}`,
			);
			return false;
		}
		new Notice(this.plugin.t('publish.marketDeleted'));
		this.plugin.app.workspace.trigger(SENTILIS_EVENTS.PRESS_PUBLISHED);
		return true;
	}

	async deleteGallery(id: string): Promise<boolean> {
		const profile = this.requireProfile();
		if (!profile) return false;
		try {
			await new RestClient(profile.token).removeGallery(id);
		} catch (error) {
			new Notice(
				`${this.plugin.t('publish.deleteFailed')}: ${(error as Error)?.message}`,
			);
			return false;
		}
		new Notice(this.plugin.t('publish.galleryDeleted'));
		this.plugin.app.workspace.trigger(SENTILIS_EVENTS.PRESS_PUBLISHED);
		return true;
	}

	async deleteBio(id: string): Promise<boolean> {
		const profile = this.requireProfile();
		if (!profile) return false;
		try {
			await new RestClient(profile.token).removeBio(id);
		} catch (error) {
			new Notice(
				`${this.plugin.t('publish.deleteFailed')}: ${(error as Error)?.message}`,
			);
			return false;
		}
		new Notice(this.plugin.t('publish.bioDeleted'));
		this.plugin.app.workspace.trigger(SENTILIS_EVENTS.PRESS_PUBLISHED);
		return true;
	}
}

/**
 * Bucket the validation codes into Obsidian's three-level severity. Most
 * walker output is fatal (error); a few advisory codes — like multiple
 * auto-detect candidates — are surfaced as warnings.
 */
/** Respaldo para los issues que no traen `severity` del SDK. */
function severityFor(code: ValidationIssue['code']): DryRunSeverity {
	switch (code) {
		case 'MULTIPLE_COVER_CANDIDATES':
		case 'MULTIPLE_AVATAR_CANDIDATES':
			return 'warning';
		default:
			return 'error';
	}
}

function interpolate(template: string, params?: Record<string, unknown>): string {
	if (!params) return template;
	return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
		const value = params[key];
		if (value === undefined) return `{${key}}`;
		if (typeof value === 'string') return value;
		if (typeof value === 'number' || typeof value === 'boolean') {
			return String(value);
		}
		return JSON.stringify(value);
	});
}
