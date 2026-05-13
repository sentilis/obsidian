import {
	App,
	Modal,
	setIcon,
} from 'obsidian';

import { SentilisPluginInterface } from '../types/plugin';

export class ProductDetailModal extends Modal {
	plugin: SentilisPluginInterface;

	product: any;

	constructor(
		app: App,
		plugin: SentilisPluginInterface,
		product: any
	) {
		super(app);

		this.plugin = plugin;

		this.product = product;
	}

	async onOpen() {
		const {
			contentEl,
		} = this;

		contentEl.empty();

		contentEl.createEl('h2', {
			text: this.plugin.t(
				'productModal.title'
			),
		});

		contentEl.createEl('p', {
			text: this.plugin.t(
				'productModal.loading'
			),
		});

		try {
			const product =
				this.product;

			contentEl.empty();

			const header =
				contentEl.createDiv({
					cls: 'sentilis-premium-header',
				});

			const iconWrapper =
				header.createDiv({
					cls: 'sentilis-premium-icon',
				});

			setIcon(
				iconWrapper,
				'package'
			);

			header.createEl('h1', {
				text: product.name,
				cls: 'sentilis-premium-title',
			});

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

			const currencySymbol =
				typeof product.currency ===
				'object'
					? product.currency.symbol ||
					''
					: product.currency || '';

			const currencyName =
				typeof product.currency ===
				'object'
					? product.currency.name ||
					''
					: '';

			createMetaItem(
				'badge-dollar-sign',
				this.plugin.t(
					'productModal.price'
				),
				`${currencySymbol}${product.price} ${currencyName}`
			);

			createMetaItem(
				'package',
				this.plugin.t(
					'productModal.kind'
				),
				product.kind || '-'
			);

			createMetaItem(
				'circle-dot',
				this.plugin.t(
					'productModal.status'
				),
				product.status || '-',
				true
			);

			createMetaItem(
				'globe',
				this.plugin.t(
					'productModal.visibility'
				),
				product.visibility || '-'
			);

			if (product.category) {
				createMetaItem(
					'folder',
					this.plugin.t(
						'productModal.category'
					),
					product.category
				);
			}

			if (product.createdAt) {
				createMetaItem(
					'calendar',
					this.plugin.t(
						'marketDetail.createdAt'
					),
					new Date(
						product.createdAt
					).toLocaleString()
				);
			}

			contentEl.createDiv({
				cls: 'sentilis-premium-divider',
			});


			if (product.url) {
				const link =
					contentEl.createEl(
						'a',
						{
							text: this.plugin.t(
								'productModal.openProduct'
							),

							href: product.url,
						}
					);

				link.target =
					'_blank';
			}
		} catch (error: any) {
			contentEl.empty();

			contentEl.createEl('p', {
				text:
					error?.message ||
					this.plugin.t(
						'productModal.error'
					),
			});
		}
	}

	onClose() {
		this.contentEl.empty();
	}
}