import {
	App,
	PluginSettingTab,
	Setting,
	setIcon,
	type SettingDefinitionItem,
} from 'obsidian';

import { SentilisPluginInterface } from './plugin';
import { SentilisProfile } from './auth/types';
import { AddProfileModal } from './auth/add-modal';
import { ConfirmModal } from './ui/confirm-modal';
import { SENTILIS_VIEW_TYPE } from './events';

const DEFAULT_PROFILE_KEY =
	'defaultProfileId';

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
		'https://sentilis.me/login?utm_source=obsidian&utm_medium=plugin&utm_campaign=settings&utm_content=login';

	private static readonly SIGNUP_URL =
		'https://sentilis.me/signup?utm_source=obsidian&utm_medium=plugin&utm_campaign=settings&utm_content=signup';

	getSettingDefinitions(): SettingDefinitionItem[] {
		const profiles =
			this.plugin.settings.profiles;

		return [
			{
				type: 'group',
				heading: this.plugin.t(
					'settings.account'
				),
				items: [
					{
						name: this.plugin.t(
							'settings.yourAccount'
						),
						desc: this.plugin.t(
							'settings.accountDesc'
						),
						render: (setting) => {
							this.renderAccountLinks(
								setting
							);
						},
					},
					{
						name: this.plugin.t(
							'settings.defaultProfile'
						),
						desc: this.plugin.t(
							'settings.defaultProfileDesc'
						),
						// Nothing to pick from until a
						// profile exists.
						visible: () =>
							this.plugin.settings
								.profiles.length >
							0,
						control: {
							type: 'dropdown',
							key: DEFAULT_PROFILE_KEY,
							options:
								Object.fromEntries(
									profiles.map(
										(
											profile
										) => [
											profile.id,
											profile.username,
										]
									)
								),
							defaultValue: '',
						},
					},
				],
			},
			{
				type: 'list',
				heading: this.plugin.t(
					'settings.profiles'
				),
				addItem: {
					name: this.plugin.t(
						'addProfile.addNewToken'
					),
					action: () => {
						this.openAddProfile();
					},
				},
				onDelete: (index) => {
					this.confirmDeleteProfile(
						index
					);
				},
				items: profiles.map(
					(profile) => ({
						name: profile.username,
						render: (setting) => {
							this.renderProfileRow(
								setting,
								profile
							);
						},
					})
				),
			},
		];
	}

	getControlValue(key: string): unknown {
		if (key === DEFAULT_PROFILE_KEY) {
			return (
				this.plugin.settings
					.defaultProfileId ?? ''
			);
		}

		return super.getControlValue(key);
	}

	async setControlValue(
		key: string,
		value: unknown
	): Promise<void> {
		if (key !== DEFAULT_PROFILE_KEY) {
			await super.setControlValue(
				key,
				value
			);

			return;
		}

		this.plugin.settings.defaultProfileId =
			typeof value === 'string' &&
			value !== ''
				? value
				: null;

		await this.plugin.saveSettings();

		// The active marker on each profile row
		// is derived from this value.
		this.update();

		this.refreshViews();
	}

	private renderAccountLinks(
		setting: Setting
	): void {
		setting
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
	}

	private renderProfileRow(
		setting: Setting,
		profile: SentilisProfile
	): void {
		const isActive =
			profile.id ===
			this.plugin.settings
				.defaultProfileId;

		setting.settingEl.addClass(
			'sentilis-profile-setting'
		);

		const nameEl = setting.nameEl;

		nameEl.empty();

		const iconEl = nameEl.createSpan({
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

		setting.descEl.remove();
	}

	private openAddProfile(): void {
		new AddProfileModal(
			this.app,
			this.plugin,
			() => {
				this.update();
			}
		).open();
	}

	private confirmDeleteProfile(
		index: number
	): void {
		const profile =
			this.plugin.settings.profiles[
				index
			];

		if (!profile) {
			return;
		}

		new ConfirmModal(this.app, {
			title: this.plugin.t(
				'common.confirmDeleteTitle'
			),
			message: `${this.plugin.t(
				'settings.deleteProfile'
			)}: ${profile.username}`,
			confirmLabel: this.plugin.t(
				'rowElement.delete'
			),
			cancelLabel: this.plugin.t(
				'common.cancel'
			),
			danger: true,
			onConfirm: async () => {
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

				this.update();
			},
		}).open();
	}

	private refreshViews(): void {
		this.app.workspace
			.getLeavesOfType(
				SENTILIS_VIEW_TYPE
			)
			.forEach((leaf) => {
				const view = leaf.view as {
					render?: () => void;
				};

				if (
					typeof view.render ===
					'function'
				) {
					view.render();
				}
			});
	}
}
