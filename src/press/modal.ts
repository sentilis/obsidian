import {
	App,
	Modal,
	Notice,
	setIcon,
} from 'obsidian';

import { RestClient } from '@sentilis/core';

import { PressDetailItem } from './types';

import { SentilisPluginInterface } from '../plugin';

import {
	statusIconName,
	statusIconClass,
	visibilityIconName,
	visibilityIconClass,
} from '../ui/status-icon';

export class PressDetailModal extends Modal {
	plugin: SentilisPluginInterface;

	pressId: string;

	private async copyToClipboard(
		value: string,
		notice: string
	) {
		try {
			await navigator.clipboard.writeText(
				value
			);

			new Notice(notice);
		} catch {
			new Notice(value);
		}
	}

	private addCopyButton(
		parent: HTMLElement,
		url: string
	) {
		const btn = parent.createEl(
			'button',
			{
				cls: 'sentilis-inline-link',
				attr: {
					type: 'button',
					'aria-label':
						this.plugin.t(
							'common.copyLink'
						),
					title: this.plugin.t(
						'common.copyLink'
					),
				},
			}
		);

		btn.addEventListener(
			'click',
			(e) => {
				e.stopPropagation();
				e.preventDefault();

				void this.copyToClipboard(
					url,
					this.plugin.t('common.linkCopied')
				);
			}
		);

		setIcon(btn, 'copy');
	}

	private renderFooter(
		parent: HTMLElement,
		opts: {
			url?: string | null;
			id?: string | null;
		}
	) {
		const { url, id } = opts;

		if (!url && !id) {
			return;
		}

		const footer = parent.createDiv({
			cls: 'sentilis-modal-footer',
		});

		if (id) {
			const copyIdBtn = footer.createEl(
				'button',
				{
					cls: 'sentilis-action-pill',
					attr: {
						type: 'button',
						'aria-label':
							this.plugin.t('common.copyId'),
						title: this.plugin.t('common.copyId'),
					},
				}
			);

			const copyIdIcon =
				copyIdBtn.createSpan();

			setIcon(copyIdIcon, 'hash');

			copyIdBtn.createSpan({
				text: this.plugin.t('common.copyId'),
			});

			copyIdBtn.addEventListener(
				'click',
				(e) => {
					e.stopPropagation();
					e.preventDefault();

					void this.copyToClipboard(
						id,
						this.plugin.t('common.idCopied')
					);
				}
			);
		}

		if (url) {
			const copyLinkBtn = footer.createEl(
				'button',
				{
					cls: 'sentilis-action-pill',
					attr: {
						type: 'button',
						'aria-label':
							this.plugin.t('common.copyLink'),
						title: this.plugin.t('common.copyLink'),
					},
				}
			);

			const copyLinkIcon =
				copyLinkBtn.createSpan();

			setIcon(copyLinkIcon, 'copy');

			copyLinkBtn.createSpan({
				text: this.plugin.t('common.copyLink'),
			});

			copyLinkBtn.addEventListener(
				'click',
				(e) => {
					e.stopPropagation();
					e.preventDefault();

					void this.copyToClipboard(
						url,
						this.plugin.t('common.linkCopied')
					);
				}
			);

			const openBtn = footer.createEl('a', {
				href: url,
				cls: 'sentilis-action-pill is-primary',
				attr: {
					target: '_blank',
					rel: 'noopener',
					'aria-label':
						this.plugin.t('common.openLink'),
					title: this.plugin.t('common.openLink'),
				},
			});

			const openIcon = openBtn.createSpan();

			setIcon(openIcon, 'external-link');

			openBtn.createSpan({
				text: this.plugin.t('common.openLink'),
			});
		}
	}

	constructor(
		app: App,
		plugin: SentilisPluginInterface,
		pressId: string
	) {
		super(app);

		this.plugin = plugin;

		this.pressId = pressId;
	}

	async onOpen() {
		this.contentEl.addClass(
			'sentilis-premium-modal'
		);

		this.modalEl.addClass(
			'sentilis-large-modal'
		);

		await this.renderDetail();
	}

	private async renderDetail() {
		const { contentEl } = this;

		contentEl.empty();

		const profile =
			this.plugin.getCurrentProfile();

		if (!profile) {
			new Notice(
				this.plugin.t(
					'pressDetail.noProfile'
				)
			);

			this.close();

			return;
		}

		contentEl.createEl('p', {
			text: this.plugin.t(
				'pressDetail.loading'
			),
		});

		let item: PressDetailItem;

		try {
			const res = await new RestClient(profile.token).getPress(
				this.pressId
			);
			item = res.data;
		} catch (error) {
			contentEl.empty();

			contentEl.createEl('p', {
				text:
					(error as Error)?.message ||
					this.plugin.t('pressDetail.failedLoad'),
			});

			return;
		}

		contentEl.empty();

		const header = contentEl.createDiv({
			cls: 'sentilis-premium-header',
		});

		header.createEl('h1', {
			text: item.name,
			cls: 'sentilis-premium-title',
		});

		const meta = contentEl.createDiv({
			cls: 'sentilis-premium-meta',
		});

		const createMetaItem = (
			icon: string,
			label: string,
			value: string
		) => {
			const itemEl = meta.createDiv({
				cls: 'sentilis-meta-item',
			});

			const top = itemEl.createDiv({
				cls: 'sentilis-meta-top',
			});

			const iconEl = top.createSpan();

			setIcon(iconEl, icon);

			top.createSpan({
				text: label,
			});

			itemEl.createEl('strong', {
				text: value,
			});
		};

		createMetaItem(
			statusIconName(item.status),
			this.plugin.t('pressDetail.status'),
			item.status || '-'
		);

		createMetaItem(
			'globe',
			this.plugin.t(
				'pressDetail.visibility'
			),
			item.visibility || '-'
		);

		createMetaItem(
			'folder',
			this.plugin.t(
				'pressDetail.category'
			),
			item.category || '-'
		);

		if (
			item.children &&
			item.children.length > 0
		) {
			contentEl.createDiv({
				cls: 'sentilis-premium-divider',
			});

			const childrenHeader =
				contentEl.createDiv({
					cls: 'sentilis-children-premium-header',
				});

			childrenHeader.createEl('h2', {
				text: this.plugin.t(
					'pressDetail.children'
				),
			});

			childrenHeader.createEl('span', {
				text: String(
					item.children.length
				),
				cls: 'sentilis-children-badge',
			});

			const list = contentEl.createDiv({
				cls: 'sentilis-premium-list',
			});

			item.children.forEach((child) => {
				const row = list.createDiv({
					cls: 'sentilis-premium-row',
				});

				const left = row.createDiv({
					cls: 'sentilis-premium-row-left',
				});

				const childStatusIcon =
					left.createSpan({
						cls: statusIconClass(
							child.status
						),
						attr: {
							'aria-label':
								child.status ||
								'unknown',
							title:
								child.status || '',
						},
					});

				setIcon(
					childStatusIcon,
					statusIconName(child.status)
				);

				if (child.visibility) {
					const childVisIcon =
						left.createSpan({
							cls: visibilityIconClass(
								child.visibility
							),
							attr: {
								'aria-label':
									child.visibility ||
									'unknown',
								title:
									child.visibility || '',
							},
						});

					setIcon(
						childVisIcon,
						visibilityIconName(
							child.visibility
						)
					);
				}

				left.createEl('span', {
					text: child.name,
					cls: 'sentilis-row-title',
				});

				const right = row.createDiv({
					cls: 'sentilis-premium-row-right',
				});

				if (child.url) {
					const childLink =
						right.createEl('a', {
							href: child.url,
							cls: 'sentilis-inline-link',
							attr: {
								'aria-label':
									this.plugin.t(
										'pressDetail.openUrl'
									),
								title: this.plugin.t(
									'pressDetail.openUrl'
								),
							},
						});

					childLink.target = '_blank';

					childLink.addEventListener(
						'click',
						(e) => {
							e.stopPropagation();
						}
					);

					setIcon(
						childLink,
						'external-link'
					);

					this.addCopyButton(
						right,
						child.url
					);
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
