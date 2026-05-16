import {
	App,
	Modal,
	Notice,
	setIcon,
} from 'obsidian';

import { PressDetailItem } from '../types/content';

import { SentilisPluginInterface } from '../types/plugin';

import {
	statusIconName,
	statusIconClass,
} from '../utils/status-icon';

export class PressDetailModal extends Modal {
	plugin: SentilisPluginInterface;

	pressId: string;

	private async copyToClipboard(
		value: string
	) {
		try {
			await navigator.clipboard.writeText(
				value
			);

			new Notice(
				this.plugin.t(
					'common.linkCopied'
				)
			);
		} catch {
			new Notice(value);
		}
	}

	private addCopyButton(
		parent: HTMLElement,
		url: string,
		variant: 'inline' | 'row' = 'inline'
	) {
		const btn = parent.createEl(
			'button',
			{
				cls:
					variant === 'inline'
						? 'sentilis-inline-link sentilis-copy-btn'
						: 'sentilis-inline-link',
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

				void this.copyToClipboard(url);
			}
		);

		setIcon(btn, 'copy');
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

		const result =
			await this.plugin.apiClient.getPressDetail(
				profile.token,
				this.pressId
			);

		contentEl.empty();

		if (
			!result.success ||
			!result.data
		) {
			contentEl.createEl('p', {
				text:
					result.error ||
					this.plugin.t(
						'pressDetail.failedLoad'
					),
			});

			return;
		}

		const item: PressDetailItem =
			result.data;

		const header = contentEl.createDiv({
			cls: 'sentilis-premium-header',
		});

		const statusIcon = header.createSpan(
			{
				cls: statusIconClass(item.status),
				attr: {
					'aria-label':
						item.status || 'unknown',
					title: item.status || '',
				},
			}
		);

		setIcon(
			statusIcon,
			statusIconName(item.status)
		);

		const titleEl = header.createEl(
			'h1',
			{
				text: item.name,
				cls: 'sentilis-premium-title',
			}
		);

		if (item.url) {
			const linkBtn = titleEl.createEl(
				'a',
				{
					href: item.url,
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
				}
			);

			linkBtn.target = '_blank';

			setIcon(linkBtn, 'external-link');

			this.addCopyButton(
				titleEl,
				item.url,
				'inline'
			);
		}

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

		createMetaItem(
			'calendar',
			this.plugin.t(
				'pressDetail.createdAt'
			),
			item.createdAt
				? new Date(
						item.createdAt
					).toLocaleString()
				: '-'
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

				left.createEl('span', {
					text: child.name,
					cls: 'sentilis-row-title',
				});

				const right = row.createDiv({
					cls: 'sentilis-premium-row-right',
				});

				if (child.visibility) {
					right.createEl('span', {
						text: child.visibility,
						cls: 'sentilis-premium-visibility',
					});
				}

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
						child.url,
						'row'
					);
				}
			});
		}
	}

	onClose() {
		this.contentEl.empty();
	}
}
