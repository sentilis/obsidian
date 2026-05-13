export interface SentilisProfile {
	id: string;
	username: string;
	token: string;
}

export interface SentilisPluginSettings {
	defaultProfileId: string | null;
	profiles: SentilisProfile[];
}