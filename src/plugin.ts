import { Plugin } from 'obsidian';

import { SentilisPluginSettings } from './config';
import { SentilisProfile } from './auth/types';

import { ProfileService } from './auth/profile';
import { AuthService } from './auth/service';
import { ContentService } from './content';
import { PublishService } from './publish';
import { I18nService } from './i18n';
import { NetworkService } from './network';

export interface SentilisPluginInterface
	extends Plugin {
	settings: SentilisPluginSettings;
	profileService: ProfileService;
	authService: AuthService;
	contentService: ContentService;
	publishService: PublishService;
	i18nService: I18nService;
	networkService: NetworkService;

	loadSettings(): Promise<void>;

	saveSettings(): Promise<void>;

	getCurrentProfile():
		| SentilisProfile
		| undefined;

	getCurrentProfileLabel(): string;

	t(key: string): string;
}
