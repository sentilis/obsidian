import { App, PluginSettingTab, Setting, Notice } from 'obsidian';

import { SentilisPluginInterface } from '../types/plugin';
import { AddProfileModal } from '../modals/add-profile-modal';
import { SENTILIS_VIEW_TYPE } from '../constants/views';

export class SentilisSettingTab extends PluginSettingTab {
	plugin: SentilisPluginInterface;

	constructor(app: App, plugin: SentilisPluginInterface) {
		super(app, plugin);

		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName(this.plugin.t('addProfile.addNewToken'))
			.setDesc(this.plugin.t('addProfile.addNewTokenDesc'))
			.addButton((button) => {
				button
					.setButtonText(this.plugin.t('addProfile.addNewToken'))
					.setCta()
					.onClick(() => {
						new AddProfileModal(
							this.app,
							this.plugin,
							() => {
								this.display();
							},
						).open();
					});
			});
			
		if (this.plugin.settings.profiles.length > 0) {
			new Setting(containerEl)
				.setName(this.plugin.t('settings.defaultProfile'))
				.setDesc(this.plugin.t('settings.defaultProfileDesc'))
				.addDropdown((dropdown) => {
					this.plugin.settings.profiles.forEach(
						(profile) => {
							dropdown.addOption(
								profile.id,
								profile.username
							);
						}
					);

					dropdown
						.setValue(
							this.plugin.settings
								.defaultProfileId || ''
						)
						.onChange(async (value) => {
							this.plugin.settings.defaultProfileId =
								value;

							await this.plugin.saveSettings();

							this.display();

							this.app.workspace
								.getLeavesOfType(
									SENTILIS_VIEW_TYPE
								)
								.forEach((leaf) => {
									const view: any = leaf.view;

									if (view && typeof view.render === 'function') {
										view.render();
									}
								});
						});
				});
	    }



		new Setting(containerEl)
			.setName(this.plugin.t('settings.profiles'))
			.setHeading();

		 this.plugin.settings.profiles.forEach(
			(profile) => {
				const profileSetting = new Setting(
					containerEl
				)
					.setName(profile.username)
					.setDesc('');

				const descEl =
					profileSetting.descEl;

				descEl.empty();

				descEl.createSpan({
					text: `Token: ${profile.token.slice(
						0,
						8
					)}...`,
				});

				if (
					profile.id ===
					this.plugin.settings.defaultProfileId
				) {
					descEl.createSpan({
						text: this.plugin.t('settings.active'),
						cls: 'sentilis-active-badge',
					});
				}

				if (
	profile.id ===
	this.plugin.settings
		.defaultProfileId
) {
	profileSetting.settingEl.addClass(
		'sentilis-default-profile'
	);
}

				profileSetting.addButton((button) => {
					button
						.setButtonText(this.plugin.t('settings.deleteProfile'))
						.setWarning()
						.onClick(async () => {
							this.plugin.settings.profiles =
								this.plugin.settings.profiles.filter(
									(item) =>
										item.id !== profile.id
								);

							if (
								this.plugin.settings
									.defaultProfileId ===
								profile.id
							) {
								this.plugin.settings.defaultProfileId =
									null;
							}

							await this.plugin.saveSettings();

							this.display();
						});
				});
			}
		);
	}
}