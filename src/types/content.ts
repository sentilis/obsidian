export interface PressItem {
	id: string;
	slug: string;
	name: string;
	status: string;
	visibility: string;
	url: string;
	createdAt?: string;
}

export interface ProductItem {
	id: string;
	slug: string;
	name: string;
	kind: string;
	url: string;
	createdAt?: string;
}

export interface PressDetailItem {
	id: string;
	slug: string;
	name: string;
	status: string;
	visibility: string;
	category?: string | null;
	url?: string;
	createdAt?: string;

	children?: {
		id: string;
		name: string;
		status?: string;
		visibility?: string;
	}[];
}