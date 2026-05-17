import { moment } from 'obsidian';

import { SentilisPluginInterface } from './plugin';

export const translations = {
	en: {
		common: {
			cancel: 'Cancel',
			close: 'Close',
			confirm: 'Confirm',
			confirmDeleteTitle:
				'Confirm deletion',
			copyLink: 'Copy link',
			linkCopied: 'Link copied',
			openLink: 'Open link',
			copyId: 'Copy ID',
			idCopied: 'ID copied',
		},

		settings: {
			openSidebar: 'Open sidebar',

			changeProfile: 'Change profile',

			active_user: 'Active user',

			title: 'Sentilis settings',

			language: 'Language',

			selectLanguage:
				'Select plugin language',

			profiles: 'Profiles',

			defaultProfile:
				'Default profile',

			defaultProfileDesc:
				'Select the default active profile',

			active: 'Active',

			deleteProfile: 'Delete profile',

			account: 'Account',

			yourAccount: 'Your account',

			accountDesc:
				"Sign in to your Sentilis account at id.sentilis.me. Your API token is available in your profile and can be added below.",

			logIn: 'Log in',

			signUp: 'Sign up',
		},

		addProfile: {
			title: 'Add Sentilis profile',
			accessToken: 'Access token',
			save: 'Save',
			completeFields: 'Please complete all fields',
			tokenAlreadyExists:
				'This token has already been added',
			invalidToken:
				'Invalid Sentilis token',
			profileAdded:
				'Profile added successfully',
			addNewToken: 'Add profile',
			addNewTokenDesc:
				'Create a new Sentilis profile',
		},

		dryRun: {
			pressLabel: 'Dry run for Press',
			marketLabel:
				'Dry run for Market',
			allGood:
				'Everything looks good. Ready to publish.',
		},

		publish: {
			success:
				'Published successfully',

			failed:
				'Publish failed',

			uploading: 'Publishing…',

			publish: 'Publish',

			republish: 'Republish',

			validating: 'Validating…',

			cannotPublish:
				'Fix the errors before publishing',

			failedHint:
				'Could not publish. Run the validation to check the content.',

			noProfile:
				'No active profile',

			onlyMarkdown:
				'Only markdown files can be published',

			validationSuccess:
				'Press validation successful',

			press: 'Publish to Press',

			market: 'Publish to Market',

			bio: 'Publish to Bio',

			offline: 'Cannot publish while offline',

			marketMissingName:
				'Missing frontmatter: name',

			marketMissingSlug:
				'Missing frontmatter: slug',

			marketMissingKind:
				'Missing frontmatter: kind',

			marketMissingPrice:
				'Missing frontmatter: price',

			deleteFailed:
				'Delete failed',

			pressDeleted:
				'Press deleted successfully',

			marketDeleted:
				'Product deleted successfully',

			bioDeleted:
				'Bio deleted successfully',
		},

		sidebar: {
			noPress: 'No press yet',

			noProducts: 'No products yet',

			noBios: 'No bios yet',

			recentPress:
				'Recent Press',

			recentMarket:
				'Recent Market',

			recentBio:
				'Recent Bio',

			offline: 'Offline',
			loadingMsg: 'Loading…',

			rowElement: {
				showDetails: 'Show Details',
				openLink: 'Open Link',
				delete: 'Delete',
			}
		},

		productModal: {
			title: 'Product Details',

			loading: 'Loading...',

			noProfile:
				'No active profile',

			openProduct:
				'Open Product',

			slug: 'Slug',

			kind: 'Kind',

			status: 'Status',

			visibility: 'Visibility',

			price: 'Price',

			category: 'Category',

			error: 'Unknown error',

			createdAt: 'Created At',
		},

		rowElement: {
			showDetails:
				'Show Details',

			openLink:
				'Open Link',

			delete: 'Delete',

			confirmDelete:
				'Delete',
		},

		pressDetail: {
			loading: 'Loading...',

			noProfile:
				'No active profile',

			failedLoad:
				'Failed to load detail',

			status: 'Status',

			visibility: 'Visibility',

			category: 'Category',

			openUrl: 'Open URL',

			children: 'Sub-pages',

			createdAt: 'Created At',
		},

		bioDetail: {
			loading: 'Loading...',

			noProfile:
				'No active profile',

			failedLoad:
				'Failed to load detail',

			language: 'Language',

			status: 'Status',

			visibility: 'Visibility',

			role: 'Role',

			location: 'Location',

			email: 'Email',

			phone: 'Phone',

			openUrl: 'Open URL',

			variants: 'Language variants',

			createdAt: 'Created At',
		},
	},

	es: {
		common: {
			cancel: 'Cancelar',
			close: 'Cerrar',
			confirm: 'Confirmar',
			confirmDeleteTitle:
				'Confirmar eliminación',
			copyLink: 'Copiar enlace',
			linkCopied: 'Enlace copiado',
			openLink: 'Abrir enlace',
			copyId: 'Copiar ID',
			idCopied: 'ID copiado',
		},

		settings: {
			title: 'Configuración de Sentilis',

			changeProfile: 'Cambiar perfil',

			active_user: 'Usuario activo',

			openSidebar: 'Abrir barra lateral',

			language: 'Idioma',

			selectLanguage:
				'Selecciona el idioma del plugin',

			profiles: 'Perfiles',

			defaultProfile:
				'Perfil predeterminado',

			defaultProfileDesc:
				'Selecciona el perfil activo por defecto',

			active: 'Activo',

			deleteProfile: 'Eliminar perfil',

			account: 'Cuenta',

			yourAccount: 'Tu cuenta',

			accountDesc:
				'Inicia sesión en tu cuenta de Sentilis en id.sentilis.me. Tu token de API está disponible en tu perfil y puedes agregarlo abajo.',

			logIn: 'Iniciar sesión',

			signUp: 'Crear cuenta',
		},

		addProfile: {
			title: 'Agregar perfil de Sentilis',
			accessToken: 'Token de acceso',
			save: 'Guardar',
			completeFields:
				'Por favor completa todos los campos',
			tokenAlreadyExists:
				'Este token ya fue agregado',
			invalidToken:
				'Token de Sentilis inválido',
			profileAdded:
				'Perfil agregado correctamente',
			addNewToken: 'Agregar perfil',
			addNewTokenDesc:
				'Crea un nuevo perfil de Sentilis',
		},

		dryRun: {
			pressLabel:
				'Dry run para Press',
			marketLabel:
				'Dry run para Market',
			allGood:
				'Todo se ve bien. Listo para publicar.',
		},

		publish: {
			success:
				'Publicado correctamente',

			failed:
				'Error al publicar',

			uploading: 'Publicando…',

			publish: 'Publicar',

			republish: 'Re-publicar',

			validating: 'Validando…',

			cannotPublish:
				'Corrige los errores antes de publicar',

			failedHint:
				'No se pudo publicar. Ejecuta la validación para revisar el contenido.',

			noProfile:
				'No hay un perfil activo',

			onlyMarkdown:
				'Solo archivos markdown pueden publicarse',

			validationSuccess:
				'Validación exitosa',

			press: 'Publicar en Press',

			market: 'Publicar en Market',

			bio: 'Publicar en Bio',

			offline: 'No puedes publicar sin conexión',
			marketMissingName:
				'Falta frontmatter: name',

			marketMissingSlug:
				'Falta frontmatter: slug',

			marketMissingKind:
				'Falta frontmatter: kind',

			marketMissingPrice:
				'Falta frontmatter: price',

			deleteFailed:
				'Error al eliminar',

			pressDeleted:
				'Press eliminado correctamente',

			marketDeleted:
				'Producto eliminado correctamente',

			bioDeleted:
				'Bio eliminado correctamente',
		},

		sidebar: {
			open: 'Abrir Barra Lateral',

			noPress: 'Sin publicaciones',

			noProducts: 'Sin productos',

			noBios: 'Sin bios',

			recentPress:
				'Publicaciones recientes',

			recentMarket:
				'Productos recientes',

			recentBio:
				'Bios recientes',

			offline: 'Sin conexión',

			loadingMsg: 'Cargando…',

			rowElement: {
				showDetails: 'Mostrar Detalles',
				openLink: 'Abrir Enlace',
				delete: 'Eliminar',
			}
		},

		productModal: {
			title: 'Detalles del Producto',

			loading: 'Cargando...',

			noProfile:
				'No hay perfil activo',

			openProduct:
				'Abrir Producto',

			slug: 'Slug',

			kind: 'Tipo',

			status: 'Estado',

			visibility: 'Visibilidad',

			price: 'Precio',

			category: 'Categoría',

			error: 'Error desconocido',

			createdAt: 'Creado el',
		},

		rowElement: {
			showDetails:
				'Mostrar Detalles',

			openLink:
				'Abrir Enlace',

			delete: 'Eliminar',

			confirmDelete:
				'Eliminar',
		},

		pressDetail: {
			loading: 'Cargando...',

			noProfile:
				'No hay perfil activo',

			failedLoad:
				'Error al cargar detalle',

			status: 'Estado',

			visibility: 'Visibilidad',

			category: 'Categoría',

			openUrl: 'Abrir URL',

			children: 'Sub-páginas',

			createdAt: 'Creado el',
		},

		bioDetail: {
			loading: 'Cargando...',

			noProfile:
				'No hay perfil activo',

			failedLoad:
				'Error al cargar detalle',

			language: 'Idioma',

			status: 'Estado',

			visibility: 'Visibilidad',

			role: 'Rol',

			location: 'Ubicación',

			email: 'Correo',

			phone: 'Teléfono',

			openUrl: 'Abrir URL',

			variants: 'Variantes de idioma',

			createdAt: 'Creado el',
		},
	},
};

export class I18nService {
	plugin: SentilisPluginInterface;

	constructor(
		plugin: SentilisPluginInterface
	) {
		this.plugin = plugin;
	}

	t(key: string): string {
		const obsidianLanguage =
			moment.locale();

		const language =
			translations[obsidianLanguage as keyof typeof translations]
				? obsidianLanguage
				: 'en';

		const keys = key.split('.');

		let value: unknown =
			translations[language as keyof typeof translations];

		for (const k of keys) {
			if (
				typeof value === 'object' &&
				value !== null &&
				k in value
			) {
				value = (value as Record<string, unknown>)[k];
			} else {
				return key;
			}
		}

		return typeof value === 'string'
			? value
			: key;
	}
}
