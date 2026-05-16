import { Menu, MenuItem, Notice, Plugin, TFile, TFolder } from "obsidian";

import { DEFAULT_SETTINGS, SentilisPluginSettings } from "./config";
import { SentilisSettingTab } from "./settings-tab";
import { ProfileService } from "./auth/profile";
import { AuthService } from "./auth/service";
import { ProfileSwitcherModal } from "./auth/switcher-modal";
import { PublishModal } from "./ui/publish-modal";
import { SENTILIS_VIEW_TYPE } from "./events";
import { SentilisSidebarView } from "./sidebar";
import { ContentService } from "./content";
import { PublishService } from "./publish";
import { I18nService } from "./i18n";
import { NetworkService } from "./network";

type MenuItemWithSubmenu = MenuItem & {
	setSubmenu(): Menu;
};

export default class SentilisPlugin extends Plugin {
	settings: SentilisPluginSettings;
	profileService: ProfileService;
	authService: AuthService;
	contentService: ContentService;
	publishService: PublishService;
	i18nService: I18nService;
	networkService: NetworkService;

	async onload() {
		await this.loadSettings();

		this.profileService = new ProfileService(this);
		this.authService = new AuthService();
		this.contentService = new ContentService(this);
		this.publishService = new PublishService(this);
		this.i18nService = new I18nService(this);
		this.networkService = new NetworkService(this);

		//Settings
		this.addSettingTab(new SentilisSettingTab(this.app, this));

		//Commands
		this.addCommand({
			id: "change-profile",
			name: this.t("settings.changeProfile"),
			callback: () => {
				if (this.settings.profiles.length === 0) {
					new Notice("No profiles configured");

					return;
				}

				new ProfileSwitcherModal(this.app, this).open();
			},
		});

		this.addCommand({
			id: "open-sidebar",
			name: this.t("settings.openSidebar"),
			callback: async () => {
				const leaf = this.app.workspace.getRightLeaf(false);

				if (!leaf) {
					return;
				}

				await leaf.setViewState({
					type: SENTILIS_VIEW_TYPE,
					active: true,
				});

				await this.app.workspace.revealLeaf(leaf);
			},
		});

		//Views
		this.registerView(
			SENTILIS_VIEW_TYPE,
			(leaf) => new SentilisSidebarView(leaf, this),
		);

		//Events
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				const profileLabel = this.getCurrentProfileLabel();

				menu.addItem((item) => {
					item.setTitle(`Sentilis (${profileLabel})`).setIcon(
						"layers",
					);

					const submenu = (item as MenuItemWithSubmenu).setSubmenu();

					const openPublish = (kind: "press" | "market" | "bio") => {
						if (
							!(file instanceof TFile && file.extension === "md") &&
							!(file instanceof TFolder)
						) {
							new Notice(
								"Only Markdown files or folders can be published",
							);
							return;
						}

						new PublishModal(this.app, this, {
							kind,
							target: file,
						}).open();
					};

					submenu.addItem((subItem) => {
						subItem
							.setTitle(this.t("publish.press"))
							.setIcon("megaphone")
							.onClick(() => openPublish("press"));
					});

					submenu.addItem((subItem) => {
						subItem
							.setTitle(this.t("publish.market"))
							.setIcon("shopping-bag")
							.onClick(() => openPublish("market"));
					});

					submenu.addItem((subItem) => {
						subItem
							.setTitle(this.t("publish.bio"))
							.setIcon("user")
							.onClick(() => openPublish("bio"));
					});
				});
			}),
		);
	}

	onunload() {
		this.networkService.destroy();
	}

	async loadSettings() {
		const saved = (await this.loadData()) as Partial<SentilisPluginSettings> | null;

		this.settings = {
			...DEFAULT_SETTINGS,
			...(saved ?? {}),
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	getCurrentProfile() {
		return this.settings.profiles.find(
			(profile) => profile.id === this.settings.defaultProfileId,
		);
	}

	getCurrentProfileLabel(): string {
		const profile = this.getCurrentProfile();

		return profile ? profile.username : "No Profile";
	}

	t(key: string): string {
		return this.i18nService.t(key);
	}
}
