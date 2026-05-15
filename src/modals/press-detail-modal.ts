import {
	App,
	Modal,
	Notice,
	setIcon,
} from 'obsidian';

import { PressDetailItem } from '../types/content';

import { SentilisPluginInterface } from '../types/plugin';

export class PressDetailModal extends Modal {
	plugin: SentilisPluginInterface;

	pressId: string;

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
		const { contentEl } = this;

		contentEl.empty();

		contentEl.addClass(
			'sentilis-premium-modal'
		);

		this.modalEl.addClass(
			'sentilis-large-modal'
		);

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

		const header =
			contentEl.createDiv({
				cls: 'sentilis-premium-header',
			});

		const topRow =
			header.createDiv({
				cls: 'sentilis-premium-top-row',
			});

		const iconWrapper =
			topRow.createDiv({
				cls: 'sentilis-premium-icon',
			});

		setIcon(
			iconWrapper,
			'file-text'
		);

		topRow.createEl('h1', {
			text: item.name,
			cls: 'sentilis-premium-title',
		});

		if (item.url) {
			const button =
				topRow.createEl('a', {
					text: this.plugin.t(
						'pressDetail.openUrl'
					),

					href: item.url,

					cls: 'sentilis-premium-btn',
				});

			button.target =
				'_blank';

			const btnIcon =
				button.createSpan({
					cls: 'sentilis-btn-icon',
				});

			setIcon(
				btnIcon,
				'external-link'
			);
	}

		const meta =
			contentEl.createDiv({
				cls: 'sentilis-premium-meta',
			});

		const createMetaItem = (
			icon: string,
			label: string,
			value: string,
			status: boolean = false
		) => {
			const itemEl =
				meta.createDiv({
					cls: 'sentilis-meta-item',
				});

			const top =
				itemEl.createDiv({
					cls: 'sentilis-meta-top',
				});

			const iconEl =
				top.createSpan();

			setIcon(iconEl, icon);

			top.createSpan({
				text: label,
			});

			itemEl.createEl('strong', {
				text: value,
				cls: status
					? 'sentilis-status-success'
					: '',
			});
		};

		createMetaItem(
			'circle-dot',
			this.plugin.t(
				'pressDetail.status'
			),
			item.status || '-',
			true
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

		const divider =
			contentEl.createDiv({
				cls: 'sentilis-premium-divider',
			});

		if (
			item.children &&
			item.children.length > 0
		) {
			const childrenHeader =
				contentEl.createDiv({
					cls: 'sentilis-children-premium-header',
				});

			childrenHeader.createEl(
				'h2',
				{
					text: this.plugin.t(
						'pressDetail.children'
					),
				}
			);

			childrenHeader.createEl(
				'span',
				{
					text: String(
						item.children.length
					),

					cls: 'sentilis-children-badge',
				}
			);

			const list =
				contentEl.createDiv({
					cls: 'sentilis-premium-list',
				});

			item.children.forEach(
				(child) => {
					const row =
						list.createDiv({
							cls: 'sentilis-premium-row sentilis-clickable-row',
						});

					row.addEventListener(
						'click',
						() => {
							new PressDetailModal(
								this.app,
								this.plugin,
								child.id
							).open();
						}
					);

					const left =
						row.createDiv({
							cls: 'sentilis-premium-row-left',
						});

					const docIcon =
						left.createSpan({
							cls: 'sentilis-doc-icon',
						});

					setIcon(
						docIcon,
						'file-text'
					);

					left.createEl('span', {
						text: child.name,
						cls: 'sentilis-row-title',
					});

					const right =
						row.createDiv({
							cls: 'sentilis-premium-row-right',
						});

					if (child.status) {
						right.createEl(
							'span',
							{
								text: child.status,

								cls: 'sentilis-premium-pill',
							}
						);
					}

					if (child.visibility) {
						right.createEl(
							'span',
							{
								text: child.visibility,

								cls: 'sentilis-premium-visibility',
							}
						);
					}

					const chevron =
						right.createSpan({
							cls: 'sentilis-chevron',
						});

					setIcon(
						chevron,
						'chevron-right'
					);
				}
			);
		}
	}

	onClose() {
		this.contentEl.empty();
	}
}