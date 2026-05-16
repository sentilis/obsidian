import {
	App,
	Modal,
	Notice,
	setIcon,
} from 'obsidian';

import { SentilisPluginInterface } from '../types/plugin';

import {
	statusIconName,
	statusIconClass,
} from '../utils/status-icon';

interface ProductLike {
	name: string;
	url?: string;
	status?: string;
	visibility?: string;
	category?: string | null;
	kind?: string;
	price?: string | number;
	currency?:
		| string
		| { symbol?: string; name?: string };
	createdAt?: string;
}

export class ProductDetailModal extends Modal {
	plugin: SentilisPluginInterface;

	product: ProductLike;

	constructor(
		app: App,
		plugin: SentilisPluginInterface,
		product: ProductLike
	) {
		super(app);

		this.plugin = plugin;

		this.product = product;
	}

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
		url: string
	) {
		const btn = parent.createEl(
			'button',
			{
				cls: 'sentilis-inline-link sentilis-copy-btn',
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

	async onOpen() {
		const { contentEl } = this;

		contentEl.empty();

		contentEl.addClass(
			'sentilis-premium-modal'
		);

		this.modalEl.addClass(
			'sentilis-large-modal'
		);

		const product = this.product;

		const header = contentEl.createDiv({
			cls: 'sentilis-premium-header',
		});

		const statusIcon = header.createSpan(
			{
				cls: statusIconClass(
					product.status
				),
				attr: {
					'aria-label':
						product.status || 'unknown',
					title: product.status || '',
				},
			}
		);

		setIcon(
			statusIcon,
			statusIconName(product.status)
		);

		const titleEl = header.createEl(
			'h1',
			{
				text: product.name,
				cls: 'sentilis-premium-title',
			}
		);

		if (product.url) {
			const linkBtn = titleEl.createEl(
				'a',
				{
					href: product.url,
					cls: 'sentilis-inline-link',
					attr: {
						'aria-label':
							this.plugin.t(
								'productModal.openProduct'
							),
						title: this.plugin.t(
							'productModal.openProduct'
						),
					},
				}
			);

			linkBtn.target = '_blank';

			setIcon(linkBtn, 'external-link');

			this.addCopyButton(
				titleEl,
				product.url
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

			top.createSpan({ text: label });

			itemEl.createEl('strong', {
				text: value,
			});
		};

		if (product.price !== undefined) {
			const currencySymbol =
				typeof product.currency ===
				'object'
					? product.currency
							?.symbol || ''
					: product.currency || '';

			const currencyName =
				typeof product.currency ===
				'object'
					? product.currency?.name ||
						''
					: '';

			createMetaItem(
				'badge-dollar-sign',
				this.plugin.t(
					'productModal.price'
				),
				`${currencySymbol}${product.price} ${currencyName}`.trim()
			);
		}

		if (product.kind) {
			createMetaItem(
				'package',
				this.plugin.t(
					'productModal.kind'
				),
				product.kind
			);
		}

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
					'productModal.createdAt'
				),
				new Date(
					product.createdAt
				).toLocaleString()
			);
		}
	}

	onClose() {
		this.contentEl.empty();
	}
}
