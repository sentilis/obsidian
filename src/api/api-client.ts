import {
	Notice,
	requestUrl,
} from 'obsidian';

import {
	API_CONFIG,
	AUTH_ENDPOINT,
	MARKET_ENDPOINT,
	PRESS_ENDPOINT,
} from './endpoints';

import { ApiResponse } from './types';

import { basicAuth } from './auth';

import {
	PressItem,
	ProductItem,
	PressDetailItem,
} from '../types/content';

export class ApiClient {
	private async request<T>(
		url: string,
		method: string = 'GET',
		token?: string,
		body?: BodyInit
	): Promise<ApiResponse<T>> {
		try {
			const response =
				await requestUrl({
					url: `${API_CONFIG.baseUrl}${url}`,

					method,

					headers: {
						...(token && {
							Authorization:
								basicAuth(token),
						}),

						...(body instanceof
						FormData
							? {}
							: {
									'Content-Type':
										'application/json',
								}),
					},

					body,
				});

			return {
				success: true,

				data: response.json
					.data,
			};
		} catch (error: any) {

			console.log(
				'REQUEST ERROR',
				error
			);

			console.error(error);

			return {
				success: false,

				error:
					error?.message ||
					'Request failed',
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

			return {
				success: true,

				data: response.json
					.data.username,
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
	): Promise<
		ApiResponse<PressItem[]>
	> {
		const result =
			await this.request<
				PressItem[]
			>(
				`${PRESS_ENDPOINT}?visibility=public,private,protected,prime`,
				'GET',
				token
			);

		console.log(
			'PRESS LIST',
			result
		);

		return result;
	}

	async getMarketList(
		token: string
	): Promise<
		ApiResponse<ProductItem[]>
	> {
		return this.request<
			ProductItem[]
		>(
			MARKET_ENDPOINT,
			'GET',
			token
		);
	}

	async getPressDetail(
		token: string,
		id: string
	): Promise<
		ApiResponse<PressDetailItem>
	> {
		const result =
			await this.request<
				PressDetailItem
			>(
				`${PRESS_ENDPOINT}/${id}`,
				'GET',
				token
			);

		console.log(
			'PRESS DETAIL FULL',
			result
		);

		return result;
	}

	async getProduct(
		token: string,
		id: string
	): Promise<any> {
		const result =
			await this.request(
				`${MARKET_ENDPOINT}/${id}`,
				'GET',
				token
			);

		console.log(
			'MARKET DETAIL FULL',
			result
		);

		return result;
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
					`${API_CONFIG.baseUrl}${MARKET_ENDPOINT}`,
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
		return this.request(
			`${PRESS_ENDPOINT}/${id}`,
			'DELETE',
			token
		);
	}

	async removeProduct(
		token: string,
		id: string
	): Promise<any> {
		return this.request(
			`${MARKET_ENDPOINT}/${id}`,
			'DELETE',
			token
		);
	}
}