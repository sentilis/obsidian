import {
	App,
	PluginSettingTab,
	Setting,
	setIcon,
} from 'obsidian';

import { SentilisPluginInterface } from './plugin';
import { AddProfileModal } from './auth/add-modal';
import { ConfirmModal } from './ui/confirm-modal';
import { SENTILIS_VIEW_TYPE } from './events';

export class SentilisSettingTab extends PluginSettingTab {
	plugin: SentilisPluginInterface;

	constructor(
		app: App,
		plugin: SentilisPluginInterface
	) {
		super(app, plugin);

		this.plugin = plugin;
	}

	private static readonly LOGIN_URL =
		'https://id.sentilis.me/login?utm_source=obsidian&utm_medium=plugin&utm_campaign=settings&utm_content=login';

	private static readonly SIGNUP_URL =
		'https://id.sentilis.me/signup?utm_source=obsidian&utm_medium=plugin&utm_campaign=settings&utm_content=signup';

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName(
				this.plugin.t('settings.account')
			)
			.setHeading();

		new Setting(containerEl)
			.setName(
				this.plugin.t(
					'settings.yourAccount'
				)
			)
			.setDesc(
				this.plugin.t(
					'settings.accountDesc'
				)
			)
			.addButton((button) => {
				button
					.setButtonText(
						this.plugin.t(
							'settings.logIn'
						)
					)
					.setTooltip(
						SentilisSettingTab.LOGIN_URL
					)
					.onClick(() => {
						window.open(
							SentilisSettingTab.LOGIN_URL,
							'_blank'
						);
					});
			})
			.addButton((button) => {
				button
					.setButtonText(
						this.plugin.t(
							'settings.signUp'
						)
					)
					.setTooltip(
						SentilisSettingTab.SIGNUP_URL
					)
					.onClick(() => {
						window.open(
							SentilisSettingTab.SIGNUP_URL,
							'_blank'
						);
					});
			});

		if (
			this.plugin.settings.profiles
				.length > 0
		) {
			new Setting(containerEl)
				.setName(
					this.plugin.t(
						'settings.defaultProfile'
					)
				)
				.setDesc(
					this.plugin.t(
						'settings.defaultProfileDesc'
					)
				)
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
								.defaultProfileId ||
								''
						)
						.onChange(
							async (value) => {
								this.plugin.settings.defaultProfileId =
									value;

								await this.plugin.saveSettings();

								this.display();

								this.app.workspace
									.getLeavesOfType(
										SENTILIS_VIEW_TYPE
									)
									.forEach(
										(leaf) => {
											const view =
												leaf.view as {
													render?: () => void;
												};

											if (
												typeof view.render ===
												'function'
											) {
												view.render();
											}
										}
									);
							}
						);
				});
		}

		new Setting(containerEl)
			.setName(
				this.plugin.t(
					'settings.profiles'
				)
			)
			.setHeading()
			.addExtraButton((button) => {
				button
					.setIcon('plus')
					.setTooltip(
						this.plugin.t(
							'addProfile.addNewToken'
						)
					)
					.onClick(() => {
						new AddProfileModal(
							this.app,
							this.plugin,
							() => {
								this.display();
							}
						).open();
					});
			});

		this.plugin.settings.profiles.forEach(
			(profile) => {
				const isActive =
					profile.id ===
					this.plugin.settings
						.defaultProfileId;

				const profileSetting =
					new Setting(containerEl);

				profileSetting.settingEl.addClass(
					'sentilis-profile-setting'
				);

				const nameEl =
					profileSetting.nameEl;

				nameEl.empty();

				const iconEl =
					nameEl.createSpan({
						cls: isActive
							? 'sentilis-profile-icon is-active'
							: 'sentilis-profile-icon',
						attr: {
							'aria-label': isActive
								? this.plugin.t(
										'settings.active'
									)
								: '',
							title: isActive
								? this.plugin.t(
										'settings.active'
									)
								: '',
						},
					});

				setIcon(
					iconEl,
					isActive
						? 'check-circle-2'
						: 'circle'
				);

				nameEl.createSpan({
					text: profile.username,
					cls: 'sentilis-profile-username',
				});

				nameEl.createSpan({
					text: ' - ',
					cls: 'sentilis-profile-sep',
				});

				nameEl.createSpan({
					text: `${profile.token.slice(
						0,
						8
					)}…`,
					cls: 'sentilis-profile-token',
				});

				profileSetting.descEl.remove();

				profileSetting.addExtraButton(
					(button) => {
						button
							.setIcon('trash-2')
							.setTooltip(
								this.plugin.t(
									'settings.deleteProfile'
								)
							)
							.onClick(() => {
								new ConfirmModal(
									this.app,
									{
										title:
											this.plugin.t(
												'common.confirmDeleteTitle'
											),
										message: `${this.plugin.t(
											'settings.deleteProfile'
										)}: ${profile.username}`,
										confirmLabel:
											this.plugin.t(
												'rowElement.delete'
											),
										cancelLabel:
											this.plugin.t(
												'common.cancel'
											),
										danger: true,
										onConfirm:
											async () => {
												this.plugin.settings.profiles =
													this.plugin.settings.profiles.filter(
														(item) =>
															item.id !==
															profile.id
													);

												if (
													this.plugin
														.settings
														.defaultProfileId ===
													profile.id
												) {
													this.plugin.settings.defaultProfileId =
														null;
												}

												await this.plugin.saveSettings();

												this.display();
											},
									}
								).open();
							});
					}
				);
			}
		);
	}
}
