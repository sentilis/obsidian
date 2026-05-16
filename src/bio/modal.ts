import { App, Modal, Notice, setIcon } from 'obsidian';

import { RestClient } from '@sentilis/core';

import { BioDetailItem } from './types';

import { SentilisPluginInterface } from '../plugin';

import {
	statusIconName,
	statusIconClass,
	visibilityIconName,
	visibilityIconClass,
} from '../ui/status-icon';

export class BioDetailModal extends Modal {
	plugin: SentilisPluginInterface;
	bioId: string;

	constructor(app: App, plugin: SentilisPluginInterface, bioId: string) {
		super(app);
		this.plugin = plugin;
		this.bioId = bioId;
	}

	private async copyToClipboard(value: string, notice: string) {
		try {
			await navigator.clipboard.writeText(value);
			new Notice(notice);
		} catch {
			new Notice(value);
		}
	}

	private addCopyButton(parent: HTMLElement, url: string) {
		const btn = parent.createEl('button', {
			cls: 'sentilis-inline-link',
			attr: {
				type: 'button',
				'aria-label': this.plugin.t('common.copyLink'),
				title: this.plugin.t('common.copyLink'),
			},
		});

		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			e.preventDefault();
			void this.copyToClipboard(
				url,
				this.plugin.t('common.linkCopied'),
			);
		});

		setIcon(btn, 'copy');
	}

	private renderFooter(
		parent: HTMLElement,
		opts: { url?: string | null; id?: string | null },
	) {
		const { url, id } = opts;

		if (!url && !id) {
			return;
		}

		const footer = parent.createDiv({ cls: 'sentilis-modal-footer' });

		if (id) {
			const copyIdBtn = footer.createEl('button', {
				cls: 'sentilis-action-pill',
				attr: {
					type: 'button',
					'aria-label': this.plugin.t('common.copyId'),
					title: this.plugin.t('common.copyId'),
				},
			});
			const copyIdIcon = copyIdBtn.createSpan();
			setIcon(copyIdIcon, 'hash');
			copyIdBtn.createSpan({ text: this.plugin.t('common.copyId') });
			copyIdBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				e.preventDefault();
				void this.copyToClipboard(
					id,
					this.plugin.t('common.idCopied'),
				);
			});
		}

		if (url) {
			const copyLinkBtn = footer.createEl('button', {
				cls: 'sentilis-action-pill',
				attr: {
					type: 'button',
					'aria-label': this.plugin.t('common.copyLink'),
					title: this.plugin.t('common.copyLink'),
				},
			});
			const copyLinkIcon = copyLinkBtn.createSpan();
			setIcon(copyLinkIcon, 'copy');
			copyLinkBtn.createSpan({ text: this.plugin.t('common.copyLink') });
			copyLinkBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				e.preventDefault();
				void this.copyToClipboard(
					url,
					this.plugin.t('common.linkCopied'),
				);
			});

			const openBtn = footer.createEl('a', {
				href: url,
				cls: 'sentilis-action-pill is-primary',
				attr: {
					target: '_blank',
					rel: 'noopener',
					'aria-label': this.plugin.t('common.openLink'),
					title: this.plugin.t('common.openLink'),
				},
			});
			const openIcon = openBtn.createSpan();
			setIcon(openIcon, 'external-link');
			openBtn.createSpan({ text: this.plugin.t('common.openLink') });
		}
	}

	async onOpen() {
		this.contentEl.addClass('sentilis-premium-modal');
		this.modalEl.addClass('sentilis-large-modal');
		await this.renderDetail();
	}

	private async renderDetail() {
		const { contentEl } = this;
		contentEl.empty();

		const profile = this.plugin.getCurrentProfile();
		if (!profile) {
			new Notice(this.plugin.t('bioDetail.noProfile'));
			this.close();
			return;
		}

		contentEl.createEl('p', {
			text: this.plugin.t('bioDetail.loading'),
		});

		let item: BioDetailItem;
		try {
			const res = await new RestClient(profile.token).getBio(this.bioId);
			item = res.data;
		} catch (error) {
			contentEl.empty();
			contentEl.createEl('p', {
				text:
					(error as Error)?.message ||
					this.plugin.t('bioDetail.failedLoad'),
			});
			return;
		}

		contentEl.empty();

		const header = contentEl.createDiv({ cls: 'sentilis-premium-header' });

		header.createEl('h1', {
			text: item.name,
			cls: 'sentilis-premium-title',
		});

		const meta = contentEl.createDiv({ cls: 'sentilis-premium-meta' });

		const createMetaItem = (icon: string, label: string, value: string) => {
			const itemEl = meta.createDiv({ cls: 'sentilis-meta-item' });
			const top = itemEl.createDiv({ cls: 'sentilis-meta-top' });
			const iconEl = top.createSpan();
			setIcon(iconEl, icon);
			top.createSpan({ text: label });
			itemEl.createEl('strong', { text: value });
		};

		createMetaItem(
			statusIconName(item.status),
			this.plugin.t('bioDetail.status'),
			item.status || '-',
		);

		createMetaItem(
			'globe',
			this.plugin.t('bioDetail.visibility'),
			item.visibility || '-',
		);

		createMetaItem(
			'languages',
			this.plugin.t('bioDetail.language'),
			item.language || '-',
		);

		if (item.role) {
			createMetaItem('briefcase', this.plugin.t('bioDetail.role'), item.role);
		}

		if (item.location) {
			createMetaItem(
				'map-pin',
				this.plugin.t('bioDetail.location'),
				item.location,
			);
		}

		if (item.email) {
			createMetaItem('mail', this.plugin.t('bioDetail.email'), item.email);
		}

		if (item.phone) {
			createMetaItem('phone', this.plugin.t('bioDetail.phone'), item.phone);
		}

		if (item.children && item.children.length > 0) {
			contentEl.createDiv({ cls: 'sentilis-premium-divider' });

			const variantsHeader = contentEl.createDiv({
				cls: 'sentilis-children-premium-header',
			});

			variantsHeader.createEl('h2', {
				text: this.plugin.t('bioDetail.variants'),
			});

			variantsHeader.createEl('span', {
				text: String(item.children.length),
				cls: 'sentilis-children-badge',
			});

			const list = contentEl.createDiv({ cls: 'sentilis-premium-list' });

			item.children.forEach((variant) => {
				const row = list.createDiv({ cls: 'sentilis-premium-row' });

				const left = row.createDiv({ cls: 'sentilis-premium-row-left' });

				const variantStatusIcon = left.createSpan({
					cls: statusIconClass(variant.status),
					attr: {
						'aria-label': variant.status || 'unknown',
						title: variant.status || '',
					},
				});
				setIcon(variantStatusIcon, statusIconName(variant.status));

				if (variant.visibility) {
					const variantVisIcon = left.createSpan({
						cls: visibilityIconClass(variant.visibility),
						attr: {
							'aria-label': variant.visibility || 'unknown',
							title: variant.visibility || '',
						},
					});
					setIcon(
						variantVisIcon,
						visibilityIconName(variant.visibility),
					);
				}

				left.createEl('span', {
					text: `${variant.language}: ${variant.name}`,
					cls: 'sentilis-row-title',
				});

				const right = row.createDiv({ cls: 'sentilis-premium-row-right' });

				if (variant.url) {
					const variantLink = right.createEl('a', {
						href: variant.url,
						cls: 'sentilis-inline-link',
						attr: {
							'aria-label': this.plugin.t('bioDetail.openUrl'),
							title: this.plugin.t('bioDetail.openUrl'),
						},
					});
					variantLink.target = '_blank';
					variantLink.addEventListener('click', (e) => {
						e.stopPropagation();
					});
					setIcon(variantLink, 'external-link');
					this.addCopyButton(right, variant.url);
				}
			});
		}

		this.renderFooter(contentEl, {
			url: item.url,
			id: item.id,
		});
	}

	onClose() {
		this.contentEl.empty();
	}
}
