import { Plugin } from 'obsidian';

import {
	SentilisPluginSettings,
	SentilisProfile,
} from '../settings/types';

import { ProfileService } from '../services/profile-service';
import { ApiClient } from '../api/api-client';
import { AuthService } from '../services/auth-service';
import { ContentService } from '../services/content-service';
import { PublishService } from '../services/publish-service';
import { I18nService } from '../services/i18n-service';
import { NetworkService } from '../services/network-service';
import { AssetService } from '../services/asset-service';

export interface SentilisPluginInterface
	extends Plugin {
	settings: SentilisPluginSettings;
	profileService: ProfileService;
	apiClient: ApiClient;
	authService: AuthService;
	contentService: ContentService;
	publishService: PublishService;
	i18nService: I18nService;
	networkService: NetworkService;
	assetService: AssetService;
		
	loadSettings(): Promise<void>;

	saveSettings(): Promise<void>;

	getCurrentProfile():
		| SentilisProfile
		| undefined;

	getCurrentProfileLabel(): string;

	t(key: string): string;
}