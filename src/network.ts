import { SentilisPluginInterface } from './plugin';
import { SENTILIS_EVENTS } from './events';

export class NetworkService {
	plugin: SentilisPluginInterface;

	isOffline = false;

	constructor(plugin: SentilisPluginInterface) {
		this.plugin = plugin;

		this.isOffline =
			!navigator.onLine;

		window.addEventListener(
			'online',
			this.handleOnline
		);

		window.addEventListener(
			'offline',
			this.handleOffline
		);
	}

	handleOnline = () => {
		this.isOffline = false;

		this.plugin.app.workspace.trigger(
			SENTILIS_EVENTS.NETWORK_STATUS_CHANGED
		);
	};

	handleOffline = () => {

		this.isOffline = true;

        this.plugin.app.workspace.trigger(
            SENTILIS_EVENTS.NETWORK_STATUS_CHANGED
        );
	};

	getStatus(): boolean {
		return this.isOffline;
	}

	destroy() {
		window.removeEventListener(
			'online',
			this.handleOnline
		);

		window.removeEventListener(
			'offline',
			this.handleOffline
		);
	}
}
