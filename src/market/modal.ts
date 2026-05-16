import {
	App,
	Modal,
	Notice,
	setIcon,
} from 'obsidian';

import { SentilisPluginInterface } from '../plugin';

import { ProductItem } from './types';

import {
	statusIconName,
} from '../ui/status-icon';

export class ProductDetailModal extends Modal {
	plugin: SentilisPluginInterface;

	product: ProductItem;

	constructor(
		app: App,
		plugin: SentilisPluginInterface,
		product: ProductItem
	) {
		super(app);

		this.plugin = plugin;

		this.product = product;
	}

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

		header.createEl('h1', {
			text: product.name,
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

			top.createSpan({ text: label });

			itemEl.createEl('strong', {
				text: value,
			});
		};

		createMetaItem(
			statusIconName(product.status),
			this.plugin.t('productModal.status'),
			product.status || '-'
		);

		createMetaItem(
			'globe',
			this.plugin.t(
				'productModal.visibility'
			),
			product.visibility || '-'
		);

		createMetaItem(
			'badge-dollar-sign',
			this.plugin.t(
				'productModal.price'
			),
			`${product.price} ${product.currency ?? ''}`.trim()
		);

		createMetaItem(
			'package',
			this.plugin.t(
				'productModal.kind'
			),
			product.kind
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

		this.renderFooter(contentEl, {
			url: product.url,
			id: product.id,
		});
	}

	onClose() {
		this.contentEl.empty();
	}
}
