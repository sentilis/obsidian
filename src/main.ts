import { Notice, Plugin, TFile, TFolder } from 'obsidian';

import { DEFAULT_SETTINGS } from './settings/settings';
import { SentilisPluginSettings } from './settings/types';
import { SentilisSettingTab } from './settings/settings-tab';
import { ProfileService } from './services/profile-service';
import { ApiClient } from './api/api-client';
import { AuthService } from './services/auth-service';
import { ProfileSwitcherModal } from './modals/profile-switcher-modal';
import { SENTILIS_VIEW_TYPE } from './constants/views';
import { SentilisSidebarView } from './views/sidebar-view';
import { ContentService } from './services/content-service';
import { PublishService } from './services/publish-service';
import { I18nService } from './services/i18n-service';
import { NetworkService } from './services/network-service';
import { AssetService } from './services/asset-service';

export default class SentilisPlugin extends Plugin {
	settings: SentilisPluginSettings;
	profileService: ProfileService;
	apiClient: ApiClient;
	authService: AuthService;
	contentService: ContentService;
	publishService: PublishService;
	i18nService: I18nService;
	networkService: NetworkService;
	assetService: AssetService;
		
	async onload() {
		console.log('Sentilis plugin loaded');

		await this.loadSettings();

		this.profileService = new ProfileService(this);
		this.apiClient = new ApiClient();
		this.authService = new AuthService(this);
		this.contentService = new ContentService(this);
		this.publishService = new PublishService(this);
		this.i18nService = new I18nService(this);
		this.networkService = new NetworkService(this);
		this.assetService = new AssetService(this);
			
		//Settings
		this.addSettingTab(
			new SentilisSettingTab(this.app, this)
		);

		//Commands
		this.addCommand({
			id: 'sentilis-change-profile',
			name: this.t('settings.changeProfile'),
			callback: () => {
				if (
					this.settings.profiles
						.length === 0
				) {
					new Notice(
						'No profiles configured'
					);

					return;
				}

				new ProfileSwitcherModal(
					this.app,
					this
				).open();
			},
		});

		this.addCommand({
			id: 'open-sentilis-sidebar',
			name: this.t('settings.openSidebar'),
			callback: async () => {
				const leaf =
					this.app.workspace.getRightLeaf(
						false
					);

				if (!leaf) {
					return;
				}

				await leaf.setViewState({
					type: SENTILIS_VIEW_TYPE,
					active: true,
				});

				this.app.workspace.revealLeaf(
					leaf
				);
			},
		});

		//Views
		this.registerView(
			SENTILIS_VIEW_TYPE,
			(leaf) =>
				new SentilisSidebarView(
					leaf,
					this
				)
		);

		//Events
		this.registerEvent(
			this.app.workspace.on(
				'file-menu',
				(menu, file) => {
					const profileLabel =
						this.getCurrentProfileLabel();

					const t = (key: string): string => {
						return this.i18nService.t(key);
					};

					menu.addItem((item) => {
						item
							.setTitle(
								`Sentilis (${profileLabel})`
							)
							.setIcon('globe');

						const submenu =
							(item as any).setSubmenu();

						submenu.addItem((subItem: any) => {
							subItem
								.setTitle(
									this.t('publish.press')
								)
								.setIcon('upload')
								.onClick(async () => {
									if (
										file instanceof TFile &&
										file.extension === 'md'
									) {
										await this.publishService.publishPressFile(
											file
										);

										return;
									}

									if (
										file instanceof TFolder
									) {
										await this.publishService.publishPressFolder(
											file
										);

										return;
									}

									new Notice(
										'Only markdown files or folders can be published'
									);
								});
						});

						submenu.addItem((subItem: any) => {
							subItem
								.setTitle(
									'Publish to Market'
								)
								.setIcon('package')
								.onClick(async () => {
									if (
										file instanceof TFile &&
										file.extension === 'md'
									) {
										await this.publishService.publishMarketFile(
											file
										);
									} else {
										new Notice(
											'Only markdown files can be published'
										);
									}
								});
						});
					});
				}
			)
		);
	}

	onunload() {
		this.networkService.destroy();
		console.log('Sentilis plugin unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}
	

	async saveSettings() {
		await this.saveData(this.settings);
	}

	getCurrentProfile() {
		return this.settings.profiles.find(
			(profile) =>
				profile.id ===
				this.settings.defaultProfileId
		);
	}

	getCurrentProfileLabel(): string {
		const profile =
			this.getCurrentProfile();

		return profile
			? profile.username
			: 'No Profile';

	}

	t(key: string): string {
		return this.i18nService.t(key);
	}
}