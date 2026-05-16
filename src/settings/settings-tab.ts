import {
	App,
	PluginSettingTab,
	Setting,
	setIcon,
} from 'obsidian';

import { SentilisPluginInterface } from '../types/plugin';
import { AddProfileModal } from '../modals/add-profile-modal';
import { ConfirmModal } from '../modals/confirm-modal';
import { SENTILIS_VIEW_TYPE } from '../constants/views';

export class SentilisSettingTab extends PluginSettingTab {
	plugin: SentilisPluginInterface;

	constructor(
		app: App,
		plugin: SentilisPluginInterface
	) {
		super(app, plugin);

		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName(
				this.plugin.t(
					'addProfile.addNewToken'
				)
			)
			.setDesc(
				this.plugin.t(
					'addProfile.addNewTokenDesc'
				)
			)
			.addButton((button) => {
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
			.setHeading();

		this.plugin.settings.profiles.forEach(
			(profile) => {
				const isActive =
					profile.id ===
					this.plugin.settings
						.defaultProfileId;

				const profileSetting =
					new Setting(containerEl);

				const nameEl =
					profileSetting.nameEl;

				nameEl.empty();

				if (isActive) {
					const iconEl =
						nameEl.createSpan({
							cls: 'sentilis-active-icon',
							attr: {
								'aria-label':
									this.plugin.t(
										'settings.active'
									),
								title: this.plugin.t(
									'settings.active'
								),
							},
						});

					setIcon(
						iconEl,
						'check-circle-2'
					);
				}

				nameEl.createSpan({
					text: profile.username,
				});

				const descEl =
					profileSetting.descEl;

				descEl.empty();

				descEl.createSpan({
					text: `${profile.token.slice(
						0,
						8
					)}…`,
				});

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
