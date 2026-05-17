import { App, Modal, TFile, TFolder, setIcon } from 'obsidian';

import { SentilisPluginInterface } from '../plugin';
import { DryRunReport } from '../publish';

const SEVERITY_ICON = {
	error: 'x-circle',
	warning: 'alert-triangle',
	info: 'info',
} as const;

type Kind = 'press' | 'market' | 'bio';

interface PublishModalOptions {
	kind: Kind;
	target: TFile | TFolder;
}

type State =
	| { phase: 'validating' }
	| { phase: 'ready'; report: DryRunReport; canPublish: boolean }
	| { phase: 'publishing'; report: DryRunReport }
	| { phase: 'published'; report: DryRunReport; url: string }
	| { phase: 'failed'; report: DryRunReport; error: string };

export class PublishModal extends Modal {
	private plugin: SentilisPluginInterface;
	private opts: PublishModalOptions;
	private state: State = { phase: 'validating' };

	constructor(
		app: App,
		plugin: SentilisPluginInterface,
		opts: PublishModalOptions,
	) {
		super(app);
		this.plugin = plugin;
		this.opts = opts;
	}

	async onOpen() {
		this.contentEl.addClass('sentilis-premium-modal');
		this.modalEl.addClass('sentilis-large-modal');
		this.render();
		await this.runDryRun();
	}

	onClose() {
		this.contentEl.empty();
	}

	private async runDryRun() {
		const service = this.plugin.publishService;
		const target = this.opts.target;
		const report =
			this.opts.kind === 'press'
				? await service.dryRunPress(target)
				: this.opts.kind === 'market'
					? await service.dryRunMarket(target)
					: await service.dryRunBio(target);

		const hasFatal = report.issues.some((i) => i.severity === 'error');
		this.state = { phase: 'ready', report, canPublish: !hasFatal };
		this.render();
	}

	private async runPublish() {
		const report = this.currentReport();
		if (!report) return;

		this.state = { phase: 'publishing', report };
		this.render();

		const { target, kind } = this.opts;
		const service = this.plugin.publishService;

		const result =
			kind === 'press'
				? target instanceof TFile
					? await service.publishPressFile(target)
					: await service.publishPressFolder(target)
				: kind === 'market'
					? target instanceof TFile
						? await service.publishMarketFile(target)
						: await service.publishMarketFolder(target)
					: target instanceof TFile
						? await service.publishBioFile(target)
						: await service.publishBioFolder(target);

		this.state = result.ok
			? { phase: 'published', report, url: result.url }
			: { phase: 'failed', report, error: result.error };

		this.render();
	}

	private currentReport(): DryRunReport | null {
		switch (this.state.phase) {
			case 'ready':
			case 'publishing':
			case 'published':
			case 'failed':
				return this.state.report;
			default:
				return null;
		}
	}

	private render() {
		const t = (k: string) => this.plugin.t(k);
		const { contentEl } = this;
		contentEl.empty();

		// Header
		const header = contentEl.createDiv({ cls: 'sentilis-premium-header' });
		const headerIcon = header.createSpan({ cls: 'sentilis-status-icon' });
		const kindLabel =
			this.opts.kind === 'press'
				? 'Press'
				: this.opts.kind === 'market'
					? 'Market'
					: 'Bio';
		header.createEl('h1', {
			text: `${kindLabel} · ${this.opts.target.name}`,
			cls: 'sentilis-premium-title',
		});

		if (this.state.phase === 'validating') {
			setIcon(headerIcon, 'loader-2');
			headerIcon.addClass('sentilis-status-icon-loading');
			contentEl.createEl('p', {
				text: t('publish.validating'),
				cls: 'sentilis-dry-run-allgood',
			});
			this.renderFooter(contentEl);
			return;
		}

		const report = this.currentReport();
		if (!report) return;

		const fatalCount = report.issues.filter((i) => i.severity === 'error').length;

		const okIconState =
			this.state.phase === 'published'
				? 'published'
				: fatalCount === 0
					? 'published'
					: 'archived';
		headerIcon.addClass(`sentilis-status-${okIconState}`);
		setIcon(
			headerIcon,
			this.state.phase === 'published' || fatalCount === 0
				? 'check-circle-2'
				: 'alert-triangle',
		);

		// Summary
		if (report.summary.length > 0) {
			const meta = contentEl.createDiv({ cls: 'sentilis-premium-meta' });
			for (const item of report.summary) {
				const itemEl = meta.createDiv({ cls: 'sentilis-meta-item' });
				itemEl.createDiv({ cls: 'sentilis-meta-top', text: item.label });
				itemEl.createEl('strong', { text: item.value });
			}
		}

		// Issues
		if (report.issues.length > 0) {
			contentEl.createDiv({ cls: 'sentilis-premium-divider' });
			const list = contentEl.createDiv({ cls: 'sentilis-dry-run-issues' });
			for (const issue of report.issues) {
				const row = list.createDiv({
					cls: `sentilis-dry-run-issue sentilis-dry-run-${issue.severity}`,
				});
				const iconEl = row.createSpan({ cls: 'sentilis-dry-run-icon' });
				setIcon(iconEl, SEVERITY_ICON[issue.severity]);
				row.createSpan({ text: issue.message });
			}
		} else if (this.state.phase === 'ready') {
			contentEl.createEl('p', {
				text: t('dryRun.allGood'),
				cls: 'sentilis-dry-run-allgood',
			});
		}

		// Result banner
		if (this.state.phase === 'published') {
			contentEl.createDiv({ cls: 'sentilis-premium-divider' });
			const banner = contentEl.createDiv({
				cls: 'sentilis-dry-run-issue sentilis-dry-run-info sentilis-publish-success',
			});
			const iconEl = banner.createSpan({ cls: 'sentilis-dry-run-icon' });
			setIcon(iconEl, 'check-circle-2');
			banner.createSpan({ text: t('publish.success') });
		} else if (this.state.phase === 'failed') {
			contentEl.createDiv({ cls: 'sentilis-premium-divider' });
			const row = contentEl.createDiv({
				cls: 'sentilis-dry-run-issue sentilis-dry-run-error',
			});
			const iconEl = row.createSpan({ cls: 'sentilis-dry-run-icon' });
			setIcon(iconEl, 'x-circle');
			row.createSpan({ text: this.state.error });
		}

		this.renderFooter(contentEl);
	}

	private renderFooter(parent: HTMLElement) {
		const t = (k: string) => this.plugin.t(k);
		const footer = parent.createDiv({
			cls: 'modal-button-container sentilis-publish-footer',
		});

		const closeBtn = footer.createEl('button', { text: t('common.close') });
		closeBtn.addEventListener('click', () => this.close());

		// if (this.state.phase === 'published') {
		// 	const url = this.state.url;
		//
		// 	const copyBtn = footer.createEl('button');
		// 	setIcon(copyBtn.createSpan({ cls: 'sentilis-btn-icon' }), 'copy');
		// 	copyBtn.createSpan({ text: t('common.copyLink') });
		// 	copyBtn.addEventListener('click', () => {
		// 		void navigator.clipboard.writeText(url).then(() => {
		// 			new Notice(t('common.linkCopied'));
		// 		});
		// 	});
		//
		// 	const openBtn = footer.createEl('button');
		// 	setIcon(openBtn.createSpan({ cls: 'sentilis-btn-icon' }), 'external-link');
		// 	openBtn.createSpan({ text: t('common.openLink') });
		// 	openBtn.addEventListener('click', () => {
		// 		window.open(url, '_blank');
		// 	});
		// }

		const publishBtn = footer.createEl('button', { cls: 'mod-cta' });

		let label: string;
		let disabled = false;
		let tooltip: string | null = null;

		switch (this.state.phase) {
			case 'validating':
				label = t('publish.validating');
				disabled = true;
				break;
			case 'publishing':
				label = t('publish.uploading');
				disabled = true;
				break;
			case 'published':
				label = t('publish.republish');
				break;
			case 'failed':
				label = t('publish.publish');
				break;
			case 'ready':
				label = t('publish.publish');
				disabled = !this.state.canPublish;
				if (disabled) tooltip = t('publish.cannotPublish');
				break;
		}

		publishBtn.textContent = label;
		publishBtn.disabled = disabled;
		if (tooltip) publishBtn.setAttribute('title', tooltip);
		publishBtn.addEventListener('click', () => {
			void this.runPublish();
		});
	}
}
