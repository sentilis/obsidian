import { Notice, requestUrl } from 'obsidian';

import { API_CONFIG } from './endpoints';
import { ApiResponse } from './types';
import { basicAuth } from './auth';
import { AUTH_ENDPOINT, MARKET_ENDPOINT, PRESS_ENDPOINT } from './endpoints';
import {
	PressItem,
	ProductItem,
	PressDetailItem
} from '../types/content';

export class ApiClient {
	async get<T>(
		endpoint: string,
		token?: string
	): Promise<ApiResponse<T>> {
		try {
			const response = await fetch(
				`${API_CONFIG.baseUrl}${endpoint}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						...(token && {
							Authorization: `Bearer ${token}`,
						}),
					},
				}
			);

			if (!response.ok) {
				return {
					success: false,
					error: `HTTP ${response.status}`,
				};
			}

			const data = await response.json();

			return {
				success: true,
				data,
			};
		} catch (error) {
			console.error(error);

			new Notice(
				'Network error while connecting to Sentilis'
			);

			return {
				success: false,
				error: 'Network error',
			};
		}
	}

	async validateToken(
		token: string
	): Promise<ApiResponse<string>> {
		try {
			const response =
				await requestUrl({
					url: `${API_CONFIG.baseUrl}${AUTH_ENDPOINT}`,
					method: 'GET',
					headers: {
						Authorization:
							basicAuth(token),
					},
				});

			const json = response.json;

			return {
				success: true,
				data: json.data.username,
			};
		} catch (error: any) {
			console.error(error);

			return {
				success: false,
				error:
					error?.message ||
					'Authentication failed',
			};
		}
	}

	async getPressList(
		token: string
	): Promise<ApiResponse<PressItem[]>> {
		try {
			const response =
				await requestUrl({
					url: `${API_CONFIG.baseUrl}${PRESS_ENDPOINT}`,
					method: 'GET',
					headers: {
						Authorization:
							basicAuth(token),
					},
				});

			return {
				success: true,
				data: response.json.data,
			};
		} catch (error: any) {
			console.error(error);

			return {
				success: false,
				error:
					error?.message ||
					'Failed to load press',
			};
		}
	}

	async getMarketList(
		token: string
	): Promise<ApiResponse<ProductItem[]>> {
		try {
			const response =
				await requestUrl({
					url: `${API_CONFIG.baseUrl}${MARKET_ENDPOINT}`,
					method: 'GET',
					headers: {
						Authorization:
							basicAuth(token),
					},
				});

			return {
				success: true,
				data: response.json.data,
			};
		} catch (error: any) {
			console.error(error);

			return {
				success: false,
				error:
					error?.message ||
					'Failed to load products',
			};
		}
	}

	async getPressDetail(
		token: string,
		id: string
	): Promise<ApiResponse<PressDetailItem>> {
		try {
			const response =
				await requestUrl({
					url: `${API_CONFIG.baseUrl}${PRESS_ENDPOINT}/${id}`,
					method: 'GET',
					headers: {
						Authorization:
							basicAuth(token),
					},
				});

			return {
				success: true,
				data: response.json.data,
			};
		} catch (error: any) {
			console.error(error);

			return {
				success: false,
				error:
					error?.message ||
					'Failed to load press detail',
			};
		}
	}

	async getProduct(
		token: string,
		id: string
	): Promise<any> {
		try {
			const response =
				await requestUrl({
					url: `${API_CONFIG.baseUrl}/openapi/v1/market/${id}`,

					method: 'GET',

					headers: {
						Authorization:
							basicAuth(token),
					},
				});

			return {
				success: true,

				data: response.json.data,
			};
		} catch (error: any) {
			console.error(error);

			return {
				success: false,

				error:
					error?.message ||
					'Failed to get product',
			};
		}
	}

	async uploadPress(
		token: string,
		formData: FormData
	): Promise<any> {
		try {
			const response =
				await fetch(
					`${API_CONFIG.baseUrl}${PRESS_ENDPOINT}`,
					{
						method: 'POST',

						headers: {
							Authorization:
								basicAuth(token),
						},

						body: formData,
					}
				);

			const text =
				await response.text();

			if (!response.ok) {
				return {
					success: false,

					error: text,
				};
			}

			const json =
				JSON.parse(text);

			return {
				success: true,

				data: json.data,
			};
		} catch (error: any) {
			console.error(error);

			return {
				success: false,

				error:
					error?.message ||
					'Failed to publish press',
			};
		}
	}

		async uploadProduct(
		token: string,
		formData: FormData
	): Promise<any> {
		try {
			const response =
				await fetch(
					`${API_CONFIG.baseUrl}/openapi/v1/market`,
					{
						method: 'POST',

						headers: {
							Authorization:
								basicAuth(token),
						},

						body: formData,
					}
				);

			const text =
				await response.text();

			if (!response.ok) {
				return {
					success: false,

					error: text,
				};
			}

			return {
				success: true,

				data: JSON.parse(text)
					.data,
			};
		} catch (error: any) {
			console.error(error);

			return {
				success: false,

				error:
					error?.message ||
					'Failed to upload product',
			};
		}
	}

	async removePress(
		token: string,
		id: string
	): Promise<any> {
		try {
			const response =
				await requestUrl({
					url: `${API_CONFIG.baseUrl}/openapi/v1/press/${id}`,

					method: 'DELETE',

					headers: {
						Authorization:
							basicAuth(token),
					},
				});

			return {
				success: true,

				data: response.json,
			};
		} catch (error: any) {
			console.error(error);

			return {
				success: false,

				error:
					error?.message ||
					'Failed to delete press',
			};
		}
	}

	async removeProduct(
		token: string,
		id: string
	): Promise<any> {
		try {
			const response =
				await requestUrl({
					url: `${API_CONFIG.baseUrl}/openapi/v1/market/${id}`,

					method: 'DELETE',

					headers: {
						Authorization:
							basicAuth(token),
					},
				});

			return {
				success: true,

				data: response.json,
			};
		} catch (error: any) {
			console.error(error);

			return {
				success: false,

				error:
					error?.message ||
					'Failed to delete product',
			};
		}
	}
}