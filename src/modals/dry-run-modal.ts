import {
	App,
	Modal,
	setIcon,
} from 'obsidian';

import { DryRunReport } from '../types/dry-run';

import { SentilisPluginInterface } from '../types/plugin';

const SEVERITY_ICON = {
	error: 'x-circle',
	warning: 'alert-triangle',
	info: 'info',
} as const;

export class DryRunModal extends Modal {
	plugin: SentilisPluginInterface;

	report: DryRunReport;

	constructor(
		app: App,
		plugin: SentilisPluginInterface,
		report: DryRunReport
	) {
		super(app);

		this.plugin = plugin;

		this.report = report;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.empty();

		contentEl.addClass(
			'sentilis-premium-modal'
		);

		this.modalEl.addClass(
			'sentilis-large-modal'
		);

		const errors =
			this.report.issues.filter(
				(i) => i.severity === 'error'
			);

		const header = contentEl.createDiv({
			cls: 'sentilis-premium-header',
		});

		const statusIcon = header.createSpan(
			{
				cls: `sentilis-status-icon sentilis-status-${
					errors.length === 0
						? 'published'
						: 'archived'
				}`,
			}
		);

		setIcon(
			statusIcon,
			errors.length === 0
				? 'check-circle-2'
				: 'alert-triangle'
		);

		header.createEl('h1', {
			text: `${this.report.kind === 'press' ? 'Press' : 'Market'} · ${this.report.target}`,
			cls: 'sentilis-premium-title',
		});

		if (this.report.summary.length > 0) {
			const meta = contentEl.createDiv({
				cls: 'sentilis-premium-meta',
			});

			for (const item of this.report
				.summary) {
				const itemEl =
					meta.createDiv({
						cls: 'sentilis-meta-item',
					});

				itemEl.createDiv({
					cls: 'sentilis-meta-top',
					text: item.label,
				});

				itemEl.createEl('strong', {
					text: item.value,
				});
			}
		}

		if (this.report.issues.length === 0) {
			contentEl.createEl('p', {
				text: this.plugin.t(
					'dryRun.allGood'
				),
				cls: 'sentilis-dry-run-allgood',
			});

			return;
		}

		contentEl.createDiv({
			cls: 'sentilis-premium-divider',
		});

		const list = contentEl.createDiv({
			cls: 'sentilis-dry-run-issues',
		});

		for (const issue of this.report
			.issues) {
			const row = list.createDiv({
				cls: `sentilis-dry-run-issue sentilis-dry-run-${issue.severity}`,
			});

			const iconEl = row.createSpan({
				cls: 'sentilis-dry-run-icon',
			});

			setIcon(
				iconEl,
				SEVERITY_ICON[issue.severity]
			);

			row.createSpan({
				text: issue.message,
			});
		}
	}

	onClose() {
		this.contentEl.empty();
	}
}
