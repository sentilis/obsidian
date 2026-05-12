import {
	ItemView,
	WorkspaceLeaf,
	Menu
} from 'obsidian';

import { SENTILIS_VIEW_TYPE } from '../constants/views';
import { SentilisPluginInterface } from '../types/plugin';
import { PressDetailModal } from '../modals/press-detail-modal';
import { ProductDetailModal } from '../modals/product-detail-modal';
import { SENTILIS_EVENTS } from '../constants/events';

export class SentilisSidebarView extends ItemView {
	plugin: SentilisPluginInterface;

	activeTab: 'press' | 'market' =
		'press';

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
		return 'globe';
	}

	async onOpen() {
		this.registerEvent(
			this.app.workspace.on(
				SENTILIS_EVENTS.PRESS_PUBLISHED,
				() => {
					this.render();
				}
			)
		);

		this.registerEvent(
			this.app.workspace.on(
				SENTILIS_EVENTS.NETWORK_STATUS_CHANGED,
				() => {
					this.render();
				}
			)
		);

		this.render();
	}

	async onClose() {
		// cleanup future logic
	}

	async render() {
		const { contentEl } = this;

		contentEl.empty();

		const currentProfile =
			this.plugin.getCurrentProfile();

		contentEl.createEl('h2', {
			text: currentProfile
				? `Sentilis (${currentProfile.username})`
				: 'Sentilis',
		});

		if (this.plugin.networkService.getStatus()) {
			contentEl.createEl('div', {
				text: this.plugin.t('sidebar.offline'),

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

				this.render();
			}
		);

		marketTab.addEventListener(
			'click',
			() => {
				this.activeTab =
					'market';

				this.render();
			}
		);

		if (!currentProfile) {
			contentEl.createEl('p', {
				text: 'No active profile selected',
			});

			return;
		}

		if (this.plugin.networkService.getStatus()) {
			contentEl.createEl('p', {
				text: this.plugin.t('sidebar.offline'),
			});

			return;
		}

		const loadingEl =
			contentEl.createEl('p', {
				text: this.plugin.t('sidebar.loadingMsg'),
			});

		const press =
			await this.plugin.contentService.getRecentPress();

		const products =
			await this.plugin.contentService.getRecentProducts();

		loadingEl.remove();

		if (this.activeTab === 'press') {
			contentEl.createEl('h3', {
				text: this.plugin.t(
					'sidebar.recentPress'
				),
			});

			if (press.length === 0) {
				contentEl.createEl('p', {
					text: this.plugin.t('sidebar.noPress'),
				});
			}

			press.forEach((item) => {

				const itemEl =
					contentEl.createDiv({
						cls: 'sentilis-list-item',
					});

				const headerEl =
					itemEl.createDiv({
						cls: 'sentilis-list-header',
					});

				const iconEl =
					headerEl.createSpan({
						cls: 'sentilis-list-icon',
					});

				iconEl.innerHTML = '📰';

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

						menu.addItem((itemMenu) => {
							itemMenu
								.setTitle(
									this.plugin.t('sidebar.rowElement.showDetails')
								)
								.setIcon('info')
								.onClick(() => {
									new PressDetailModal(
										this.app,
										this.plugin,
										item.id
									).open();
								});
						});

						menu.addItem((itemMenu) => {
							itemMenu
								.setTitle(
									this.plugin.t('sidebar.rowElement.openLink')
								)
								.setIcon('external-link')
								.onClick(() => {
									if (item.url) {
										window.open(
											item.url,
											'_blank'
										);
									}
								});
						});

						menu.addSeparator();

						menu.addItem((itemMenu) => {
							itemMenu.dom.addClass(
								'sentilis-danger-menu-item'
							);

							itemMenu
								.setTitle('Delete')
								.setIcon('trash')
								.onClick(async () => {
									const confirmed =
										window.confirm(
											`Delete "${item.name}"?`
										);

									if (!confirmed) {
										return;
									}

									await this.plugin.publishService.deletePress(
										item.id
									);
								});
						});

						menu.showAtMouseEvent(
							event
						);
					}
				);

				headerEl.createEl('strong', {
					text: item.name,
				});

				const metaEl =
					itemEl.createDiv({
						cls: 'sentilis-list-meta',
					});

				metaEl.createSpan({
					text: item.status,
					cls: 'sentilis-badge',
				});
			});
		}

		if (this.activeTab === 'market') {
			contentEl.createEl('h3', {
				text: this.plugin.t('sidebar.recentMarket'),
			});

			if (products.length === 0) {
				contentEl.createEl('p', {
					text: this.plugin.t('sidebar.noProducts'),
				});
			}

			products.forEach((item) => {
				const itemEl =
					contentEl.createDiv({
						cls: 'sentilis-list-item',
					});

				const headerEl =
					itemEl.createDiv({
						cls: 'sentilis-list-header',
					});

				const iconEl =
					headerEl.createSpan({
						cls: 'sentilis-list-icon',
					});

				iconEl.innerHTML = '📦';

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

						menu.addItem((itemMenu) => {
							itemMenu
								.setTitle(
									this.plugin.t(
										'sidebar.rowElement.showDetails'
									)
								)
								.setIcon('info')
								.onClick(() => {
									new ProductDetailModal(
										this.app,
										this.plugin,
										item
									).open();
								});
						});

						menu.addItem((itemMenu) => {
							itemMenu
								.setTitle(
									this.plugin.t(
										'sidebar.rowElement.openLink'
									)
								)
								.setIcon('external-link')
								.onClick(() => {
									if (item.url) {
										window.open(
											item.url,
											'_blank'
										);
									}
								});
						});

						menu.addSeparator();

						menu.addItem((itemMenu) => {
							itemMenu.dom.addClass(
								'sentilis-danger-menu-item'
							);

							itemMenu
								.setTitle(
									this.plugin.t(
										'sidebar.rowElement.delete'
									)
								)
								.setIcon('trash')
								.onClick(async () => {
									const confirmed =
										window.confirm(
											`${this.plugin.t(
												'sidebar.rowElement.confirmDelete'
											)} "${item.name}"?`
										);

									if (!confirmed) {
										return;
									}

									await this.plugin.publishService.deleteMarket(
										item.id
									);
								});
						});

						menu.showAtMouseEvent(
							event
						);
					}
				);

				headerEl.createEl('strong', {
					text: item.name,
				});

				const metaEl =
					itemEl.createDiv({
						cls: 'sentilis-list-meta',
					});

				metaEl.createSpan({
					text: item.kind,
					cls: 'sentilis-badge',
				});
			});
		}
	}
}