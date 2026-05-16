import { SentilisProfile } from './auth/types';

export interface SentilisPluginSettings {
	defaultProfileId: string | null;
	profiles: SentilisProfile[];
}

export const DEFAULT_SETTINGS: SentilisPluginSettings = {
	defaultProfileId: null,
	profiles: [],
};
