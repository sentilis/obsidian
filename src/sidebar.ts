import {
	ItemView,
	WorkspaceLeaf,
	Menu,
	setIcon
} from 'obsidian';

import { SENTILIS_VIEW_TYPE, SENTILIS_EVENTS } from './events';

import { SentilisPluginInterface } from './plugin';

import { PressDetailModal } from './press/modal';

import { ProductDetailModal } from './market/modal';

import { BioDetailModal } from './bio/modal';

import { ConfirmModal } from './ui/confirm-modal';

import {
	statusIconName,
	statusIconClass,
	visibilityIconName,
	visibilityIconClass,
} from './ui/status-icon';

export class SentilisSidebarView extends ItemView {
	plugin: SentilisPluginInterface;

	activeTab: 'press' | 'market' | 'bio' =
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
				: this.activeTab === 'market'
					? 'Market'
					: 'Bio';

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

		const bioTab =
			tabsEl.createDiv({
				text: 'Bio',

				cls: `sentilis-tab ${
					this.activeTab ===
					'bio'
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

		bioTab.addEventListener(
			'click',
			() => {
				this.activeTab =
					'bio';

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

		const bios =
			await this.plugin.contentService.getRecentBios();

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
					visibility: item.visibility,
					meta: [item.category],
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
					visibility: item.visibility,
					meta: [item.kind, item.category],
				});
			});
		}

		if (
			this.activeTab === 'bio'
		) {
			if (bios.length === 0) {
				this.renderEmpty(
					contentEl,
					'user',
					this.plugin.t(
						'sidebar.noBios'
					)
				);
			}

			bios.forEach((item) => {
				const itemEl =
					contentEl.createDiv({
						cls: 'sentilis-list-item',
					});

				itemEl.addEventListener(
					'click',
					() => {
						new BioDetailModal(
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
											new BioDetailModal(
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
													await this.plugin.publishService.deleteBio(
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
					visibility: item.visibility,
					meta: [item.language, item.role],
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
			visibility,
		}: {
			title: string;
			status?: string;
			visibility?: string;
			meta?: Array<string | null | undefined>;
		}
	) {
		const row = itemEl.createDiv({
			cls: 'sentilis-row-line',
		});

		if (status !== undefined) {
			const statusEl = row.createSpan({
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
		} else {
			row.createSpan({
				cls: 'sentilis-row-icon-placeholder',
			});
		}

		if (visibility !== undefined) {
			const visEl = row.createSpan({
				cls: visibilityIconClass(visibility),
				attr: {
					'aria-label':
						visibility || 'unknown',
					title: visibility || '',
				},
			});

			setIcon(
				visEl,
				visibilityIconName(visibility)
			);
		} else {
			row.createSpan({
				cls: 'sentilis-row-icon-placeholder',
			});
		}

		row.createEl('strong', {
			text: title,
			cls: 'sentilis-row-title',
		});
	}
}
