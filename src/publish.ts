import { Notice, TFile, TFolder } from 'obsidian';

import { SentilisPluginInterface } from './plugin';
import { SENTILIS_EVENTS } from './events';
import { ObsidianFileSystem } from './fs';

import {
	RestClient,
	formatIssue,
	type FileSystem,
	type ValidationIssue,
} from '@sentilis/core';

import {
	createPress,
	publishPress,
} from '@sentilis/core/press';

import {
	createProduct,
	publishProduct,
} from '@sentilis/core/market';

import {
	createBio,
	publishBio,
} from '@sentilis/core/bio';

export type DryRunSeverity = 'error' | 'warning' | 'info';

export interface DryRunIssue {
	severity: DryRunSeverity;
	message: string;
	code?: string;
}

export interface DryRunReport {
	target: string;
	kind: 'press' | 'market' | 'bio';
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
 * All validation rules and defaults now live in `@sentilis/core` —
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

	// ---------- Dry run ----------

	private async dryRun(
		kind: 'press' | 'market' | 'bio',
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
				if (metadata.image) {
					summary.push({ label: 'Image', value: metadata.image });
				}
				if (metadata.attachment) {
					summary.push({ label: 'Attachment', value: metadata.attachment });
				}
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
			severity: severityFor(issue.code),
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
function severityFor(code: ValidationIssue['code']): DryRunSeverity {
	switch (code) {
		case 'MULTIPLE_COVER_CANDIDATES':
		case 'MULTIPLE_IMAGE_CANDIDATES':
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
