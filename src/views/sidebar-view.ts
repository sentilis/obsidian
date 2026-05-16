import {
	ItemView,
	WorkspaceLeaf,
	Menu,
	setIcon
} from 'obsidian';

import { SENTILIS_VIEW_TYPE } from '../constants/views';

import { SentilisPluginInterface } from '../types/plugin';

import { PressDetailModal } from '../modals/press-detail-modal';

import { ProductDetailModal } from '../modals/product-detail-modal';

import { ConfirmModal } from '../modals/confirm-modal';

import {
	statusIconName,
	statusIconClass,
} from '../utils/status-icon';

import { SENTILIS_EVENTS } from '../constants/events';

export class SentilisSidebarView extends ItemView {
	plugin: SentilisPluginInterface;

	activeTab: 'press' | 'market' =
		'press';

	private renderVersion = 0;

	constructor(
		leaf: WorkspaceLeaf,
		plugin: SentilisPluginInterface
	) {
		super(leaf);

		this.plugin = plugin;
	}

	getViewType(): string {
		return SENTILIS_VIEW_TYPE;
	}

	getDisplayText(): string {
		const currentProfile =
			this.plugin.getCurrentProfile();

		return currentProfile
			? `Sentilis (${currentProfile.username})`
			: 'Sentilis';
	}

	getIcon(): string {
		return 'layers';
	}

	async onOpen() {
		this.registerEvent(
			this.app.workspace.on(
				SENTILIS_EVENTS.PRESS_PUBLISHED as never,
				() => {
					void this.render();
				}
			)
		);

		this.registerEvent(
			this.app.workspace.on(
				SENTILIS_EVENTS.NETWORK_STATUS_CHANGED as never,
				() => {
					void this.render();
				}
			)
		);

		this.registerEvent(
			this.app.workspace.on(
				SENTILIS_EVENTS.PROFILE_CHANGED as never,
				() => {
					void this.render();
				}
			)
		);

		await this.render();
	}

	async onClose() {
		// cleanup future logic
	}

	private confirmDelete(
		name: string,
		onConfirm: () => Promise<void>
	) {
		new ConfirmModal(this.app, {
			title: this.plugin.t(
				'common.confirmDeleteTitle'
			),
			message: `${this.plugin.t(
				'rowElement.confirmDelete'
			)} "${name}"?`,
			confirmLabel: this.plugin.t(
				'rowElement.delete'
			),
			cancelLabel: this.plugin.t(
				'common.cancel'
			),
			danger: true,
			onConfirm,
		}).open();
	}

	async render() {

		const currentRender =
			++this.renderVersion;

		const { contentEl } = this;

		contentEl.empty();

		const currentProfile =
			this.plugin.getCurrentProfile();

		const sectionLabel =
			this.activeTab === 'press'
				? 'Press'
				: 'Market';

		contentEl.createEl('h2', {
			text: currentProfile
				? `Sentilis ${sectionLabel} (${currentProfile.username})`
				: `Sentilis ${sectionLabel}`,
		});

		if (
			this.plugin.networkService.getStatus()
		) {
			contentEl.createEl('div', {
				text: this.plugin.t(
					'sidebar.offline'
				),

				cls: 'sentilis-offline-indicator',
			});
		}

		const tabsEl =
			contentEl.createDiv({
				cls: 'sentilis-tabs',
			});

		const pressTab =
			tabsEl.createDiv({
				text: 'Press',

				cls: `sentilis-tab ${
					this.activeTab ===
					'press'
						? 'is-active'
						: ''
				}`,
			});

		const marketTab =
			tabsEl.createDiv({
				text: 'Market',

				cls: `sentilis-tab ${
					this.activeTab ===
					'market'
						? 'is-active'
						: ''
				}`,
			});

		pressTab.addEventListener(
			'click',
			() => {
				this.activeTab =
					'press';

				void this.render();
			}
		);

		marketTab.addEventListener(
			'click',
			() => {
				this.activeTab =
					'market';

				void this.render();
			}
		);

		if (!currentProfile) {
			contentEl.createEl('p', {
				text: 'No active profile selected',
			});

			return;
		}

		if (
			this.plugin.networkService.getStatus()
		) {
			contentEl.createEl('p', {
				text: this.plugin.t(
					'sidebar.offline'
				),
			});

			return;
		}

		const loadingEl =
			contentEl.createDiv({
				cls: 'sentilis-loading',
			});

		setIcon(
			loadingEl.createSpan({
				cls: 'sentilis-loading-spinner',
			}),
			'loader-2'
		);

		const press =
			await this.plugin.contentService.getRecentPress();

		const products =
			await this.plugin.contentService.getRecentProducts();

		if (currentRender !== this.renderVersion) {
			return;
		}

		loadingEl.remove();

		if (
			this.activeTab === 'press'
		) {
			if (press.length === 0) {
				this.renderEmpty(
					contentEl,
					'megaphone',
					this.plugin.t(
						'sidebar.noPress'
					)
				);
			}

			press.forEach((item) => {
				const itemEl =
					contentEl.createDiv({
						cls: 'sentilis-list-item',
					});

				itemEl.addEventListener(
					'click',
					() => {
						new PressDetailModal(
							this.app,
							this.plugin,
							item.id
						).open();
					}
				);

				itemEl.addEventListener(
					'contextmenu',
					(event) => {
						event.preventDefault();

						const menu =
							new Menu();

						menu.addItem(
							(itemMenu) => {
								itemMenu
									.setTitle(
										this.plugin.t(
											'rowElement.showDetails'
										)
									)
									.setIcon(
										'info'
									)
									.onClick(
										() => {
											new PressDetailModal(
												this.app,
												this.plugin,
												item.id
											).open();
										}
									);
							}
						);

						menu.addItem(
							(itemMenu) => {
								itemMenu
									.setTitle(
										this.plugin.t(
											'rowElement.openLink'
										)
									)
									.setIcon(
										'external-link'
									)
									.onClick(
										() => {
											if (
												item.url
											) {
												window.open(
													item.url,
													'_blank'
												);
											}
										}
									);
							}
						);

						menu.addItem(
							(itemMenu) => {
								itemMenu
									.setTitle(
										this.plugin.t(
											'rowElement.delete'
										)
									)
									.setIcon(
										'trash'
									)
									.setSection(
										'danger'
									)
									.onClick(
										() => {
											this.confirmDelete(
												item.name,
												async () => {
													await this.plugin.publishService.deletePress(
														item.id
													);
												}
											);
										}
									);
							}
						);

						menu.showAtMouseEvent(
							event
						);
					}
				);

				this.renderListRow(itemEl, {
					title: item.name,
					status: item.status,
					meta: [
						item.visibility,
						item.createdAt
							? new Date(
									item.createdAt
								).toLocaleDateString()
							: null,
					],
				});
			});
		}

		if (
			this.activeTab === 'market'
		) {
			if (
				products.length === 0
			) {
				this.renderEmpty(
					contentEl,
					'shopping-bag',
					this.plugin.t(
						'sidebar.noProducts'
					)
				);
			}

			products.forEach((item) => {
				const itemEl =
					contentEl.createDiv({
						cls: 'sentilis-list-item',
					});

				itemEl.addEventListener(
					'click',
					() => {
						new ProductDetailModal(
							this.app,
							this.plugin,
							item
						).open();
					}
				);

				itemEl.addEventListener(
					'contextmenu',
					(event) => {
						event.preventDefault();

						const menu =
							new Menu();

						menu.addItem(
							(itemMenu) => {
								itemMenu
									.setTitle(
										this.plugin.t(
											'rowElement.showDetails'
										)
									)
									.setIcon(
										'info'
									)
									.onClick(
										() => {
											new ProductDetailModal(
												this.app,
												this.plugin,
												item
											).open();
										}
									);
							}
						);

						menu.addItem(
							(itemMenu) => {
								itemMenu
									.setTitle(
										this.plugin.t(
											'rowElement.openLink'
										)
									)
									.setIcon(
										'external-link'
									)
									.onClick(
										() => {
											if (
												item.url
											) {
												window.open(
													item.url,
													'_blank'
												);
											}
										}
									);
							}
						);

						menu.addItem(
							(itemMenu) => {
								itemMenu
									.setTitle(
										this.plugin.t(
											'rowElement.delete'
										)
									)
									.setIcon(
										'trash'
									)
									.setSection(
										'danger'
									)
									.onClick(
										() => {
											this.confirmDelete(
												item.name,
												async () => {
													await this.plugin.publishService.deleteMarket(
														item.id
													);
												}
											);
										}
									);
							}
						);

						menu.showAtMouseEvent(
							event
						);
					}
				);

				this.renderListRow(itemEl, {
					title: item.name,
					status: item.status,
					meta: [
						item.kind,
						item.visibility,
						item.createdAt
							? new Date(
									item.createdAt
								).toLocaleDateString()
							: null,
					],
				});
			});
		}
	}

	private renderEmpty(
		parent: HTMLElement,
		icon: string,
		message: string
	) {
		const wrap = parent.createDiv({
			cls: 'sentilis-empty',
		});

		setIcon(
			wrap.createSpan({
				cls: 'sentilis-empty-icon',
			}),
			icon
		);

		wrap.createSpan({
			text: message,
			cls: 'sentilis-empty-text',
		});
	}

	private renderListRow(
		itemEl: HTMLElement,
		{
			title,
			status,
			meta,
		}: {
			title: string;
			status?: string;
			meta: Array<string | null | undefined>;
		}
	) {
		const headerEl = itemEl.createDiv({
			cls: 'sentilis-list-header',
		});

		if (status !== undefined) {
			const statusEl =
				headerEl.createSpan({
					cls: statusIconClass(status),
					attr: {
						'aria-label':
							status || 'unknown',
						title: status || '',
					},
				});

			setIcon(
				statusEl,
				statusIconName(status)
			);
		}

		const titleWrapper =
			headerEl.createDiv({
				cls: 'sentilis-row-title-wrapper',
			});

		titleWrapper.createEl('strong', {
			text: title,
		});

		const chevron =
			headerEl.createSpan({
				cls: 'sentilis-row-chevron',
			});

		setIcon(chevron, 'chevron-right');

		const filtered = meta.filter(
			(v): v is string => Boolean(v)
		);

		if (filtered.length === 0) {
			return;
		}

		const metaEl = itemEl.createDiv({
			cls: 'sentilis-list-meta',
		});

		filtered.forEach((value, index) => {
			if (index > 0) {
				metaEl.createSpan({
					text: '·',
					cls: 'sentilis-list-meta-sep',
				});
			}

			metaEl.createSpan({
				text: value,
				cls: 'sentilis-list-meta-item',
			});
		});
	}
}
