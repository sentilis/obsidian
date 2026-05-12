import {
	App,
	Modal,
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

			contentEl.createEl('h2', {
				text: product.name,
			});

			contentEl.createEl('p', {
				text: `${this.plugin.t(
					'productModal.slug'
				)}: ${product.slug}`,
			});

			if (product.createdAt) {
				contentEl.createEl('p', {
					text: `${this.plugin.t(
						'marketDetail.createdAt'
					)}: ${new Date(
						product.createdAt
					).toLocaleString()}`,
				});
			}

			contentEl.createEl('p', {
				text: `${this.plugin.t(
					'productModal.kind'
				)}: ${product.kind}`,
			});

			contentEl.createEl('p', {
				text: `${this.plugin.t(
					'productModal.status'
				)}: ${product.status}`,
			});

			contentEl.createEl('p', {
				text: `${this.plugin.t(
					'productModal.visibility'
				)}: ${product.visibility}`,
			});

			const currencySymbol =
				typeof product.currency ===
				'object'
					? product.currency.symbol || ''
					: product.currency || '';

			const currencyName =
				typeof product.currency ===
				'object'
					? product.currency.name || ''
					: '';

			contentEl.createEl('p', {
				text: `${this.plugin.t(
					'productModal.price'
				)}: ${currencySymbol}${product.price} ${currencyName}`,
			});

			if (product.category) {
				contentEl.createEl(
					'p',
					{
						text: `${this.plugin.t(
							'productModal.category'
						)}: ${product.category}`,
					}
				);
			}

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